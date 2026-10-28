from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users import passkeys
from apps.users.models import Passkey, PasskeyChallenge

# The shared demo account is open to anyone, so a fingerprint must never be able to claim it.
DEMO_EMAIL = "demo@expense-tracker.app"

FAILED = "Fingerprint sign-in could not be verified. Use your password."


def _fail(detail, code=status.HTTP_400_BAD_REQUEST):
    return Response({"detail": detail}, status=code)


def _origin_and_rp(request):
    origin = request.headers.get("Origin", "")
    return origin, passkeys.relying_party(origin)


def _issue(purpose, user=None):
    """A fresh one-time challenge, stored so it can be checked once and burned."""
    now = timezone.now()
    PasskeyChallenge.objects.filter(expires__lt=now).delete()
    challenge = passkeys.new_challenge()
    PasskeyChallenge.objects.create(
        challenge=challenge,
        purpose=purpose,
        user=user,
        expires=now + timedelta(seconds=passkeys.CHALLENGE_TTL_SECONDS),
    )
    return challenge


def _burn(challenge, purpose, user=None):
    """Returns True once for an unexpired challenge of this purpose, then never again."""
    deleted, _ = PasskeyChallenge.objects.filter(
        challenge=challenge, purpose=purpose, user=user, expires__gte=timezone.now()
    ).delete()
    return deleted == 1


class PasskeyThrottle(ScopedRateThrottle):
    scope = "passkey"


class RegisterOptionsAPIView(APIView):
    permission_classes = (IsAuthenticated,)
    throttle_classes = (PasskeyThrottle,)

    def post(self, request):
        if request.user.email.lower() == DEMO_EMAIL:
            return _fail(
                "The shared demo account can't use fingerprint sign-in.", status.HTTP_403_FORBIDDEN
            )
        try:
            _, rp_id = _origin_and_rp(request)
        except passkeys.PasskeyError:
            return _fail("This address can't be used for fingerprint sign-in.")
        challenge = _issue("register", request.user)
        user = request.user
        return Response(
            {
                "challenge": challenge,
                "rp": {"name": "Expense Tracker", "id": rp_id},
                "user": {
                    "id": passkeys.b64e(user.id.bytes),
                    "name": user.email,
                    "displayName": user.full_name or user.email,
                },
                "pubKeyCredParams": [{"type": "public-key", "alg": passkeys.ES256}],
                "timeout": 60000,
                "attestation": "none",
                "excludeCredentials": [
                    {"type": "public-key", "id": p.credential_id} for p in user.passkeys.all()
                ],
                "authenticatorSelection": {
                    "authenticatorAttachment": "platform",
                    "residentKey": "required",
                    "requireResidentKey": True,
                    "userVerification": "required",
                },
            }
        )


class RegisterVerifyAPIView(APIView):
    permission_classes = (IsAuthenticated,)
    throttle_classes = (PasskeyThrottle,)

    def post(self, request):
        if request.user.email.lower() == DEMO_EMAIL:
            return _fail(
                "The shared demo account can't use fingerprint sign-in.", status.HTTP_403_FORBIDDEN
            )
        credential = request.data.get("credential")
        response = credential.get("response") if isinstance(credential, dict) else None
        if not isinstance(response, dict):
            return _fail("Missing credential.")
        try:
            origin, rp_id = _origin_and_rp(request)
            challenge = passkeys.challenge_of(response.get("clientDataJSON"))
            if not _burn(challenge, "register", request.user):
                raise passkeys.PasskeyError("unknown or expired challenge")
            data = passkeys.verify_registration(response, challenge, origin, rp_id)
        except passkeys.PasskeyError:
            return _fail("Couldn't turn on fingerprint sign-in. Try again.")
        credential_id = passkeys.b64e(data.credential_id)
        if Passkey.objects.filter(credential_id=credential_id).exists():
            return _fail("This device is already registered.", status.HTTP_409_CONFLICT)
        label = str(request.data.get("label") or "")[:120]
        passkey = Passkey.objects.create(
            user=request.user,
            credential_id=credential_id,
            public_key=data.public_key,
            sign_count=data.counter,
            label=label,
        )
        return Response(
            {"id": str(passkey.id), "credential_id": credential_id, "label": passkey.label},
            status=201,
        )


class LoginOptionsAPIView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()
    throttle_classes = (PasskeyThrottle,)

    def post(self, request):
        try:
            _, rp_id = _origin_and_rp(request)
        except passkeys.PasskeyError:
            return _fail(FAILED)
        return Response(
            {
                "challenge": _issue("login"),
                "rpId": rp_id,
                "timeout": 60000,
                "userVerification": "required",
                "allowCredentials": [],  # discoverable: the device offers the passkeys it holds
            }
        )


class LoginVerifyAPIView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()
    throttle_classes = (PasskeyThrottle,)

    def post(self, request):
        credential = request.data.get("credential")
        response = credential.get("response") if isinstance(credential, dict) else None
        if not isinstance(response, dict):
            return _fail(FAILED)
        try:
            origin, rp_id = _origin_and_rp(request)
            challenge = passkeys.challenge_of(response.get("clientDataJSON"))
            if not _burn(challenge, "login"):
                raise passkeys.PasskeyError("unknown or expired challenge")
            passkey = (
                Passkey.objects.select_related("user")
                .filter(credential_id=credential.get("id"))
                .first()
            )
            if passkey is None:
                raise passkeys.PasskeyError("unknown credential")
            user = passkey.user
            handle = response.get("userHandle")
            if handle and passkeys.b64d(handle) != user.id.bytes:
                raise passkeys.PasskeyError("credential belongs to someone else")
            counter = passkeys.verify_assertion(
                response, challenge, origin, rp_id, passkey.public_key, passkey.sign_count
            )
        except passkeys.PasskeyError:
            return _fail(FAILED, status.HTTP_401_UNAUTHORIZED)
        if not user.is_active or user.email.lower() == DEMO_EMAIL:
            return _fail("This account is disabled.", status.HTTP_403_FORBIDDEN)

        passkey.sign_count = counter
        passkey.last_used = timezone.now()
        passkey.save(update_fields=["sign_count", "last_used", "modified"])
        refresh = RefreshToken.for_user(user)
        return Response({"access": str(refresh.access_token), "refresh": str(refresh)})


class PasskeyListAPIView(APIView):
    """The signed-in user's registered devices."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(
            [
                {
                    "id": str(p.id),
                    "credential_id": p.credential_id,
                    "label": p.label,
                    "created": p.created,
                    "last_used": p.last_used,
                }
                for p in request.user.passkeys.all()
            ]
        )


class PasskeyDetailAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    def delete(self, request, pk):
        deleted, _ = request.user.passkeys.filter(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT if deleted else status.HTTP_404_NOT_FOUND)
