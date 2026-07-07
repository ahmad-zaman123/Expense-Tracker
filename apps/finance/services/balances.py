from decimal import Decimal

from django.db.models import DecimalField, ExpressionWrapper, F, Q, Sum, Value
from django.db.models.functions import Coalesce

from apps.finance.choices import TransactionKind

MONEY_FIELD = DecimalField(max_digits=14, decimal_places=2)


def with_current_balance(account_queryset):
    """Annotate each account with current_balance = opening + income - expense.

    All transactions on the account are counted, including transfer legs, so the
    balance reflects money moved between accounts.
    """
    income = Coalesce(
        Sum("transactions__amount", filter=Q(transactions__kind=TransactionKind.INCOME)),
        Value(Decimal("0.00")),
        output_field=MONEY_FIELD,
    )
    expense = Coalesce(
        Sum("transactions__amount", filter=Q(transactions__kind=TransactionKind.EXPENSE)),
        Value(Decimal("0.00")),
        output_field=MONEY_FIELD,
    )
    return (
        account_queryset.annotate(_income=income, _expense=expense)
        .annotate(
            current_balance=ExpressionWrapper(
                F("opening_balance") + F("_income") - F("_expense"),
                output_field=MONEY_FIELD,
            )
        )
        .order_by("name")
    )
