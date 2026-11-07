from .base import *  # noqa: F401,F403
from .base import env

DEBUG = False
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[".vercel.app"])

CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=["https://*.vercel.app"],
)

# Vercel terminates TLS at the edge and forwards over HTTP.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# SECRET_KEY signs login tokens, so production refuses to start with the public default or a short key.
if SECRET_KEY.startswith("insecure") or len(SECRET_KEY) < 40:  # noqa: F405
    from django.core.exceptions import ImproperlyConfigured

    raise ImproperlyConfigured("Set SECRET_KEY to a long random value in production.")

# Without a real CRON_SECRET the cron endpoint stays closed, rather than accepting the public default.
if CRON_SECRET.startswith("insecure") or len(CRON_SECRET) < 16:  # noqa: F405
    CRON_SECRET = ""

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"
