from django.urls import path
from . import views

from .views import (
    PrivConvo,
    FriendBlockView
)

urlpatterns = [
    path('chat/rooms/', PrivConvo.as_view(), name='convo'), # create room if not found
    path('rooms/<int:room_id>/', views.get_room, name='get_room'), # get room by id
    path('conversations/<int:room_id>/messages/', views.getMessages, name='get_messages'), # get messages by room_id 
    path('conversations/<int:room_id>/messages/', views.getMessages, name='get_messages'), # get messages by room_id 
    #FriendBlockView
    path('blocks/', FriendBlockView.as_view(), name='friendblock-list'),
    path('blocks/<int:friend_id>/', FriendBlockView.as_view(), name='friendblock-detail'),
]