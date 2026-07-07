from .base import *  # noqa: F401,F403

DEBUG = False

# Faster hashing keeps the test suite quick.
PASSWORD_HASHERS = ("django.contrib.auth.hashers.MD5PasswordHasher",)
