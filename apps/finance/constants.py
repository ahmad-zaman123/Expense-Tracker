from apps.finance.choices import TransactionKind

# Maximum accepted size for a CSV statement upload.
MAX_IMPORT_FILE_SIZE = 2 * 1024 * 1024

# Seeded for every new user on registration (see signals.seed_default_categories).
DEFAULT_CATEGORIES = (
    ("Salary", TransactionKind.INCOME),
    ("Business", TransactionKind.INCOME),
    ("Groceries", TransactionKind.EXPENSE),
    ("Rent", TransactionKind.EXPENSE),
    ("Utilities", TransactionKind.EXPENSE),
    ("Transport", TransactionKind.EXPENSE),
    ("Dining", TransactionKind.EXPENSE),
    ("Health", TransactionKind.EXPENSE),
    ("Entertainment", TransactionKind.EXPENSE),
    ("Shopping", TransactionKind.EXPENSE),
)
