from django.urls import path

from apps.reports.views import (
    BudgetStatusAPIView,
    CashflowAPIView,
    MonthlyReportAPIView,
)

urlpatterns = (
    path("reports/monthly/", MonthlyReportAPIView.as_view(), name="report-monthly"),
    path(
        "reports/budget-status/",
        BudgetStatusAPIView.as_view(),
        name="report-budget-status",
    ),
    path("reports/cashflow/", CashflowAPIView.as_view(), name="report-cashflow"),
)
