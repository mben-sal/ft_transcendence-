
# backend/routing.py
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
import chat.routing
import authen.routing

# Combine all WebSocket URL patterns from different apps
websocket_urlpatterns = (
    authen.routing.websocket_urlpatterns +
    chat.routing.websocket_urlpatterns
)

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns  # Single combined list
        )
    ),
})