from .views import GameRoomDetailView
from . import views
from django.urls import path

urlpatterns = [
    # Existing URLs...
    path('game-rooms/<uuid:game_id>/', GameRoomDetailView.as_view(), name='game-room-detail'),
    path('game-rooms/<uuid:game_id>/start/', GameRoomDetailView.as_view(), name='game-start'),
    path('game-rooms/<uuid:game_id>/end/', GameRoomDetailView.as_view(), name='game-end'),
    path('update-stats/', views.UpdatePlayerStats, name='update_stats'),
    path('player-stats/<str:username>/', views.get_player_stats, name='get_player_stats'),
    path('top-players/', views.get_top_players, name='top-players'),
]