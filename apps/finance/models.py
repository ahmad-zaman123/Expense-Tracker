from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import BaseModel
from apps.finance.choices import TransactionKind, TransactionSource


class Account(BaseModel):
    name = models.CharField(max_length=255)
    opening_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    is_archived = models.BooleanField(default=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="accounts",
    )

    class Meta:
        verbose_name = "Account"
        verbose_name_plural = "Accounts"
        db_table = "accounts"
        ordering = ("name",)

    def __str__(self):
        return self.name


class Category(BaseModel):
    name = models.CharField(max_length=255)
    kind = models.CharField(max_length=15, choices=TransactionKind.choices)
    is_archived = models.BooleanField(default=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
    )

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        db_table = "categories"
        ordering = ("name",)
        constraints = (
            models.UniqueConstraint(
                fields=("user", "name"),
                name="uniq_category_per_user_name",
            ),
        )

    def __str__(self):
        return self.name


class Transfer(BaseModel):
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=(MinValueValidator(Decimal("0.01")),),
    )
    occurred_at = models.DateTimeField()
    description = models.CharField(max_length=255, blank=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transfers",
    )
    from_account = models.ForeignKey(
        "finance.Account",
        on_delete=models.CASCADE,
        related_name="transfers_out",
    )
    to_account = models.ForeignKey(
        "finance.Account",
        on_delete=models.CASCADE,
        related_name="transfers_in",
    )

    class Meta:
        verbose_name = "Transfer"
        verbose_name_plural = "Transfers"
        db_table = "transfers"
        ordering = ("-occurred_at",)

    def __str__(self):
        return "%s: %s -> %s" % (self.amount, self.from_account, self.to_account)


class Transaction(BaseModel):
    kind = models.CharField(max_length=15, choices=TransactionKind.choices)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=(MinValueValidator(Decimal("0.01")),),
    )
    occurred_at = models.DateTimeField()
    description = models.CharField(max_length=255, blank=True)
    payee = models.CharField(max_length=255, blank=True)
    source = models.CharField(
        max_length=15,
        choices=TransactionSource.choices,
        default=TransactionSource.MANUAL,
    )
    import_hash = models.CharField(max_length=64, null=True, blank=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    account = models.ForeignKey(
        "finance.Account",
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    category = models.ForeignKey(
        "finance.Category",
        on_delete=models.SET_NULL,
        related_name="transactions",
        null=True,
        blank=True,
    )
    transfer = models.ForeignKey(
        "finance.Transfer",
        on_delete=models.CASCADE,
        related_name="legs",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        db_table = "transactions"
        ordering = ("-occurred_at",)
        indexes = (
            models.Index(fields=("user", "occurred_at")),
            models.Index(fields=("user", "category")),
        )
        constraints = (
            models.UniqueConstraint(
                fields=("user", "import_hash"),
                name="uniq_transaction_per_user_import_hash",
                condition=models.Q(import_hash__isnull=False),
            ),
        )

    def __str__(self):
        return "%s %s" % (self.kind, self.amount)


class Budget(BaseModel):
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=(MinValueValidator(Decimal("0.01")),),
    )
    is_active = models.BooleanField(default=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budgets",
    )
    category = models.ForeignKey(
        "finance.Category",
        on_delete=models.CASCADE,
        related_name="budgets",
    )

    class Meta:
        verbose_name = "Budget"
        verbose_name_plural = "Budgets"
        db_table = "budgets"
        ordering = ("-created",)
        constraints = (
            models.UniqueConstraint(
                fields=("user", "category"),
                name="uniq_budget_per_user_category",
            ),
        )

    def __str__(self):
        return "%s budget" % self.category
