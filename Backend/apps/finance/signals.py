from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.finance.constants import DEFAULT_CATEGORIES
from apps.finance.models import Category


@receiver(
    post_save,
    sender=get_user_model(),
    dispatch_uid="seed_default_categories",
)
def seed_default_categories(sender, instance, created, **kwargs):
    if not created:
        return

    Category.objects.bulk_create(
        Category(user=instance, name=name, kind=kind) for name, kind in DEFAULT_CATEGORIES
    )
