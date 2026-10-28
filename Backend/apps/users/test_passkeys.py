"""Fingerprint sign-in, tested end to end with a software authenticator that signs like a phone would."""

import hashlib
import json
import os
import struct
from datetime import timedelta

import ecdsa
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.users import passkeys
from apps.users.models import Passkey, PasskeyChallenge
from apps.users.passkey_views import DEMO_EMAIL

User = get_user_model()
ORIGIN = "http://localhost:5173"
RP_ID = "localhost"


# --- A tiny CBOR writer, only for building what a real authenticator would send.
def cbor(value):
    def head(major, n):
        if n < 24:
            return bytes([major << 5 | n])
        if n < 256:
            return bytes([major << 5 | 24, n])
        return bytes([major << 5 | 25]) + struct.pack(">H", n)

    if isinstance(value, bool):
        return bytes([0xF5 if value else 0xF4])
    if isinstance(value, int):
        return head(0, value) if value >= 0 else head(1, -1 - value)
    if isinstance(value, bytes):
        return head(2, len(value)) + value
    if isinstance(value, str):
        raw = value.encode()
        return head(3, len(raw)) + raw
    if isinstance(value, list):
        return head(4, len(value)) + b"".join(cbor(v) for v in value)
    if isinstance(value, dict):
        return head(5, len(value)) + b"".join(cbor(k) + cbor(v) for k, v in value.items())
    raise TypeError(value)


class Phone:
    """A software authenticator holding one passkey."""

    def __init__(self, user_handle=b""):
        self.key = ecdsa.SigningKey.generate(curve=ecdsa.NIST256p)
        self.credential_id = os.urandom(32)
        self.counter = 0
        self.user_handle = user_handle

    def _client(self, kind, challenge, origin):
        return json.dumps(
            {"type": kind, "challenge": challenge, "origin": origin, "crossOrigin": False}
        ).encode()

    def _flags(self, uv=True):
        return 0x01 | (0x04 if uv else 0)

    def create(self, options, origin=ORIGIN, rp_id=RP_ID, uv=True):
        point = self.key.get_verifying_key().to_string()
        cose = {1: 2, 3: -7, -1: 1, -2: point[:32], -3: point[32:]}
        auth = (
            hashlib.sha256(rp_id.encode()).digest()
            + bytes([self._flags(uv) | 0x40])
            + struct.pack(">I", self.counter)
            + b"\0" * 16
            + struct.pack(">H", len(self.credential_id))
            + self.credential_id
            + cbor(cose)
        )
        client = self._client("webauthn.create", options["challenge"], origin)
        return {
            "id": passkeys.b64e(self.credential_id),
            "type": "public-key",
            "response": {
                "clientDataJSON": passkeys.b64e(client),
                "attestationObject": passkeys.b64e(
                    cbor({"fmt": "none", "attStmt": {}, "authData": auth})
                ),
            },
        }

    def get(self, options, origin=ORIGIN, rp_id=RP_ID, uv=True, key=None, bump=True, handle=None):
        if bump:
            self.counter += 1
        auth = (
            hashlib.sha256(rp_id.encode()).digest()
            + bytes([self._flags(uv)])
            + struct.pack(">I", self.counter)
        )
        client = self._client("webauthn.get", options["challenge"], origin)
        signature = (key or self.key).sign(
            auth + hashlib.sha256(client).digest(),
            hashfunc=hashlib.sha256,
            sigencode=ecdsa.util.sigencode_der,
        )
        handle = self.user_handle if handle is None else handle
        return {
            "id": passkeys.b64e(self.credential_id),
            "type": "public-key",
            "response": {
                "clientDataJSON": passkeys.b64e(client),
                "authenticatorData": passkeys.b64e(auth),
                "signature": passkeys.b64e(signature),
                "userHandle": passkeys.b64e(handle) if handle else None,
            },
        }


@pytest.fixture
def client(db):
    return APIClient(HTTP_ORIGIN=ORIGIN)


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="sam@example.com", password="sup3r-secret-pw", full_name="Sam Lee"
    )


@pytest.fixture
def signed_in(client, user):
    client.force_authenticate(user)
    return client


def register(client, phone, **kwargs):
    options = client.post(reverse("passkey_register_options")).json()
    return client.post(
        reverse("passkey_register_verify"),
        {"credential": phone.create(options, **kwargs), "label": "Pixel"},
        format="json",
    )


def sign_in(client, phone, **kwargs):
    options = client.post(reverse("passkey_login_options")).json()
    return client.post(
        reverse("passkey_login_verify"), {"credential": phone.get(options, **kwargs)}, format="json"
    )


class TestRegistration:
    def test_needs_a_signed_in_user(self, client):
        assert client.post(reverse("passkey_register_options")).status_code == 401

    def test_options_ask_for_a_built_in_fingerprint_with_a_discoverable_key(self, signed_in):
        options = signed_in.post(reverse("passkey_register_options")).json()
        assert options["rp"]["id"] == RP_ID
        assert options["pubKeyCredParams"] == [{"type": "public-key", "alg": -7}]
        select = options["authenticatorSelection"]
        assert (
            select["authenticatorAttachment"],
            select["residentKey"],
            select["userVerification"],
        ) == ("platform", "required", "required")
        assert passkeys.b64d(options["user"]["id"]) == User.objects.get().id.bytes

    def test_registers_and_stores_only_the_public_key(self, signed_in, user):
        phone = Phone(user.id.bytes)
        response = register(signed_in, phone)
        assert response.status_code == 201
        stored = Passkey.objects.get()
        assert stored.user == user and stored.label == "Pixel"
        assert passkeys.b64d(stored.public_key) == phone.key.get_verifying_key().to_string()

    def test_an_address_that_is_not_a_configured_frontend_is_refused(self, user):
        evil = APIClient(HTTP_ORIGIN="https://evil.example.com")
        evil.force_authenticate(user)
        assert evil.post(reverse("passkey_register_options")).status_code == 400
        assert APIClient().post(reverse("passkey_login_options")).status_code == 400

    def test_a_challenge_works_once(self, signed_in, user):
        phone = Phone(user.id.bytes)
        options = signed_in.post(reverse("passkey_register_options")).json()
        body = {"credential": phone.create(options)}
        assert (
            signed_in.post(reverse("passkey_register_verify"), body, format="json").status_code
            == 201
        )
        Passkey.objects.all().delete()
        assert (
            signed_in.post(reverse("passkey_register_verify"), body, format="json").status_code
            == 400
        )

    def test_an_expired_challenge_is_refused(self, signed_in, user):
        phone = Phone(user.id.bytes)
        options = signed_in.post(reverse("passkey_register_options")).json()
        PasskeyChallenge.objects.update(expires=timezone.now() - timedelta(seconds=1))
        body = {"credential": phone.create(options)}
        assert (
            signed_in.post(reverse("passkey_register_verify"), body, format="json").status_code
            == 400
        )

    def test_someone_elses_challenge_is_refused(self, signed_in, user):
        other = User.objects.create_user(email="other@example.com", password="sup3r-secret-pw")
        other_client = APIClient(HTTP_ORIGIN=ORIGIN)
        other_client.force_authenticate(other)
        options = other_client.post(reverse("passkey_register_options")).json()
        phone = Phone(user.id.bytes)
        response = signed_in.post(
            reverse("passkey_register_verify"), {"credential": phone.create(options)}, format="json"
        )
        assert response.status_code == 400

    @pytest.mark.parametrize(
        "kwargs",
        [{"origin": "https://evil.example.com"}, {"rp_id": "evil.example.com"}, {"uv": False}],
        ids=["wrong origin", "wrong relying party", "fingerprint not checked"],
    )
    def test_bad_ceremonies_are_refused(self, signed_in, user, kwargs):
        assert register(signed_in, Phone(user.id.bytes), **kwargs).status_code == 400
        assert not Passkey.objects.exists()

    def test_garbage_is_refused_not_a_server_error(self, signed_in):
        for body in (
            {},
            {"credential": "x"},
            {"credential": {"response": {}}},
            {"credential": {"response": {"clientDataJSON": "!!"}}},
        ):
            assert (
                signed_in.post(reverse("passkey_register_verify"), body, format="json").status_code
                == 400
            )

    def test_the_shared_demo_account_cannot_enrol(self, client, db):
        demo = User.objects.create_user(email=DEMO_EMAIL, password="demo1234")
        client.force_authenticate(demo)
        assert client.post(reverse("passkey_register_options")).status_code == 403
        assert (
            client.post(
                reverse("passkey_register_verify"), {"credential": {"response": {}}}, format="json"
            ).status_code
            == 403
        )


class TestSignIn:
    def enrolled(self, signed_in, user):
        phone = Phone(user.id.bytes)
        assert register(signed_in, phone).status_code == 201
        return phone

    def test_a_fingerprint_signs_in_and_the_tokens_work(self, signed_in, user):
        phone = self.enrolled(signed_in, user)
        anonymous = APIClient(HTTP_ORIGIN=ORIGIN)
        response = sign_in(anonymous, phone)
        assert response.status_code == 200
        anonymous.credentials(HTTP_AUTHORIZATION="Bearer " + response.json()["access"])
        assert anonymous.get(reverse("me")).json()["email"] == "sam@example.com"
        assert Passkey.objects.get().last_used is not None

    def test_login_options_need_no_account_and_name_no_credentials(self, client):
        options = client.post(reverse("passkey_login_options")).json()
        assert (
            options["allowCredentials"] == []
            and options["userVerification"] == "required"
            and options["rpId"] == RP_ID
        )

    def test_a_response_cannot_be_replayed(self, signed_in, user):
        phone = self.enrolled(signed_in, user)
        anonymous = APIClient(HTTP_ORIGIN=ORIGIN)
        options = anonymous.post(reverse("passkey_login_options")).json()
        body = {"credential": phone.get(options)}
        assert (
            anonymous.post(reverse("passkey_login_verify"), body, format="json").status_code == 200
        )
        assert (
            anonymous.post(reverse("passkey_login_verify"), body, format="json").status_code == 401
        )

    def test_a_signature_from_the_wrong_key_is_refused(self, signed_in, user):
        phone = self.enrolled(signed_in, user)
        forged = ecdsa.SigningKey.generate(curve=ecdsa.NIST256p)
        assert sign_in(APIClient(HTTP_ORIGIN=ORIGIN), phone, key=forged).status_code == 401

    @pytest.mark.parametrize(
        "kwargs",
        [{"origin": "https://evil.example.com"}, {"rp_id": "evil.example.com"}, {"uv": False}],
        ids=["wrong origin", "wrong relying party", "fingerprint not checked"],
    )
    def test_bad_ceremonies_are_refused(self, signed_in, user, kwargs):
        phone = self.enrolled(signed_in, user)
        assert sign_in(APIClient(HTTP_ORIGIN=ORIGIN), phone, **kwargs).status_code == 401

    def test_an_unknown_device_is_refused(self, signed_in, user):
        assert sign_in(APIClient(HTTP_ORIGIN=ORIGIN), Phone(user.id.bytes)).status_code == 401

    def test_a_credential_claiming_another_user_is_refused(self, signed_in, user):
        phone = self.enrolled(signed_in, user)
        other = User.objects.create_user(email="other@example.com", password="sup3r-secret-pw")
        assert (
            sign_in(APIClient(HTTP_ORIGIN=ORIGIN), phone, handle=other.id.bytes).status_code == 401
        )

    def test_a_counter_that_goes_backwards_is_refused(self, signed_in, user):
        phone = self.enrolled(signed_in, user)
        anonymous = APIClient(HTTP_ORIGIN=ORIGIN)
        phone.counter = 10
        assert sign_in(anonymous, phone, bump=False).status_code == 200
        phone.counter = 5
        assert sign_in(anonymous, phone, bump=False).status_code == 401

    def test_authenticators_that_always_report_zero_still_work(self, signed_in, user):
        phone = self.enrolled(signed_in, user)
        anonymous = APIClient(HTTP_ORIGIN=ORIGIN)
        assert sign_in(anonymous, phone, bump=False).status_code == 200
        assert sign_in(anonymous, phone, bump=False).status_code == 200

    def test_a_disabled_account_is_refused(self, signed_in, user):
        phone = self.enrolled(signed_in, user)
        User.objects.update(is_active=False)
        assert sign_in(APIClient(HTTP_ORIGIN=ORIGIN), phone).status_code == 403

    def test_the_demo_account_can_never_sign_in_this_way(self, client, db):
        demo = User.objects.create_user(email=DEMO_EMAIL, password="demo1234")
        phone = Phone(demo.id.bytes)
        Passkey.objects.create(
            user=demo,
            credential_id=passkeys.b64e(phone.credential_id),
            public_key=passkeys.b64e(phone.key.get_verifying_key().to_string()),
        )
        assert sign_in(client, phone).status_code == 403


class TestDevices:
    def test_list_and_remove_only_your_own(self, signed_in, user):
        phone = Phone(user.id.bytes)
        register(signed_in, phone)
        mine = signed_in.get(reverse("passkey_list")).json()
        assert [p["label"] for p in mine] == ["Pixel"] and "public_key" not in mine[0]

        other = User.objects.create_user(email="other@example.com", password="sup3r-secret-pw")
        stranger = APIClient(HTTP_ORIGIN=ORIGIN)
        stranger.force_authenticate(other)
        assert stranger.get(reverse("passkey_list")).json() == []
        assert stranger.delete(reverse("passkey_detail", args=[mine[0]["id"]])).status_code == 404
        assert Passkey.objects.count() == 1

        assert signed_in.delete(reverse("passkey_detail", args=[mine[0]["id"]])).status_code == 204
        assert not Passkey.objects.exists()

    def test_listing_needs_sign_in(self, client):
        assert client.get(reverse("passkey_list")).status_code == 401


class TestCbor:
    def test_reads_what_it_writes(self):
        value = {"fmt": "none", 1: [1, -7, True, b"\x00\x01"], -2: {"a": 300}}
        assert passkeys.cbor_loads(cbor(value)) == value

    @pytest.mark.parametrize(
        "raw",
        [b"", b"\x18", b"\x5f", b"\xa1\x01", cbor(1) + b"\x00"],
        ids=["empty", "short int", "indefinite", "short map", "trailing"],
    )
    def test_rejects_malformed_input(self, raw):
        with pytest.raises(passkeys.PasskeyError):
            passkeys.cbor_loads(raw)
