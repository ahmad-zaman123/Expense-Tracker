import pytest

from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestAuth:
    def test_register_creates_user(self, api_client):
        payload = {
            "email": "a@example.com",
            "full_name": "Ahmad",
            "password": "sup3r-secret-pw",
        }
        response = api_client.post(reverse("register"), payload)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == "a@example.com"
        assert "password" not in response.data
        assert User.objects.filter(email="a@example.com").exists()

    def test_register_rejects_weak_password(self, api_client):
        payload = {"email": "b@example.com", "password": "123"}
        response = api_client.post(reverse("register"), payload)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not User.objects.filter(email="b@example.com").exists()

    def test_token_and_me_flow(self, api_client):
        User.objects.create_user(
            email="c@example.com",
            password="sup3r-secret-pw",
            full_name="Charlie",
        )

        token_response = api_client.post(
            reverse("token_obtain_pair"),
            {"email": "c@example.com", "password": "sup3r-secret-pw"},
        )
        assert token_response.status_code == status.HTTP_200_OK
        access = token_response.data["access"]

        api_client.credentials(HTTP_AUTHORIZATION="Bearer " + access)
        me_response = api_client.get(reverse("me"))

        assert me_response.status_code == status.HTTP_200_OK
        assert me_response.data["email"] == "c@example.com"

    def test_me_requires_auth(self, api_client):
        response = api_client.get(reverse("me"))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
