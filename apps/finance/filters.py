from django_filters import rest_framework as filters

from apps.finance.models import Transaction


class TransactionFilter(filters.FilterSet):
    date_from = filters.IsoDateTimeFilter(field_name="occurred_at", lookup_expr="gte")
    date_to = filters.IsoDateTimeFilter(field_name="occurred_at", lookup_expr="lte")

    class Meta:
        model = Transaction
        fields = ("account", "category", "kind", "date_from", "date_to")
