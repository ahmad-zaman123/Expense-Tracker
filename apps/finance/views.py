from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.finance.filters import TransactionFilter
from apps.finance.models import Account, Budget, Category, Transaction, Transfer
from apps.finance.serializers import (
    AccountSerializer,
    BudgetSerializer,
    CategorySerializer,
    TransactionImportSerializer,
    TransactionSerializer,
    TransferSerializer,
)
from apps.finance.services.balances import with_current_balance
from apps.finance.services.imports import import_transactions_from_csv


class UserScopedMixin:
    """Scope every queryset to the requesting user and stamp ownership on create."""

    def get_queryset(self, *args, **kwargs):
        return super().get_queryset(*args, **kwargs).filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AccountListCreateAPIView(UserScopedMixin, generics.ListCreateAPIView):
    serializer_class = AccountSerializer

    def get_queryset(self, *args, **kwargs):
        return with_current_balance(Account.objects.filter(user=self.request.user))


class AccountDetailAPIView(UserScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AccountSerializer

    def get_queryset(self, *args, **kwargs):
        return with_current_balance(Account.objects.filter(user=self.request.user))


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


class TransactionImportAPIView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = TransactionImportSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        try:
            summary = import_transactions_from_csv(
                user=request.user,
                account=serializer.validated_data["account"],
                file_obj=serializer.validated_data["file"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(summary, status=status.HTTP_201_CREATED)


class TransferListCreateAPIView(UserScopedMixin, generics.ListCreateAPIView):
    queryset = Transfer.objects.select_related("from_account", "to_account").all()
    serializer_class = TransferSerializer

    def perform_create(self, serializer):
        # Ownership is stamped inside the transfer service via the serializer context.
        serializer.save()


class TransferDetailAPIView(UserScopedMixin, generics.RetrieveDestroyAPIView):
    queryset = Transfer.objects.select_related("from_account", "to_account").all()
    serializer_class = TransferSerializer
