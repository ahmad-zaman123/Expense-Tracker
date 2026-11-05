"""Create or refresh the shared demo account, with every date relative to today.

New visitors get their own private demo from ``POST /api/auth/demo/`` instead. This keeps the
old shared login working for anyone who still uses it:

    python manage.py seed_demo

It is safe to re-run: the demo user's finance data is replaced, nothing else is touched.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.finance.demo import BUDGETS, seed_demo_data
from apps.finance.models import Account, Budget, RecurringRule, Transaction, Transfer

DEMO_EMAIL = "demo@expense-tracker.app"
DEMO_PASSWORD = "demo1234"


class Command(BaseCommand):
    help = "Create or refresh the shared demo account with data dated relative to today."

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            email=DEMO_EMAIL, defaults={"full_name": "Demo User"}
        )
        user.set_password(DEMO_PASSWORD)
        user.save()

        # Start from a clean slate for this user only.
        Transaction.objects.filter(user=user).delete()
        Transfer.objects.filter(user=user).delete()
        RecurringRule.objects.filter(user=user).delete()
        Budget.objects.filter(user=user).delete()
        Account.objects.filter(user=user).delete()

        rows, found = seed_demo_data(user)
        self.stdout.write(
            self.style.SUCCESS(
                "Demo account %s: %d transactions, %d budgets, %s recurring rule(s)."
                % ("created" if created else "refreshed", rows, len(BUDGETS), found)
            )
        )
