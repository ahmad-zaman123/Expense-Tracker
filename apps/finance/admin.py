from django.contrib import admin

from apps.finance.models import Account, Budget, Category, Transaction, Transfer


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "opening_balance", "is_archived")
    list_filter = ("is_archived",)
    search_fields = ("name", "user__email")
    raw_id_fields = ("user",)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "kind", "is_archived")
    list_filter = ("kind", "is_archived")
    search_fields = ("name", "user__email")
    raw_id_fields = ("user",)


@admin.register(Transfer)
class TransferAdmin(admin.ModelAdmin):
    list_display = ("amount", "from_account", "to_account", "occurred_at", "user")
    search_fields = ("description", "user__email")
    raw_id_fields = ("user", "from_account", "to_account")
    date_hierarchy = "occurred_at"


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("kind", "amount", "account", "category", "occurred_at", "user")
    list_filter = ("kind", "source")
    search_fields = ("description", "payee", "user__email")
    raw_id_fields = ("user", "account", "category", "transfer")
    date_hierarchy = "occurred_at"


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ("category", "amount", "is_active", "user")
    list_filter = ("is_active",)
    search_fields = ("category__name", "user__email")
    raw_id_fields = ("user", "category")
