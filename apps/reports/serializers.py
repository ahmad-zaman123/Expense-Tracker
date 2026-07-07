from rest_framework import serializers


class CategoryBreakdownSerializer(serializers.Serializer):
    category_id = serializers.UUIDField(allow_null=True)
    category_name = serializers.CharField(allow_null=True)
    kind = serializers.CharField()
    total = serializers.DecimalField(max_digits=14, decimal_places=2)


class MonthlyReportSerializer(serializers.Serializer):
    month = serializers.CharField()
    income = serializers.DecimalField(max_digits=14, decimal_places=2)
    expense = serializers.DecimalField(max_digits=14, decimal_places=2)
    net = serializers.DecimalField(max_digits=14, decimal_places=2)
    categories = CategoryBreakdownSerializer(many=True)


class BudgetStatusSerializer(serializers.Serializer):
    budget_id = serializers.UUIDField()
    category_id = serializers.UUIDField()
    category_name = serializers.CharField()
    limit = serializers.DecimalField(max_digits=14, decimal_places=2)
    spent = serializers.DecimalField(max_digits=14, decimal_places=2)
    remaining = serializers.DecimalField(max_digits=14, decimal_places=2)
    percent_used = serializers.DecimalField(max_digits=6, decimal_places=2)


class CashflowBucketSerializer(serializers.Serializer):
    period = serializers.DateField()
    income = serializers.DecimalField(max_digits=14, decimal_places=2)
    expense = serializers.DecimalField(max_digits=14, decimal_places=2)
    net = serializers.DecimalField(max_digits=14, decimal_places=2)
