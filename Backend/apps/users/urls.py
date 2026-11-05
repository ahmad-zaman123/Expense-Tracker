from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.users import passkey_views
from apps.users.views import (
    ChangePasswordAPIView,
    DemoAPIView,
    ForgotPasswordAPIView,
    GoogleAuthAPIView,
    MeAPIView,
    RegisterAPIView,
    ResetPasswordAPIView,
)

urlpatterns = (
    path("auth/register/", RegisterAPIView.as_view(), name="register"),
    path("auth/demo/", DemoAPIView.as_view(), name="demo"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeAPIView.as_view(), name="me"),
    path("auth/google/", GoogleAuthAPIView.as_view(), name="google"),
    path("auth/password/", ChangePasswordAPIView.as_view(), name="password"),
    path("auth/password/forgot/", ForgotPasswordAPIView.as_view(), name="password_forgot"),
    path("auth/password/reset/", ResetPasswordAPIView.as_view(), name="password_reset"),
    path(
        "auth/passkey/register/options/",
        passkey_views.RegisterOptionsAPIView.as_view(),
        name="passkey_register_options",
    ),
    path(
        "auth/passkey/register/verify/",
        passkey_views.RegisterVerifyAPIView.as_view(),
        name="passkey_register_verify",
    ),
    path(
        "auth/passkey/login/options/",
        passkey_views.LoginOptionsAPIView.as_view(),
        name="passkey_login_options",
    ),
    path(
        "auth/passkey/login/verify/",
        passkey_views.LoginVerifyAPIView.as_view(),
        name="passkey_login_verify",
    ),
    path("auth/passkeys/", passkey_views.PasskeyListAPIView.as_view(), name="passkey_list"),
    path(
        "auth/passkeys/<uuid:pk>/",
        passkey_views.PasskeyDetailAPIView.as_view(),
        name="passkey_detail",
    ),
)
