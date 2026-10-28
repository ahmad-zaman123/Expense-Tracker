"""Passkey (WebAuthn) verification, kept small and pure Python.

Only what fingerprint sign-in needs: a platform authenticator, a discoverable credential, ES256 keys and
no attestation. The one crypto dependency is `ecdsa` (pure Python), because this project avoids compiled
wheels on Vercel (see the google-auth pin in pyproject.toml).
"""

import base64
import hashlib
import hmac
import json
import secrets
import struct
from dataclasses import dataclass
from urllib.parse import urlparse

import ecdsa
from django.conf import settings

CHALLENGE_BYTES = 32
CHALLENGE_TTL_SECONDS = 300
ES256 = -7

FLAG_UP = 0x01  # user present
FLAG_UV = 0x04  # user verified (the fingerprint or face check)
FLAG_AT = 0x40  # attested credential data follows


class PasskeyError(Exception):
    """The browser's response didn't check out. The message is for logs, not for the user."""


def b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def b64d(text: str) -> bytes:
    if not isinstance(text, str):
        raise PasskeyError("expected a base64url string")
    try:
        return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))
    except ValueError as exc:
        raise PasskeyError("bad base64url") from exc


def new_challenge() -> str:
    return b64e(secrets.token_bytes(CHALLENGE_BYTES))


def relying_party(origin: str):
    """The page's origin must be one of the configured frontends; the relying-party id is its host name."""
    if origin not in settings.CORS_ALLOWED_ORIGINS:
        raise PasskeyError("origin not allowed")
    host = urlparse(origin).hostname
    if not host:
        raise PasskeyError("origin has no host")
    return host


# --- A minimal CBOR reader: the subset WebAuthn uses (ints, byte/text strings, arrays, maps, simple values).


def _cbor(data: bytes, i: int = 0, depth: int = 0):
    if depth > 8:
        raise PasskeyError("cbor too deep")
    if i >= len(data):
        raise PasskeyError("cbor truncated")
    major, info = data[i] >> 5, data[i] & 0x1F
    i += 1
    if info < 24:
        arg = info
    elif info in (24, 25, 26, 27):
        size = 1 << (info - 24)
        if i + size > len(data):
            raise PasskeyError("cbor truncated")
        arg = int.from_bytes(data[i : i + size], "big")
        i += size
    else:
        raise PasskeyError("unsupported cbor")
    if major == 0:
        return arg, i
    if major == 1:
        return -1 - arg, i
    if major in (2, 3):
        if i + arg > len(data):
            raise PasskeyError("cbor truncated")
        chunk = data[i : i + arg]
        return (chunk if major == 2 else chunk.decode("utf-8")), i + arg
    if major == 4:
        out = []
        for _ in range(arg):
            item, i = _cbor(data, i, depth + 1)
            out.append(item)
        return out, i
    if major == 5:
        out = {}
        for _ in range(arg):
            key, i = _cbor(data, i, depth + 1)
            value, i = _cbor(data, i, depth + 1)
            out[key] = value
        return out, i
    if major == 7 and info in (20, 21, 22):
        return {20: False, 21: True, 22: None}[info], i
    raise PasskeyError("unsupported cbor")


def cbor_loads(data: bytes):
    value, end = _cbor(data)
    if end != len(data):
        raise PasskeyError("trailing cbor bytes")
    return value


# --- Authenticator data


@dataclass
class AuthData:
    rp_id_hash: bytes
    flags: int
    counter: int
    credential_id: bytes = b""
    public_key: str = ""  # base64url of the 64-byte x || y point


def parse_auth_data(raw: bytes, expect_credential: bool) -> AuthData:
    if len(raw) < 37:
        raise PasskeyError("authenticator data too short")
    data = AuthData(raw[:32], raw[32], struct.unpack(">I", raw[33:37])[0])
    if not expect_credential:
        return data
    if not data.flags & FLAG_AT:
        raise PasskeyError("no credential in registration")
    if len(raw) < 55:
        raise PasskeyError("authenticator data too short")
    id_len = struct.unpack(">H", raw[53:55])[0]
    if id_len == 0 or id_len > 1023 or len(raw) < 55 + id_len:
        raise PasskeyError("bad credential id")
    data.credential_id = raw[55 : 55 + id_len]
    key, _ = _cbor(raw, 55 + id_len)
    if not isinstance(key, dict) or key.get(1) != 2 or key.get(3) != ES256 or key.get(-1) != 1:
        raise PasskeyError("only ES256 (P-256) keys are supported")
    x, y = key.get(-2), key.get(-3)
    if not (isinstance(x, bytes) and isinstance(y, bytes) and len(x) == 32 and len(y) == 32):
        raise PasskeyError("bad public key")
    data.public_key = b64e(x + y)
    return data


def _client_data(raw_b64: str, expected_type: str, origin: str):
    raw = b64d(raw_b64)
    try:
        client = json.loads(raw)
    except ValueError as exc:
        raise PasskeyError("bad clientDataJSON") from exc
    if not isinstance(client, dict) or client.get("type") != expected_type:
        raise PasskeyError("wrong ceremony type")
    if client.get("origin") != origin:
        raise PasskeyError("origin mismatch")
    if client.get("crossOrigin"):
        raise PasskeyError("cross-origin ceremony")
    return client, raw


def challenge_of(client_data_b64: str) -> str:
    """The challenge a response answers, so the server can find (and burn) the one it issued."""
    try:
        challenge = json.loads(b64d(client_data_b64)).get("challenge")
    except (ValueError, AttributeError) as exc:
        raise PasskeyError("bad clientDataJSON") from exc
    if not isinstance(challenge, str):
        raise PasskeyError("no challenge")
    return challenge


def _check_auth_data(data: AuthData, rp_id: str):
    if not hmac.compare_digest(data.rp_id_hash, hashlib.sha256(rp_id.encode()).digest()):
        raise PasskeyError("relying party mismatch")
    if not data.flags & FLAG_UP or not data.flags & FLAG_UV:
        raise PasskeyError("user was not verified")


def verify_registration(response: dict, challenge: str, origin: str, rp_id: str) -> AuthData:
    """Checks a navigator.credentials.create() response and returns the new credential."""
    client, _ = _client_data(response.get("clientDataJSON"), "webauthn.create", origin)
    if not hmac.compare_digest(str(client.get("challenge")), challenge):
        raise PasskeyError("challenge mismatch")
    attestation = cbor_loads(b64d(response.get("attestationObject")))
    if not isinstance(attestation, dict) or not isinstance(attestation.get("authData"), bytes):
        raise PasskeyError("bad attestation object")
    data = parse_auth_data(attestation["authData"], expect_credential=True)
    _check_auth_data(data, rp_id)
    return data


def verify_assertion(
    response: dict, challenge: str, origin: str, rp_id: str, public_key: str, stored_counter: int
):
    """Checks a navigator.credentials.get() response against a stored key. Returns the new signature counter."""
    client, client_raw = _client_data(response.get("clientDataJSON"), "webauthn.get", origin)
    if not hmac.compare_digest(str(client.get("challenge")), challenge):
        raise PasskeyError("challenge mismatch")
    auth_raw = b64d(response.get("authenticatorData"))
    data = parse_auth_data(auth_raw, expect_credential=False)
    _check_auth_data(data, rp_id)

    point = b64d(public_key)
    signed = auth_raw + hashlib.sha256(client_raw).digest()
    try:
        key = ecdsa.VerifyingKey.from_string(point, curve=ecdsa.NIST256p)
        key.verify(
            b64d(response.get("signature")),
            signed,
            hashfunc=hashlib.sha256,
            sigdecode=ecdsa.util.sigdecode_der,
        )
    except (ecdsa.BadSignatureError, ecdsa.der.UnexpectedDER, AssertionError, ValueError) as exc:
        raise PasskeyError("bad signature") from exc

    # Counters only mean something if the authenticator keeps one. Synced passkeys always report 0.
    if (data.counter or stored_counter) and data.counter <= stored_counter:
        raise PasskeyError("signature counter did not increase (possible cloned credential)")
    return data.counter
