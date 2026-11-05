"""Sample finance data for a demo user, with every date relative to today.

Used by the private demo (one fresh user per visitor) and by the ``seed_demo`` command,
which keeps the old shared demo account up to date.
"""

from datetime import date, datetime, time
from decimal import Decimal

from django.utils import timezone

from apps.finance.choices import TransactionKind
from apps.finance.constants import DEFAULT_CATEGORIES
from apps.finance.models import Account, Budget, Category, Transaction
from apps.finance.services.recurring import detect_recurring_for_user
from apps.finance.services.transfers import create_transfer

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


def seed_demo_data(user):
    """Give a user with no finance data the sample accounts, six months of entries, budgets and
    detected subscriptions. Returns (transactions created, recurring rules found)."""
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
            fixed = payee in (
                "Acme Corp",
                "Landlord",
                "Netflix",
                "Spotify",
                "Fitness First",
                "StormFiber",
            )
            if when > today:
                # Everyday spending lands on today, so budgets look real early in a month.
                # Regular charges keep their dates, which recurring detection depends on.
                if fixed or kind == INCOME:
                    continue
                when = today
            amount = Decimal(base) if fixed else (Decimal(base) * wobble).quantize(Decimal("50"))
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

    # A monthly top-up keeps the wallet above zero (transfers move balances, never income or
    # expense). The 1st of the month is always on or before today.
    for back in range(MONTHS - 1, -1, -1):
        create_transfer(
            user=user,
            from_account=accounts["HBL Savings"],
            to_account=accounts["Cash Wallet"],
            amount=Decimal("20000"),
            occurred_at=at_noon(month_start(today, back)),
            description="Cash for the month",
        )

    for name, limit in BUDGETS:
        Budget.objects.create(user=user, category=categories[name], amount=Decimal(limit))

    return len(rows), detect_recurring_for_user(user)
