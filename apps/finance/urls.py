from django.urls import path

from apps.finance.views import (
    AccountDetailAPIView,
    AccountListCreateAPIView,
    BudgetDetailAPIView,
    BudgetListCreateAPIView,
    CategoryDetailAPIView,
    CategoryListCreateAPIView,
    TransactionDetailAPIView,
    TransactionListCreateAPIView,
    TransferDetailAPIView,
    TransferListCreateAPIView,
)

urlpatterns = (
    path("accounts/", AccountListCreateAPIView.as_view(), name="account-list"),
    path("accounts/<uuid:pk>/", AccountDetailAPIView.as_view(), name="account-detail"),
    path("categories/", CategoryListCreateAPIView.as_view(), name="category-list"),
    path(
        "categories/<uuid:pk>/",
        CategoryDetailAPIView.as_view(),
        name="category-detail",
    ),
    path("budgets/", BudgetListCreateAPIView.as_view(), name="budget-list"),
    path("budgets/<uuid:pk>/", BudgetDetailAPIView.as_view(), name="budget-detail"),
    path(
        "transactions/",
        TransactionListCreateAPIView.as_view(),
        name="transaction-list",
    ),
    path(
        "transactions/<uuid:pk>/",
        TransactionDetailAPIView.as_view(),
        name="transaction-detail",
    ),
    path("transfers/", TransferListCreateAPIView.as_view(), name="transfer-list"),
    path(
        "transfers/<uuid:pk>/",
        TransferDetailAPIView.as_view(),
        name="transfer-detail",
    ),
)
