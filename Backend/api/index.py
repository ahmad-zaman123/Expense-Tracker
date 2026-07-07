import os

from django.core.wsgi import get_wsgi_application

# Vercel's @vercel/python runtime detects the module-level ``app`` callable.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

app = get_wsgi_application()
