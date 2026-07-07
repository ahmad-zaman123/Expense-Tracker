from rest_framework import serializers

from apps.finance.choices import TransactionKind
from apps.finance.models import Account, Budget, Category


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ("id", "name", "opening_balance", "is_archived", "created")
        read_only_fields = ("id", "created")


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
