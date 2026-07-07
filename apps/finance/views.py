from rest_framework import generics

from apps.finance.models import Account, Budget, Category
from apps.finance.serializers import (
    AccountSerializer,
    BudgetSerializer,
    CategorySerializer,
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
