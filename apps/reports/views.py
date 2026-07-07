from datetime import datetime

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reports.serializers import (
    BudgetStatusSerializer,
    CashflowBucketSerializer,
    MonthlyReportSerializer,
)
from apps.reports.services import budget_status, cashflow, monthly_report


class MonthlyReportAPIView(APIView):
    def get(self, request, *args, **kwargs):
        month_param = request.query_params.get("month")
        if month_param:
            try:
                parsed = datetime.strptime(month_param, "%Y-%m")
            except ValueError:
                return Response(
                    {"month": "Expected format YYYY-MM."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            year, month = parsed.year, parsed.month
        else:
            now = timezone.localtime()
            year, month = now.year, now.month

        data = monthly_report(request.user, year, month)
        return Response(MonthlyReportSerializer(data).data)


class BudgetStatusAPIView(APIView):
    def get(self, request, *args, **kwargs):
        data = budget_status(request.user)
        return Response(BudgetStatusSerializer(data, many=True).data)


class CashflowAPIView(APIView):
    def get(self, request, *args, **kwargs):
        from_param = request.query_params.get("from")
        to_param = request.query_params.get("to")
        granularity = request.query_params.get("granularity", "month")

        if granularity not in ("month", "day"):
            return Response(
                {"granularity": "Expected 'month' or 'day'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not from_param or not to_param:
            return Response(
                {"detail": "'from' and 'to' are required (YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            date_from = datetime.strptime(from_param, "%Y-%m-%d").date()
            date_to = datetime.strptime(to_param, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"detail": "Dates must be YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = cashflow(request.user, date_from, date_to, granularity)
        return Response(CashflowBucketSerializer(data, many=True).data)
