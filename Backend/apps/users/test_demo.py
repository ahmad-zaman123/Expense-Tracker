from datetime import timedelta

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.finance.demo import BUDGETS
from apps.finance.models import Account, Budget, RecurringRule, Transaction
from apps.users.constants import DEMO_FULL, DEMO_LIMITS, DEMO_PASSWORD_LOCKED, DEMO_TOO_MANY
from apps.users.demo import DEMO_DOMAIN, DEMO_LIFETIME, PURGE_BATCH, is_demo_email
from apps.users.models import RateWindow, User

DEMO = "/api/auth/demo/"


class DemoTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def start(self, ip="203.0.113.5"):
        return self.client.post(DEMO, REMOTE_ADDR=ip)

    def auth(self, access):
        return {"HTTP_AUTHORIZATION": f"Bearer {access}"}

    def test_demo_signs_in_a_new_user_with_sample_data(self):
        response = self.start()
        self.assertEqual(response.status_code, 201)
        me = self.client.get("/api/auth/me/", **self.auth(response.json()["access"]))
        self.assertEqual(me.status_code, 200)
        user = User.objects.get(email=me.json()["email"])
        self.assertTrue(user.email.endswith("@" + DEMO_DOMAIN))
        self.assertFalse(user.has_usable_password())
        self.assertEqual(Account.objects.filter(user=user).count(), 2)
        self.assertGreater(Transaction.objects.filter(user=user).count(), 50)
        self.assertEqual(Budget.objects.filter(user=user).count(), len(BUDGETS))
        self.assertTrue(RecurringRule.objects.filter(user=user).exists())

    def test_each_visitor_gets_their_own_data(self):
        first = self.start().json()["access"]
        second = self.start().json()["access"]
        mine = self.client.get("/api/accounts/", **self.auth(first)).json()
        theirs = self.client.get("/api/accounts/", **self.auth(second)).json()
        ids = lambda page: {a["id"] for a in page.get("results", page)}  # noqa: E731
        self.assertTrue(ids(mine))
        self.assertFalse(ids(mine) & ids(theirs))
        self.assertEqual(User.objects.filter(email__endswith="@" + DEMO_DOMAIN).count(), 2)

    def test_demo_is_limited_per_address(self):
        limit = DEMO_LIMITS["demo_ip"][0]
        for _ in range(limit):
            self.assertEqual(self.start().status_code, 201)
        blocked = self.start()
        self.assertEqual(blocked.status_code, 429)
        self.assertEqual(blocked.json()["detail"], DEMO_TOO_MANY)
        self.assertEqual(self.start(ip="198.51.100.7").status_code, 201)

    def test_demo_has_a_daily_total(self):
        limit = DEMO_LIMITS["demo_all"][0]
        # Fill the day's counter directly rather than creating hundreds of users.
        self.start()
        RateWindow.objects.filter(key__startswith="demo_all:").update(count=limit)
        blocked = self.start(ip="198.51.100.8")
        self.assertEqual(blocked.status_code, 429)
        self.assertEqual(blocked.json()["detail"], DEMO_FULL)

    def test_old_demos_are_removed_when_a_new_one_starts(self):
        self.start()
        old = User.objects.get(email__endswith="@" + DEMO_DOMAIN)
        User.objects.filter(id=old.id).update(
            created=timezone.now() - DEMO_LIFETIME - timedelta(minutes=1)
        )
        keep = User.objects.create_user(email="real@example.com", password="real-password-1")
        self.start()
        self.assertFalse(User.objects.filter(id=old.id).exists())
        self.assertFalse(Transaction.objects.filter(user_id=old.id).exists())
        self.assertTrue(User.objects.filter(id=keep.id).exists())
        self.assertEqual(User.objects.filter(email__endswith="@" + DEMO_DOMAIN).count(), 1)

    def test_cleanup_is_done_in_batches(self):
        cutoff = timezone.now() - DEMO_LIFETIME - timedelta(minutes=1)
        for i in range(PURGE_BATCH + 3):
            User.objects.create(email=f"demo-old{i}@{DEMO_DOMAIN}")
        User.objects.filter(email__endswith="@" + DEMO_DOMAIN).update(created=cutoff)
        self.start()
        # One batch removed, the 3 left over go next time, plus the new demo.
        self.assertEqual(User.objects.filter(email__endswith="@" + DEMO_DOMAIN).count(), 4)

    def test_demo_cannot_set_a_password(self):
        access = self.start().json()["access"]
        response = self.client.post(
            "/api/auth/password/",
            {"new_password": "a-new-password-1"},
            format="json",
            **self.auth(access),
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], [DEMO_PASSWORD_LOCKED])

    def test_demo_cannot_add_fingerprint_sign_in(self):
        access = self.start().json()["access"]
        response = self.client.post("/api/auth/passkey/register/options/", **self.auth(access))
        self.assertEqual(response.status_code, 403)

    @override_settings(EMAIL_HOST="smtp.example")
    def test_demo_gets_no_reset_email(self):
        from django.core import mail

        self.start()
        email = User.objects.get(email__endswith="@" + DEMO_DOMAIN).email
        self.client.post("/api/auth/password/forgot/", {"email": email}, format="json")
        self.assertEqual(len(mail.outbox), 0)

    def test_demo_emails_are_recognised(self):
        self.assertTrue(is_demo_email("demo@expense-tracker.app"))
        self.assertTrue(is_demo_email(f"DEMO-abc@{DEMO_DOMAIN.upper()}"))
        self.assertFalse(is_demo_email("someone@example.com"))
        self.assertFalse(is_demo_email(f"someone@not{DEMO_DOMAIN}"))
