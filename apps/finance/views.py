from rest_framework import generics

from apps.finance.filters import TransactionFilter
from apps.finance.models import Account, Budget, Category, Transaction, Transfer
from apps.finance.serializers import (
    AccountSerializer,
    BudgetSerializer,
    CategorySerializer,
    TransactionSerializer,
    TransferSerializer,
)


class UserScopedMixin:
    """Scope every queryset to the requesting user and stamp ownership on create."""

    def get_queryset(self, *args, **kwargs):
        return super().get_queryset(*args, **kwargs).filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AccountListCreateAPIView(UserScopedMixin, generics.ListCreateAPIView):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer


class AccountDetailAPIView(UserScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer


class CategoryListCreateAPIView(UserScopedMixin, generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class CategoryDetailAPIView(UserScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class BudgetListCreateAPIView(UserScopedMixin, generics.ListCreateAPIView):
    queryset = Budget.objects.select_related("category").all()
    serializer_class = BudgetSerializer


class BudgetDetailAPIView(UserScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Budget.objects.select_related("category").all()
    serializer_class = BudgetSerializer


# Only user-entered transactions are exposed here; transfer legs (transfer set)
# are internal bookkeeping and never listed or edited directly.
class TransactionListCreateAPIView(UserScopedMixin, generics.ListCreateAPIView):
    queryset = Transaction.objects.filter(transfer__isnull=True).select_related(
        "account", "category"
    )
    serializer_class = TransactionSerializer
    filterset_class = TransactionFilter
    search_fields = ("description", "payee")
    ordering_fields = ("occurred_at", "amount", "created")


class TransactionDetailAPIView(UserScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Transaction.objects.filter(transfer__isnull=True).select_related(
        "account", "category"
    )
    serializer_class = TransactionSerializer


class TransferListCreateAPIView(UserScopedMixin, generics.ListCreateAPIView):
    queryset = Transfer.objects.select_related("from_account", "to_account").all()
    serializer_class = TransferSerializer

    def perform_create(self, serializer):
        # Ownership is stamped inside the transfer service via the serializer context.
        serializer.save()


class TransferDetailAPIView(UserScopedMixin, generics.RetrieveDestroyAPIView):
    queryset = Transfer.objects.select_related("from_account", "to_account").all()
    serializer_class = TransferSerializer
