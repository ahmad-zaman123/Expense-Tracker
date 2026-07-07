from django.urls import path

from apps.finance.views import (
    AccountDetailAPIView,
    AccountListCreateAPIView,
    BudgetDetailAPIView,
    BudgetListCreateAPIView,
    CategoryDetailAPIView,
    CategoryListCreateAPIView,
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
)
