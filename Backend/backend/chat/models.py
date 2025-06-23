from django.db import models
from django.contrib.auth.models import User


# Create your models here.
class Room(models.Model):
    name = models.CharField(max_length=255)
    is_direct = models.BooleanField(default=False)
    members = models.ManyToManyField(User, related_name='rooms')
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    room = models.ForeignKey(Room, related_name='messages', on_delete=models.CASCADE, null=True)
    # room = models.ForeignKey(Room, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class FriendBlock(models.Model):
    
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bloker_friend')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_friend')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('blocker', 'blocked')
        
    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"
    