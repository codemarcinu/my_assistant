"""
Konfiguracja Celery dla zadań w tle
"""

import os
from celery import Celery

# Ustawienia Celery
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

# Konfiguracja Celery
celery_config = {
    'broker_url': CELERY_BROKER_URL,
    'result_backend': CELERY_RESULT_BACKEND,
    'task_serializer': 'json',
    'accept_content': ['json'],
    'result_serializer': 'json',
    'timezone': 'Europe/Warsaw',
    'enable_utc': True,
    'task_track_started': True,
    'task_time_limit': 30 * 60,  # 30 minut
    'task_soft_time_limit': 25 * 60,  # 25 minut
    'worker_prefetch_multiplier': 1,
    'worker_max_tasks_per_child': 1000,
    'broker_connection_retry_on_startup': True,
}

# Inicjalizacja aplikacji Celery
celery_app = Celery('myappassistant')

# Ładowanie konfiguracji
celery_app.conf.update(celery_config)

# Auto-discovery zadań
celery_app.autodiscover_tasks(['backend.tasks'])

# Konfiguracja tasków
celery_app.conf.task_routes = {
    'backend.tasks.conversation_tasks.*': {'queue': 'conversation'},
    'backend.tasks.notification_tasks.*': {'queue': 'notifications'},
    'backend.tasks.receipt_tasks.*': {'queue': 'receipts'},
}

# Konfiguracja kolejek
celery_app.conf.task_default_queue = 'default'
celery_app.conf.task_default_exchange = 'default'
celery_app.conf.task_default_routing_key = 'default' 