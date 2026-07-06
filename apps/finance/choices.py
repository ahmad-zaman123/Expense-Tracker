from django.db import models


class TransactionKind(models.TextChoices):
    INCOME = "INCOME", "Income"
    EXPENSE = "EXPENSE", "Expense"


class TransactionSource(models.TextChoices):
    MANUAL = "MANUAL", "Manual"
    IMPORT = "IMPORT", "Import"
