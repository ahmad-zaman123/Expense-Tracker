from rest_framework import serializers

from apps.finance.choices import TransactionKind
from apps.finance.models import Account, Budget, Category, Transaction, Transfer
from apps.finance.services.transfers import create_transfer


class AccountSerializer(serializers.ModelSerializer):
    current_balance = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = (
            "id",
            "name",
            "opening_balance",
            "current_balance",
            "is_archived",
            "created",
        )
        read_only_fields = ("id", "created")

    def get_current_balance(self, account):
        # Present on list/detail via annotation; falls back to opening balance
        # on create, where the fresh instance carries no transactions yet.
        balance = getattr(account, "current_balance", None)
        if balance is None:
            balance = account.opening_balance
        return "%.2f" % balance


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "kind", "is_archived", "created")
        read_only_fields = ("id", "created")

    def validate(self, attrs):
        request = self.context["request"]
        name = attrs.get("name", getattr(self.instance, "name", None))

        queryset = Category.objects.filter(user=request.user, name=name)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                {"name": "You already have a category with this name."}
            )
        return attrs


class BudgetSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.all(),
        write_only=True,
    )

    class Meta:
        model = Budget
        fields = ("id", "amount", "is_active", "category", "category_id", "created")
        read_only_fields = ("id", "created")

    def validate_category_id(self, category):
        request = self.context["request"]
        if category.user_id != request.user.id:
            raise serializers.ValidationError("Category not found.")
        if category.kind != TransactionKind.EXPENSE:
            raise serializers.ValidationError("Budgets can only be set on expense categories.")
        return category

    def validate(self, attrs):
        request = self.context["request"]
        category = attrs.get("category", getattr(self.instance, "category", None))

        queryset = Budget.objects.filter(user=request.user, category=category)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                {"category_id": "A budget for this category already exists."}
            )
        return attrs


class TransactionSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    account_id = serializers.PrimaryKeyRelatedField(
        source="account",
        queryset=Account.objects.all(),
        write_only=True,
    )
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Transaction
        fields = (
            "id",
            "kind",
            "amount",
            "occurred_at",
            "description",
            "payee",
            "source",
            "transfer",
            "account",
            "account_id",
            "category",
            "category_id",
            "created",
        )
        read_only_fields = ("id", "source", "transfer", "created")

    def validate_account_id(self, account):
        request = self.context["request"]
        if account.user_id != request.user.id:
            raise serializers.ValidationError("Account not found.")
        return account

    def validate_category_id(self, category):
        request = self.context["request"]
        if category is not None and category.user_id != request.user.id:
            raise serializers.ValidationError("Category not found.")
        return category

    def validate(self, attrs):
        kind = attrs.get("kind", getattr(self.instance, "kind", None))
        category = attrs.get("category", getattr(self.instance, "category", None))

        if category is not None and category.kind != kind:
            raise serializers.ValidationError(
                {"category_id": "Category kind must match the transaction kind."}
            )
        return attrs


class TransferSerializer(serializers.ModelSerializer):
    from_account = AccountSerializer(read_only=True)
    from_account_id = serializers.PrimaryKeyRelatedField(
        source="from_account",
        queryset=Account.objects.all(),
        write_only=True,
    )
    to_account = AccountSerializer(read_only=True)
    to_account_id = serializers.PrimaryKeyRelatedField(
        source="to_account",
        queryset=Account.objects.all(),
        write_only=True,
    )

    class Meta:
        model = Transfer
        fields = (
            "id",
            "amount",
            "occurred_at",
            "description",
            "from_account",
            "from_account_id",
            "to_account",
            "to_account_id",
            "created",
        )
        read_only_fields = ("id", "created")

    def validate_from_account_id(self, account):
        request = self.context["request"]
        if account.user_id != request.user.id:
            raise serializers.ValidationError("Account not found.")
        return account

    def validate_to_account_id(self, account):
        request = self.context["request"]
        if account.user_id != request.user.id:
            raise serializers.ValidationError("Account not found.")
        return account

    def validate(self, attrs):
        if attrs["from_account"] == attrs["to_account"]:
            raise serializers.ValidationError(
                {"to_account_id": "Source and destination accounts must differ."}
            )
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        return create_transfer(user=request.user, **validated_data)
