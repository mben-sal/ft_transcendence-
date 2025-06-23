

# Create your models here.
# models.py
from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class GameRoom(models.Model):
    class GameStatus(models.TextChoices):
        WAITING = 'waiting', 'Waiting for players'
        ACTIVE = 'active', 'Game in progress'
        COMPLETED = 'completed', 'Game finished'
        ABANDONED = 'abandoned', 'Game abandoned'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
   
    player1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='games_as_player1')
    player2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='games_as_player2')
    
    # Scores
    player1_score = models.PositiveIntegerField(default=0)
    player2_score = models.PositiveIntegerField(default=0)
    winning_score = models.PositiveIntegerField(default=5)  # Points needed to win
    
    # Game outcome
    winner = models.ForeignKey(User, on_delete=models.SET_NULL, 
                              null=True, blank=True, 
                              related_name='games_won')
    loser = models.ForeignKey(User, on_delete=models.SET_NULL,
                            null=True, blank=True,
                            related_name='games_lost')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    # Game state
    status = models.CharField(max_length=20, 
                             choices=GameStatus.choices, 
                             default=GameStatus.WAITING)

    def __str__(self):
        return f"Game {self.id} - {self.get_status_display()}"

    def start_game(self):
        """Mark game as started with timestamp"""
        self.status = self.GameStatus.ACTIVE
        self.started_at = timezone.now()
        self.save()

    def end_game(self, winner):
        """Finalize game results"""
        self.winner = winner
        self.loser = self.player2 if winner == self.player1 else self.player1
        self.status = self.GameStatus.COMPLETED
        self.ended_at = timezone.now()
        self.save()

class PlayerStats(models.Model):
    name = models.CharField(max_length=100, unique=True)
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.name}: Wins={self.wins}, Losses={self.losses}"