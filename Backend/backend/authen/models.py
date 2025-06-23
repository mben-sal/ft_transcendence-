from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinLengthValidator
from django.utils import timezone
import uuid
from datetime import timedelta

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    intra_id = models.CharField(max_length=100, unique=True)
    # Use absolute path for default avatar - using a consistent format
    DEFAULT_AVATAR = '/media/avatars/defaultavatar.png'
    avatar = models.CharField(max_length=255, default=DEFAULT_AVATAR)
    display_name = models.CharField(
        max_length=100,
        unique=True,
        validators=[MinLengthValidator(3)]
    )
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=[
            ('online', 'Online'),
            ('offline', 'Offline'),
            ('in_game', 'In Game')
        ],
        default='offline'
    )
    two_factor_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.display_name} ({self.user.username})"

    def save(self, *args, **kwargs):
        if not self.created_at:
            self.created_at = timezone.now()
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'user_profiles'
        

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=15)  
        super().save(*args, **kwargs)

    def is_valid(self):
        return timezone.now() <= self.expires_at

    class Meta:
        db_table = 'password_reset_tokens'

class TwoFactorCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=2)
        super().save(*args, **kwargs)

    def is_valid(self):
        return (
            not self.is_used and
            timezone.now() <= self.expires_at
        )

    class Meta:
        db_table = 'two_factor_codes'
        

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('friend_request', 'Invitation ami'),
        ('message', 'Message'),
        ('game_invite', 'Invitation jeu'),
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    redirect_url = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        

class Friendship(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('accepted', 'Accepté'),
        ('rejected', 'Rejeté'),
    ]
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_friendships')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_friendships')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('sender', 'receiver')
        
    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"
    
class GameInvite(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('accepted', 'Accepté'),
        ('rejected', 'Rejeté'),
    ]

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_game_invites')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_game_invites')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"GameInvite: {self.sender.username} -> {self.receiver.username} ({self.status})"
    
class ActiveSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=100)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'active_sessions'

    
