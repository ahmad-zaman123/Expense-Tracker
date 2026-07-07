import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.finance.choices import TransactionKind
from apps.finance.constants import DEFAULT_CATEGORIES
from apps.finance.models import Account, Budget, Category

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="owner@example.com", password="pw-strong-123")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(email="other@example.com", password="pw-strong-123")


@pytest.fixture
def client(user):
    api_client = APIClient()
    api_client.force_authenticate(user)
    return api_client


class TestDefaultCategories:
    def test_signup_seeds_default_categories(self, user):
        assert Category.objects.filter(user=user).count() == len(DEFAULT_CATEGORIES)

    def test_defaults_are_per_user(self, user, other_user):
        assert Category.objects.filter(user=other_user).count() == len(DEFAULT_CATEGORIES)


class TestAccounts:
    def test_create_account(self, client, user):
        response = client.post(
            reverse("account-list"),
            {"name": "Bank", "opening_balance": "1000.00"},
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert Account.objects.filter(user=user, name="Bank").exists()

    def test_list_is_user_scoped(self, client, user, other_user):
        Account.objects.create(user=other_user, name="Theirs")
        Account.objects.create(user=user, name="Mine")

        response = client.get(reverse("account-list"))

        names = [row["name"] for row in response.data["results"]]
        assert names == ["Mine"]

    def test_cannot_retrieve_others_account(self, client, other_user):
        account = Account.objects.create(user=other_user, name="Theirs")

        response = client.get(reverse("account-detail", args=[account.pk]))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_requires_authentication(self):
        response = APIClient().get(reverse("account-list"))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestCategories:
    def test_create_category(self, client, user):
        response = client.post(
            reverse("category-list"),
            {"name": "Pets", "kind": TransactionKind.EXPENSE},
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert Category.objects.filter(user=user, name="Pets").exists()

    def test_name_unique_per_user(self, client, user):
        Category.objects.create(user=user, name="Custom", kind=TransactionKind.EXPENSE)

        response = client.post(
            reverse("category-list"),
            {"name": "Custom", "kind": TransactionKind.EXPENSE},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_same_name_allowed_across_users(self, client, user, other_user):
        Category.objects.create(user=other_user, name="Custom", kind=TransactionKind.EXPENSE)

        response = client.post(
            reverse("category-list"),
            {"name": "Custom", "kind": TransactionKind.EXPENSE},
        )

        assert response.status_code == status.HTTP_201_CREATED


class TestBudgets:
    def test_create_on_expense_category(self, client, user):
        category = Category.objects.get(user=user, name="Groceries")

        response = client.post(
            reverse("budget-list"),
            {"amount": "5000.00", "category_id": str(category.pk)},
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert Budget.objects.filter(user=user, category=category).exists()

    def test_rejects_income_category(self, client, user):
        category = Category.objects.get(user=user, name="Salary")

        response = client.post(
            reverse("budget-list"),
            {"amount": "5000.00", "category_id": str(category.pk)},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_rejects_other_users_category(self, client, other_user):
        category = Category.objects.filter(user=other_user, kind=TransactionKind.EXPENSE).first()

        response = client.post(
            reverse("budget-list"),
            {"amount": "5000.00", "category_id": str(category.pk)},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_unique_per_category(self, client, user):
        category = Category.objects.get(user=user, name="Groceries")
        Budget.objects.create(user=user, category=category, amount=1000)

        response = client.post(
            reverse("budget-list"),
            {"amount": "5000.00", "category_id": str(category.pk)},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
