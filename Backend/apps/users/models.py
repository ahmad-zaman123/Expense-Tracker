from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from apps.core.models import BaseModel
from apps.users.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ()

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        db_table = "users"

    def __str__(self):
        return self.email


class Passkey(BaseModel):
    """A fingerprint / face unlock registered from one device. Only the public key is stored."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="passkeys")
    credential_id = models.CharField(max_length=1400, unique=True)
    public_key = models.TextField()  # base64url of the P-256 point (x || y)
    sign_count = models.PositiveBigIntegerField(default=0)
    label = models.CharField(max_length=120, blank=True)
    last_used = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "passkeys"
        ordering = ("created",)

    def __str__(self):
        return f"{self.user.email}: {self.label or 'device'}"


class PasskeyChallenge(models.Model):
    """A one-time challenge handed to the browser. Deleted the moment it is used or expires."""

    challenge = models.CharField(max_length=64, unique=True)
    purpose = models.CharField(max_length=16)  # "register" or "login"
    user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.CASCADE, related_name="+"
    )
    expires = models.DateTimeField()

    class Meta:
        db_table = "passkey_challenges"
