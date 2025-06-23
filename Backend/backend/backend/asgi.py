"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

# Set Django settings module first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Initialize Django before importing models
django.setup()

# Now import your WebSocket routes
from chat.routing import websocket_urlpatterns as chat_websocket_urlpatterns
from authen.routing import websocket_urlpatterns as authen_websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter(
        chat_websocket_urlpatterns + authen_websocket_urlpatterns
    ),
})