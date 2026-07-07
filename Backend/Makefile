.PHONY: run migrate makemigrations superuser test format lint shell detect-recurring compile install

run:
	python manage.py runserver

makemigrations:
	python manage.py makemigrations

migrate:
	python manage.py makemigrations && python manage.py migrate

superuser:
	python manage.py createsuperuser

test:
	pytest

format:
	black . && isort .

lint:
	flake8 .

shell:
	python manage.py shell

detect-recurring:
	python manage.py detect_recurring

compile:
	pip-compile requirements/base.in
	pip-compile requirements/dev.in
	pip-compile requirements/prod.in

install:
	pip-sync requirements/dev.txt
