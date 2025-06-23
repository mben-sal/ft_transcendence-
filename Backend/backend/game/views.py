# import requests
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from rest_framework import status

# views.py
from django.shortcuts import get_object_or_404
from .models import GameRoom
from .serializers import GameRoomSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import GameRoom
from .serializers import GameRoomSerializer
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import F
from rest_framework.decorators import api_view
from .models import PlayerStats
from .serializers import UpdateStatsSerializer
# views.py
from rest_framework.decorators import api_view
from .serializers import PlayerStatsSerializer, UpdateStatsSerializer, TopPlayerSerializer

User = get_user_model()

class GameRoomDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, game_id):
        return get_object_or_404(GameRoom, id=game_id)

    def get(self, request, game_id):
        """Get game details by ID"""
        game = self.get_object(game_id)
        
        if request.user not in [game.player1, game.player2]:
            return Response(
                {"error": "You are not a participant in this game"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = GameRoomSerializer(game, context={'request': request})
        return Response(serializer.data)

    def post(self, request, game_id):
        """Handle game updates and custom actions"""
        action = request.data.get('action')
        
        if action == 'start':
            return self.start_game(request, game_id)
        elif action == 'end':
            return self.end_game(request, game_id)
        else:
            # Handle regular POST updates
            game = self.get_object(game_id)
            serializer = GameRoomSerializer(game, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def start_game(self, request, game_id):
        """Mark game as active"""
        game = self.get_object(game_id)
        
        if game.status != GameRoom.GameStatus.WAITING:
            return Response(
                {"error": "Game can only be started from waiting state"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.user not in [game.player1, game.player2]:
            return Response(
                {"error": "You are not a participant in this game"},
                status=status.HTTP_403_FORBIDDEN
            )

        game.status = GameRoom.GameStatus.ACTIVE
        game.started_at = timezone.now()
        game.save()
        return Response({"status": "Game started"}, status=status.HTTP_200_OK)

    def end_game(self, request, game_id):
        """Finalize game results"""
        game = self.get_object(game_id)
        winner_id = request.data.get('winner_id')

        if request.user not in [game.player1, game.player2]:
            return Response(
                {"error": "You are not a participant in this game"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            winner = User.objects.get(id=winner_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid winner ID"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if winner not in [game.player1, game.player2]:
            return Response(
                {"error": "Winner must be a game participant"},
                status=status.HTTP_400_BAD_REQUEST
            )

        game.winner = winner
        game.loser = game.player2 if winner == game.player1 else game.player1
        game.status = GameRoom.GameStatus.COMPLETED
        game.ended_at = timezone.now()
        game.save()

        # Update user stats
        winner_profile = winner.userprofile
        winner_profile.wins += 1
        winner_profile.save()

        loser_profile = game.loser.userprofile
        loser_profile.losses += 1
        loser_profile.save()

        return Response(
            GameRoomSerializer(game, context={'request': request}).data,
            status=status.HTTP_200_OK
        )
@api_view(['POST'])
@transaction.atomic
def UpdatePlayerStats(request):
    serializer = UpdateStatsSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    
    winner_name = serializer.validated_data['winner_name']
    loser_name = serializer.validated_data['loser_name']

    # Update winner stats
    winner, created = PlayerStats.objects.get_or_create(name=winner_name)
    if created:
        winner.wins = 1
        winner.save()
    else:
        PlayerStats.objects.filter(id=winner.id).update(wins=F('wins') + 1)

    # Update loser stats
    loser, created = PlayerStats.objects.get_or_create(name=loser_name)
    if created:
        loser.losses = 1
        loser.save()
    else:
        PlayerStats.objects.filter(id=loser.id).update(losses=F('losses') + 1)

    return Response({'status': 'success'})


@api_view(['GET'])
def get_player_stats(request, username):
    try:
        stats = PlayerStats.objects.get(name=username)
    except PlayerStats.DoesNotExist:
        return Response({'wins': 0, 'losses': 0})
    
    serializer = PlayerStatsSerializer(stats)
    return Response(serializer.data)

@api_view(['POST'])
@transaction.atomic
def update_player_stats(request):
    serializer = UpdateStatsSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    
    winner_name = serializer.validated_data['winner_name']
    loser_name = serializer.validated_data['loser_name']

    # Update winner - using update() with F() for atomic operation
    PlayerStats.objects.update_or_create(
        name=winner_name,
        defaults={'wins': F('wins') + 1}
    )

    # Update loser - using update() with F() for atomic operation
    PlayerStats.objects.update_or_create(
        name=loser_name,
        defaults={'losses': F('losses') + 1}
    )

    return Response({'status': 'success'})

@api_view(['GET'])
def get_top_players(request):
    top_players = PlayerStats.objects.order_by('-wins')[:3]  # Get top 3 by wins
    serializer = TopPlayerSerializer(top_players, many=True)
    return Response(serializer.data)

# # Path to your SSL certificate (same as Nginx config)
# SSL_CERT_PATH = "/etc/nginx/certs/cert.pem"

# class StartGameView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         token = request.headers.get('Authorization').split(" ")[1]
#         authen_url = "https://localhost/api/users/profile/"
#         headers = {'Authorization': f'Bearer {token}'}
        
#         try:
#             response = requests.get(
#                 authen_url,
#                 headers=headers,
#                 verify=SSL_CERT_PATH  # Use your certificate
#             )
#             response.raise_for_status()
            
#             player_1_data = response.json()
#             return Response({
#                 "player_1": {
#                     "display_name": player_1_data.get('display_name', ''),
#                     "avatar": player_1_data.get('avatar', '')
#                 }
#             }, status=status.HTTP_200_OK)

#         except requests.exceptions.RequestException as e:
#             return Response({"error": f"Authentication service error: {str(e)}"},
#                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class FriendsListView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         token = request.headers.get("Authorization", "")
#         if not token.startswith("Bearer "):
#             return Response({"error": "Invalid token format"}, status=400)

#         try:
#             # Get player info with cert verification
#             player_info = requests.post(
#                 "https://localhost/api/game/start/",
#                 headers={"Authorization": token},
#                 verify=SSL_CERT_PATH
#             )
#             player_info.raise_for_status()
#             player_username = player_info.json().get("player_1", {}).get("display_name")

#             # Get friends list with cert verification
#             friends_response = requests.get(
#                 "https://localhost/api/users/friends/",
#                 headers={"Authorization": token},
#                 verify=SSL_CERT_PATH
#             )
#             friends_response.raise_for_status()
#             friends_data = friends_response.json()

#         except requests.exceptions.RequestException as e:
#             return Response({"error": f"Service error: {str(e)}"}, status=400)

#         # ... rest of FriendsListView remains the same ...

# class CombinedMatchmakingView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         try:
#             # Both requests with certificate verification
#             start_response = requests.post(
#                 "https://localhost/api/game/start/",
#                 headers={"Authorization": request.headers.get("Authorization", "")},
#                 verify=SSL_CERT_PATH
#             )
#             start_response.raise_for_status()

#             friends_response = requests.get(
#                 "https://localhost/api/game/friendslist/",
#                 headers={"Authorization": request.headers.get("Authorization", "")},
#                 verify=SSL_CERT_PATH
#             )
#             friends_response.raise_for_status()

#         except requests.exceptions.RequestException as e:
#             return Response({"error": f"Matchmaking error: {str(e)}"}, status=400)

#         return Response({
#             "player": start_response.json().get("player_1", {}),
#             "friends": friends_response.json().get("friends", [])
#         })