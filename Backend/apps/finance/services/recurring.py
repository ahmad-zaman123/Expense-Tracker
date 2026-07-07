from collections import defaultdict
from datetime import timedelta
from decimal import Decimal
from statistics import mean, pstdev

from django.contrib.auth import get_user_model

from apps.finance.models import RecurringRule, Transaction

MIN_OCCURRENCES = 3
MIN_CADENCE_DAYS = 25
MAX_CADENCE_DAYS = 35


def _confidence(gaps, avg_gap):
    """Higher when gaps are regular; scaled by their spread relative to the mean."""
    if not avg_gap:
        return Decimal("0.00")
    spread = pstdev(gaps) if len(gaps) > 1 else 0
    score = max(0.0, min(1.0, 1 - (spread / avg_gap)))
    return Decimal(str(round(score, 2)))


def detect_recurring_for_user(user):
    """Upsert a RecurringRule for each payee that recurs on a roughly monthly cadence.

    Groups the user's non-transfer transactions by (payee, account, kind) and, where
    at least MIN_OCCURRENCES land 25-35 days apart on average, records the pattern.
    Idempotent: re-running updates existing rules instead of duplicating them.
    """
    rows = (
        Transaction.objects.filter(user=user, transfer__isnull=True)
        .exclude(payee="")
        .order_by("occurred_at")
        .values("payee", "account_id", "kind", "amount", "occurred_at", "category_id")
    )

    groups = defaultdict(list)
    for row in rows:
        groups[(row["payee"], row["account_id"], row["kind"])].append(row)

    upserted = 0
    for (payee, account_id, kind), items in groups.items():
        if len(items) < MIN_OCCURRENCES:
            continue

        dates = [item["occurred_at"] for item in items]
        gaps = [(dates[i] - dates[i - 1]).days for i in range(1, len(dates))]
        avg_gap = mean(gaps)
        if not MIN_CADENCE_DAYS <= avg_gap <= MAX_CADENCE_DAYS:
            continue

        avg_amount = sum(item["amount"] for item in items) / len(items)
        last_matched = dates[-1].date()
        next_expected = last_matched + timedelta(days=round(avg_gap))

        RecurringRule.objects.update_or_create(
            user=user,
            account_id=account_id,
            payee=payee,
            kind=kind,
            defaults={
                "avg_amount": avg_amount.quantize(Decimal("0.01")),
                "cadence_days": round(avg_gap),
                "next_expected_at": next_expected,
                "confidence": _confidence(gaps, avg_gap),
                "last_matched_at": last_matched,
                "sample_count": len(items),
                "category_id": items[-1]["category_id"],
            },
        )
        upserted += 1

    return upserted


def detect_recurring_all_users():
    user_model = get_user_model()
    total = 0
    for user in user_model.objects.all():
        total += detect_recurring_for_user(user)
    return total
