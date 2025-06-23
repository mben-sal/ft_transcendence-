# serializers.py
from rest_framework import serializers
from .models import GameRoom
from .models import PlayerStats

class GameRoomSerializer(serializers.ModelSerializer):
    # Player 1 Fields
    player1_name = serializers.CharField(source='player1.userprofile.display_name', read_only=True)
    player1_avatar = serializers.CharField(source='player1.userprofile.avatar', read_only=True)
    player1_id = serializers.IntegerField(source='player1.id', read_only=True)
    player1_intra_id = serializers.CharField(source='player1.userprofile.intra_id', read_only=True)

    # Player 2 Fields
    player2_name = serializers.CharField(source='player2.userprofile.display_name', read_only=True)
    player2_avatar = serializers.CharField(source='player2.userprofile.avatar', read_only=True)
    player2_id = serializers.IntegerField(source='player2.id', read_only=True)
    player2_intra_id = serializers.CharField(source='player2.userprofile.intra_id', read_only=True)

    # Winner Field
    winner_username = serializers.CharField(source='winner.username', read_only=True, allow_null=True)
    duration = serializers.SerializerMethodField()

    class Meta:
        model = GameRoom
        fields = [
            'id',
            # Player 1
            'player1_id', 'player1_name', 'player1_avatar', 'player1_intra_id', 'player1_score',
            # Player 2 
            'player2_id', 'player2_name', 'player2_avatar', 'player2_intra_id', 'player2_score',
            # Game Info
            'winner_username', 'loser', 'status', 'winning_score',
            # Timestamps
            'created_at', 'started_at', 'ended_at', 'duration'
        ]
        extra_kwargs = {
            'player1': {'write_only': True},
            'player2': {'write_only': True},
            'winner': {'write_only': True}
        }

    def get_duration(self, obj):
        if obj.started_at and obj.ended_at:
            return (obj.ended_at - obj.started_at).total_seconds()
        return None
    
class PlayerStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlayerStats
        fields = ['wins', 'losses']

class UpdateStatsSerializer(serializers.Serializer):
    winner_name = serializers.CharField(max_length=100)
    loser_name = serializers.CharField(max_length=100)

class TopPlayerSerializer(serializers.ModelSerializer):
    points = serializers.SerializerMethodField()
    
    class Meta:
        model = PlayerStats
        fields = ['name', 'points']

    def get_points(self, obj):
        # 1 win = 100 points
        return obj.wins * 100
    
