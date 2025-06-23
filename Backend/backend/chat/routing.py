from django.urls import path
from . import consumers
# from django.urls import re_path

# Define WebSocket URL patterns
websocket_urlpatterns = [
    path('ws/prvchat/<str:room_name>/', consumers.PrivateChat.as_asgi()),
]