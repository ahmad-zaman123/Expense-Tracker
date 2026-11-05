"""Private demo accounts: one per visitor, with sample data, removed after a couple of days.

A demo user is recognised by its email domain, so no extra column is needed. The old shared
demo login (``DEMO_EMAIL``) is treated the same way.
"""

import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.users.constants import DEMO_EMAIL

DEMO_DOMAIN = "demo.expense-tracker.app"
DEMO_LIFETIME = timedelta(days=2)
# Old demo users removed per new demo, so one request never does a large delete.
PURGE_BATCH = 50


def is_demo_email(email):
    email = (email or "").lower()
    return email == DEMO_EMAIL or email.endswith("@" + DEMO_DOMAIN)


def is_demo_user(user):
    return is_demo_email(getattr(user, "email", ""))


def purge_expired_demos():
    """Delete demo users older than DEMO_LIFETIME, oldest first, with all their data."""
    User = get_user_model()
    cutoff = timezone.now() - DEMO_LIFETIME
    ids = list(
        User.objects.filter(email__endswith="@" + DEMO_DOMAIN, created__lt=cutoff)
        .order_by("created")
        .values_list("id", flat=True)[:PURGE_BATCH]
    )
    if ids:
        User.objects.filter(id__in=ids).delete()
    return len(ids)


def create_demo_user():
    """A new demo user with the sample finance data. It has no password, so nobody can sign in
    to it again; the session the caller gets is the only way in."""
    from apps.finance.demo import seed_demo_data

    User = get_user_model()
    purge_expired_demos()
    with transaction.atomic():
        user = User.objects.create(
            email=f"demo-{uuid.uuid4().hex[:12]}@{DEMO_DOMAIN}", full_name="Demo User"
        )
        user.set_unusable_password()
        user.save(update_fields=["password"])
        seed_demo_data(user)
    return user
