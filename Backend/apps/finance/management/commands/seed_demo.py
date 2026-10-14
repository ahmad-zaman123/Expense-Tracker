"""Create or refresh the demo account, with every date relative to today.

The live demo is only convincing while its data is recent. Run this on a schedule, or whenever the
demo looks stale:

    python manage.py seed_demo

It is safe to re-run: the demo user's finance data is replaced, nothing else is touched.
"""

from datetime import date, datetime, time
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.finance.choices import TransactionKind
from apps.finance.constants import DEFAULT_CATEGORIES
from apps.finance.models import Account, Budget, Category, RecurringRule, Transaction, Transfer
from apps.finance.services.recurring import detect_recurring_for_user
from apps.finance.services.transfers import create_transfer

DEMO_EMAIL = "demo@expense-tracker.app"
DEMO_PASSWORD = "demo1234"
MONTHS = 6

INCOME = TransactionKind.INCOME
EXPENSE = TransactionKind.EXPENSE

# (day of month, kind, base amount, payee, category, account, every n-th month offset or None)
ENTRIES = (
    (1, INCOME, 120000, "Acme Corp", "Salary", "HBL Savings", None),
    (18, INCOME, 30000, "Upwork", "Business", "HBL Savings", 2),
    (4, EXPENSE, 35000, "Landlord", "Rent", "HBL Savings", None),
    (2, EXPENSE, 4000, "Fitness First", "Health", "HBL Savings", None),
    (6, EXPENSE, 8200, "K-Electric", "Utilities", "HBL Savings", None),
    (8, EXPENSE, 4500, "StormFiber", "Utilities", "HBL Savings", None),
    (10, EXPENSE, 1100, "Netflix", "Entertainment", "HBL Savings", None),
    (12, EXPENSE, 500, "Spotify", "Entertainment", "HBL Savings", None),
    (3, EXPENSE, 6800, "Imtiaz", "Groceries", "HBL Savings", None),
    (11, EXPENSE, 5400, "Al-Fatah", "Groceries", "HBL Savings", None),
    (19, EXPENSE, 7200, "Imtiaz", "Groceries", "HBL Savings", None),
    (26, EXPENSE, 4900, "Al-Fatah", "Groceries", "HBL Savings", None),
    (5, EXPENSE, 2400, "KFC", "Dining", "Cash Wallet", None),
    (14, EXPENSE, 3600, "Cafe Aylanto", "Dining", "Cash Wallet", None),
    (22, EXPENSE, 1500, "McDonalds", "Dining", "Cash Wallet", None),
    (7, EXPENSE, 4200, "Careem", "Transport", "Cash Wallet", None),
    (15, EXPENSE, 3500, "Shell", "Transport", "Cash Wallet", None),
    (24, EXPENSE, 4000, "PSO", "Transport", "Cash Wallet", None),
    (17, EXPENSE, 9500, "Daraz", "Shopping", "HBL Savings", 2),
)

# Limits chosen so the budgets page shows all three states in a typical month.
BUDGETS = (
    ("Groceries", 25000),
    ("Dining", 12000),
    ("Transport", 10000),
    ("Entertainment", 6000),
    ("Shopping", 25000),
)


def month_start(today, months_back):
    year, month = today.year, today.month - months_back
    while month <= 0:
        month += 12
        year -= 1
    return date(year, month, 1)


def at_noon(day):
    return timezone.make_aware(datetime.combine(day, time(12, 0)))


class Command(BaseCommand):
    help = "Create or refresh the demo account with data dated relative to today."

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

        categories = {}
        for name, kind in DEFAULT_CATEGORIES:
            categories[name], _ = Category.objects.get_or_create(user=user, name=name, kind=kind)

        accounts = {
            "HBL Savings": Account.objects.create(
                user=user, name="HBL Savings", opening_balance=Decimal("150000")
            ),
            "Cash Wallet": Account.objects.create(
                user=user, name="Cash Wallet", opening_balance=Decimal("12000")
            ),
        }

        today = timezone.localdate()
        rows = []
        for back in range(MONTHS - 1, -1, -1):
            start = month_start(today, back)
            # A small, repeatable wobble so months are not identical.
            wobble = Decimal(100 + ((back * 7) % 5 - 2) * 3) / 100
            for day, kind, base, payee, category, account, every in ENTRIES:
                if every and back % every:
                    continue
                when = date(start.year, start.month, day)
                if when > today:
                    continue
                fixed = payee in (
                    "Acme Corp",
                    "Landlord",
                    "Netflix",
                    "Spotify",
                    "Fitness First",
                    "StormFiber",
                )
                amount = (
                    Decimal(base) if fixed else (Decimal(base) * wobble).quantize(Decimal("50"))
                )
                rows.append(
                    Transaction(
                        user=user,
                        account=accounts[account],
                        category=categories[category],
                        kind=kind,
                        amount=amount,
                        occurred_at=at_noon(when),
                        payee=payee,
                        description=category,
                    )
                )
        Transaction.objects.bulk_create(rows)

        # Two transfers between the accounts (these move balances, never income or expense).
        for back, day, amount in ((1, 8, 8000), (0, 3, 10000)):
            when = date(month_start(today, back).year, month_start(today, back).month, day)
            if when <= today:
                create_transfer(
                    user=user,
                    from_account=accounts["HBL Savings"],
                    to_account=accounts["Cash Wallet"],
                    amount=Decimal(amount),
                    occurred_at=at_noon(when),
                    description="Cash for the month",
                )

        for name, limit in BUDGETS:
            Budget.objects.create(user=user, category=categories[name], amount=Decimal(limit))

        found = detect_recurring_for_user(user)
        self.stdout.write(
            self.style.SUCCESS(
                "Demo account %s: %d transactions, %d budgets, %s recurring rule(s)."
                % ("created" if created else "refreshed", len(rows), len(BUDGETS), found)
            )
        )
