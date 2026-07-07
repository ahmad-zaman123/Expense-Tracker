import csv
import hashlib
import io
from datetime import datetime, time
from decimal import Decimal, InvalidOperation
from zoneinfo import ZoneInfo

from django.conf import settings
from django.db import transaction as db_transaction

from apps.finance.choices import TransactionKind, TransactionSource
from apps.finance.models import Transaction

IMPORT_TZ = ZoneInfo(settings.TIME_ZONE)
REQUIRED_COLUMNS = {"date", "amount"}


def _compute_hash(account_id, occurred_at, amount, description):
    raw = "|".join((str(account_id), occurred_at.isoformat(), str(amount), description))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _parse_row(row, account):
    date_value = (row.get("date") or "").strip()
    amount_value = (row.get("amount") or "").strip()
    description = (row.get("description") or "").strip()
    payee = (row.get("payee") or "").strip()
    kind = (row.get("kind") or "").strip().upper() or TransactionKind.EXPENSE

    occurred_date = datetime.strptime(date_value, "%Y-%m-%d").date()
    occurred_at = datetime.combine(occurred_date, time.min, tzinfo=IMPORT_TZ)

    amount = Decimal(amount_value)
    if amount <= 0:
        raise ValueError("amount must be positive")
    if kind not in TransactionKind.values:
        raise ValueError("invalid kind")

    return Transaction(
        account=account,
        kind=kind,
        amount=amount,
        occurred_at=occurred_at,
        description=description,
        payee=payee,
        source=TransactionSource.IMPORT,
        import_hash=_compute_hash(account.id, occurred_at, amount, description),
    )


def import_transactions_from_csv(*, user, account, file_obj):
    """Parse a CSV statement into transactions for `account`, idempotently.

    Returns {created, skipped, errors}. Rows already present (same
    account+date+amount+description hash) are skipped, so re-uploading the same
    file creates no duplicates. Malformed rows are collected in `errors` rather
    than aborting the whole import.
    """
    content = file_obj.read()
    if isinstance(content, bytes):
        content = content.decode("utf-8-sig")

    reader = csv.DictReader(io.StringIO(content))
    missing = REQUIRED_COLUMNS - set(reader.fieldnames or ())
    if missing:
        raise ValueError("Missing required columns: %s" % ", ".join(sorted(missing)))

    candidates = []
    seen_hashes = set()
    errors = []
    skipped = 0

    for index, row in enumerate(reader, start=1):
        try:
            transaction = _parse_row(row, account)
        except (ValueError, InvalidOperation) as exc:
            errors.append({"row": index, "error": str(exc)})
            continue

        if transaction.import_hash in seen_hashes:
            skipped += 1
            continue
        seen_hashes.add(transaction.import_hash)
        transaction.user = user
        candidates.append(transaction)

    with db_transaction.atomic():
        existing = set(
            Transaction.objects.filter(
                user=user,
                import_hash__in=[t.import_hash for t in candidates],
            ).values_list("import_hash", flat=True)
        )
        fresh = [t for t in candidates if t.import_hash not in existing]
        skipped += len(candidates) - len(fresh)
        Transaction.objects.bulk_create(fresh, ignore_conflicts=True)

    return {"created": len(fresh), "skipped": skipped, "errors": errors}
