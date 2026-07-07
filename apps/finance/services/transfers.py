from django.db import transaction

from apps.finance.choices import TransactionKind
from apps.finance.models import Transaction, Transfer


@transaction.atomic
def create_transfer(*, user, from_account, to_account, amount, occurred_at, description=""):
    """Create a Transfer and its two linked legs (out=EXPENSE, in=INCOME) atomically.

    The legs carry the money between accounts for balance purposes while being
    excluded from income/expense reports (they reference the parent transfer).
    """
    transfer = Transfer.objects.create(
        user=user,
        from_account=from_account,
        to_account=to_account,
        amount=amount,
        occurred_at=occurred_at,
        description=description,
    )

    Transaction.objects.bulk_create(
        (
            Transaction(
                user=user,
                account=from_account,
                transfer=transfer,
                kind=TransactionKind.EXPENSE,
                amount=amount,
                occurred_at=occurred_at,
                description=description,
            ),
            Transaction(
                user=user,
                account=to_account,
                transfer=transfer,
                kind=TransactionKind.INCOME,
                amount=amount,
                occurred_at=occurred_at,
                description=description,
            ),
        )
    )

    return transfer
