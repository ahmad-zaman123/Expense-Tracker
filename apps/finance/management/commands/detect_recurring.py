from django.core.management.base import BaseCommand

from apps.finance.services.recurring import detect_recurring_all_users


class Command(BaseCommand):
    help = "Detect recurring transactions and upsert RecurringRule records."

    def handle(self, *args, **options):
        count = detect_recurring_all_users()
        self.stdout.write(self.style.SUCCESS("Upserted %d recurring rule(s)." % count))
