from datetime import datetime
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.finance.choices import TransactionKind
from apps.finance.models import Account, Budget, Category, Transaction
from apps.finance.services.transfers import create_transfer

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="owner@example.com", password="pw-strong-123")


@pytest.fixture
def client(user):
    api_client = APIClient()
    api_client.force_authenticate(user)
    return api_client


def _aware(year, month, day):
    return timezone.make_aware(datetime(year, month, day, 12, 0))


class TestAccountBalance:
    def test_current_balance_income_minus_expense(self, client, user):
        bank = Account.objects.create(user=user, name="Bank", opening_balance=Decimal("1000.00"))
        Transaction.objects.create(
            user=user,
            account=bank,
            kind=TransactionKind.INCOME,
            amount=Decimal("500.00"),
            occurred_at=timezone.now(),
        )
        Transaction.objects.create(
            user=user,
            account=bank,
            kind=TransactionKind.EXPENSE,
            amount=Decimal("200.00"),
            occurred_at=timezone.now(),
        )

        response = client.get(reverse("account-list"))

        row = response.data["results"][0]
        assert Decimal(row["current_balance"]) == Decimal("1300.00")

    def test_balance_includes_transfer_legs(self, client, user):
        bank = Account.objects.create(user=user, name="Bank", opening_balance=Decimal("1000.00"))
        cash = Account.objects.create(user=user, name="Cash", opening_balance=Decimal("0.00"))
        create_transfer(
            user=user,
            from_account=bank,
            to_account=cash,
            amount=Decimal("300.00"),
            occurred_at=timezone.now(),
        )

        response = client.get(reverse("account-list"))

        balances = {
            row["name"]: Decimal(row["current_balance"]) for row in response.data["results"]
        }
        assert balances["Bank"] == Decimal("700.00")
        assert balances["Cash"] == Decimal("300.00")


class TestMonthlyReport:
    def test_income_expense_and_net(self, client, user):
        bank = Account.objects.create(user=user, name="Bank")
        salary = Category.objects.get(user=user, name="Salary")
        groceries = Category.objects.get(user=user, name="Groceries")
        Transaction.objects.create(
            user=user,
            account=bank,
            category=salary,
            kind=TransactionKind.INCOME,
            amount=Decimal("50000.00"),
            occurred_at=_aware(2026, 7, 15),
        )
        Transaction.objects.create(
            user=user,
            account=bank,
            category=groceries,
            kind=TransactionKind.EXPENSE,
            amount=Decimal("8000.00"),
            occurred_at=_aware(2026, 7, 20),
        )

        response = client.get(reverse("report-monthly"), {"month": "2026-07"})

        assert response.status_code == status.HTTP_200_OK
        assert Decimal(response.data["income"]) == Decimal("50000.00")
        assert Decimal(response.data["expense"]) == Decimal("8000.00")
        assert Decimal(response.data["net"]) == Decimal("42000.00")
        assert len(response.data["categories"]) == 2

    def test_excludes_transfer_legs(self, client, user):
        bank = Account.objects.create(user=user, name="Bank")
        cash = Account.objects.create(user=user, name="Cash")
        create_transfer(
            user=user,
            from_account=bank,
            to_account=cash,
            amount=Decimal("5000.00"),
            occurred_at=_aware(2026, 7, 10),
        )

        response = client.get(reverse("report-monthly"), {"month": "2026-07"})

        assert Decimal(response.data["income"]) == Decimal("0.00")
        assert Decimal(response.data["expense"]) == Decimal("0.00")

    def test_invalid_month_returns_400(self, client, user):
        response = client.get(reverse("report-monthly"), {"month": "2026-13-99"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestBudgetStatus:
    def test_spent_remaining_percent(self, client, user):
        groceries = Category.objects.get(user=user, name="Groceries")
        Budget.objects.create(user=user, category=groceries, amount=Decimal("10000.00"))
        bank = Account.objects.create(user=user, name="Bank")
        Transaction.objects.create(
            user=user,
            account=bank,
            category=groceries,
            kind=TransactionKind.EXPENSE,
            amount=Decimal("2500.00"),
            occurred_at=timezone.now(),
        )

        response = client.get(reverse("report-budget-status"))

        row = response.data[0]
        assert Decimal(row["spent"]) == Decimal("2500.00")
        assert Decimal(row["remaining"]) == Decimal("7500.00")
        assert Decimal(row["percent_used"]) == Decimal("25.00")


class TestCashflow:
    def test_monthly_net(self, client, user):
        bank = Account.objects.create(user=user, name="Bank")
        Transaction.objects.create(
            user=user,
            account=bank,
            kind=TransactionKind.INCOME,
            amount=Decimal("1000.00"),
            occurred_at=_aware(2026, 7, 10),
        )
        Transaction.objects.create(
            user=user,
            account=bank,
            kind=TransactionKind.EXPENSE,
            amount=Decimal("400.00"),
            occurred_at=_aware(2026, 7, 12),
        )

        response = client.get(
            reverse("report-cashflow"),
            {"from": "2026-07-01", "to": "2026-07-31", "granularity": "month"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert Decimal(response.data[0]["net"]) == Decimal("600.00")

    def test_requires_date_range(self, client, user):
        response = client.get(reverse("report-cashflow"))

        assert response.status_code == status.HTTP_400_BAD_REQUEST
