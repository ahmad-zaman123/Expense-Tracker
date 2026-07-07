from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.conf import settings
from django.db.models import DecimalField, Q, Sum, Value
from django.db.models.functions import Coalesce, TruncDay, TruncMonth
from django.utils import timezone

from apps.finance.choices import TransactionKind
from apps.finance.models import Budget, Transaction

MONEY_FIELD = DecimalField(max_digits=14, decimal_places=2)
ZERO = Value(Decimal("0.00"), output_field=MONEY_FIELD)

# All reporting buckets align to the user's wall-clock timezone, not UTC, so a
# transaction just after midnight local time lands in the correct month.
REPORT_TZ = ZoneInfo(settings.TIME_ZONE)


def _month_bounds(year, month):
    """Return [start, end) as timezone-aware datetimes at REPORT_TZ midnight."""
    start = datetime(year, month, 1, tzinfo=REPORT_TZ)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=REPORT_TZ)
    else:
        end = datetime(year, month + 1, 1, tzinfo=REPORT_TZ)
    return start, end


def _income_sum():
    return Coalesce(Sum("amount", filter=Q(kind=TransactionKind.INCOME)), ZERO)


def _expense_sum():
    return Coalesce(Sum("amount", filter=Q(kind=TransactionKind.EXPENSE)), ZERO)


def monthly_report(user, year, month):
    """Income/expense totals and per-category breakdown for one month.

    Transfer legs are excluded so moving money between accounts never shows up
    as spending or earning.
    """
    start, end = _month_bounds(year, month)
    queryset = Transaction.objects.filter(
        user=user,
        transfer__isnull=True,
        occurred_at__gte=start,
        occurred_at__lt=end,
    )

    totals = queryset.aggregate(income=_income_sum(), expense=_expense_sum())
    income = totals["income"]
    expense = totals["expense"]

    breakdown = [
        {
            "category_id": row["category"],
            "category_name": row["category__name"],
            "kind": row["kind"],
            "total": row["total"],
        }
        for row in (
            queryset.values("category", "category__name", "kind")
            .annotate(total=Coalesce(Sum("amount"), ZERO))
            .order_by("-total")
        )
    ]

    return {
        "month": "%04d-%02d" % (year, month),
        "income": income,
        "expense": expense,
        "net": income - expense,
        "categories": breakdown,
    }


def budget_status(user):
    """Each active budget with spent/remaining/percent for the current month.

    Two queries total (budgets + one grouped spend aggregate) — no per-budget query.
    """
    budgets = list(Budget.objects.filter(user=user, is_active=True).select_related("category"))
    if not budgets:
        return []

    now = timezone.localtime()
    start, end = _month_bounds(now.year, now.month)
    category_ids = [budget.category_id for budget in budgets]
    spent_rows = (
        Transaction.objects.filter(
            user=user,
            transfer__isnull=True,
            kind=TransactionKind.EXPENSE,
            category_id__in=category_ids,
            occurred_at__gte=start,
            occurred_at__lt=end,
        )
        .values("category_id")
        .annotate(total=Coalesce(Sum("amount"), ZERO))
    )
    spent_by_category = {row["category_id"]: row["total"] for row in spent_rows}

    result = []
    for budget in budgets:
        spent = spent_by_category.get(budget.category_id, Decimal("0.00"))
        limit = budget.amount
        percent = (spent / limit * 100) if limit else Decimal("0.00")
        result.append(
            {
                "budget_id": budget.id,
                "category_id": budget.category_id,
                "category_name": budget.category.name,
                "limit": limit,
                "spent": spent,
                "remaining": limit - spent,
                "percent_used": round(percent, 2),
            }
        )
    return result


def cashflow(user, date_from, date_to, granularity="month"):
    """Net income - expense per time bucket over a date range (for charting)."""
    trunc = (
        TruncMonth("occurred_at", tzinfo=REPORT_TZ)
        if granularity == "month"
        else TruncDay("occurred_at", tzinfo=REPORT_TZ)
    )

    rows = (
        Transaction.objects.filter(
            user=user,
            transfer__isnull=True,
            occurred_at__date__gte=date_from,
            occurred_at__date__lte=date_to,
        )
        .annotate(period=trunc)
        .values("period")
        .annotate(income=_income_sum(), expense=_expense_sum())
        .order_by("period")
    )

    buckets = []
    for row in rows:
        period = row["period"]
        if timezone.is_aware(period):
            period = timezone.localtime(period)
        buckets.append(
            {
                "period": period.date(),
                "income": row["income"],
                "expense": row["expense"],
                "net": row["income"] - row["expense"],
            }
        )
    return buckets
