from channels.generic.websocket import AsyncWebsocketConsumer
import json
from asgiref.sync import sync_to_async
from authen.models import UserProfile
from .models import Room, Message, FriendBlock
from channels.db import database_sync_to_async
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from django.db.models import Q  # Add this import at the top of your file

@database_sync_to_async
def check_if_blocked(blocker_id, blocked_id):
  
    block_exists = FriendBlock.objects.filter(
        (Q(blocker_id=blocker_id) & Q(blocked_id=blocked_id)) | 
        (Q(blocker_id=blocked_id) & Q(blocked_id=blocker_id))
    ).exists()     
    
    return block_exists

@database_sync_to_async
def get_user_id(username):
    """Get user ID from username"""
    return User.objects.get(username=username).id

@database_sync_to_async
def save_message(room_id, sender_username, receiver_username, message_text):
    """Save message to database"""
    sender = User.objects.get(username=sender_username)
    receiver = User.objects.get(username=receiver_username)
    room = Room.objects.get(id=room_id)
    return Message.objects.create(
        room=room,
        sender=sender,
        receiver=receiver,
        message=message_text
    )

# def get_current_time():
#     return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
def get_current_time():
    return (datetime.now() + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")

class PrivateChat(AsyncWebsocketConsumer):
    async def connect(self):
        self.username = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"prv_chat_{self.username}_channel"
        
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.channel_layer.group_add("active_users", self.channel_name)
        await self.accept()
        
        await self.send(text_data=json.dumps({
            'type': 'connection',
            'message': 'You are now connected!',
            'sender': 'System',
            'timestamp': get_current_time(),
            'status': 'connected'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            sender_username = data['sender']
            room_id = data['room_id']
            receiver_username = data['receiver']
            message = data['message']
            
            # Get actual user IDs (await these coroutines)
            sender_id = await get_user_id(sender_username)
            receiver_id = await get_user_id(receiver_username)
            

            isblocked = await check_if_blocked(receiver_id, sender_id)
            print("isblocked: ", isblocked)
            if isblocked:
                return await self.send_error('Message not sent. You have been blocked by this user.')
            else:
                # Save and forward message
                await save_message(room_id, sender_username, receiver_username, message)
                
                message_data = {
                    'type': 'chat_message',
                    'message': message,
                    'sender': sender_username,
                    'receiver': receiver_username,
                    'timestamp': get_current_time(),
                    'is_sent': False
                }
            
                # Send to sender
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {**message_data, 'is_sent': True}
                )
                
                # Send to receiver
                await self.channel_layer.group_send(
                    f"prv_chat_{receiver_username}_channel",
                    message_data
                )
            
        except Exception as e:
            await self.send_error(str(e))

    async def send_error(self, message):
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender': event['sender'],
            'receiver': event['receiver'],
            'created_at': event['timestamp'],
            'is_sent': event['is_sent']
        }))
# # consumers.py
# from channels.generic.websocket import AsyncWebsocketConsumer
# import json
# from django.contrib.auth import get_user_model
# from asgiref.sync import sync_to_async
# from authen.models import UserProfile
# from .models import Room, Message
# from channels.db import database_sync_to_async
# from django.db.models import Q
# from datetime import datetime
# from django.contrib.auth.models import User
# from .models import FriendBlock  # Make sure this points to where your model is defined
# from django.core.cache import cache  # Import cache if using caching

# # User = get_user_model()

# @database_sync_to_async
# def check_if_blocked(blocker, blocked):
#     print("blocker=======IDs: ", blocker)
#     print("sender=======IDs: ", blocked)
#     cache_key = f"block_status:{blocker}:{blocked}"
#     cached = cache.get(cache_key)
#     if cached is not None:
#         return cached
  
#     exists = FriendBlock.objects.filter(
#         blocker_id=blocker,
#         blocked_id=blocked
#     ).exists()
    
#     cache.set(cache_key, exists, timeout=300)  # Cache for 5 minutes
#     return exists

# @database_sync_to_async
# def save_message(room_id, sender_username, receiver_username, message_text):
#     sender = User.objects.get(username=sender_username)
#     receiver = User.objects.get(username=receiver_username)
#     room = Room.objects.get(id=room_id)
#     return Message.objects.create(
#         room=room,
#         sender=sender,
#         receiver=receiver,
#         message=message_text
#     )


# def get_current_time():
#     now = datetime.now()
#     return now.strftime("%Y-%m-%d %H:%M:%S")

# @database_sync_to_async
# def get_user_obj(username):
#     return User.objects.get(username=username).id

# class PrivateChat(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.username = self.scope['url_route']['kwargs']['room_name']
#         self.room_group_name = f"prv_chat_{self.username}_channel"

#         # Join room group
#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.channel_layer.group_add("active_users", self.channel_name)
        
#         await self.accept()

#         # Send welcome message with connection status
#         await self.send(text_data=json.dumps({
#             'type': 'connection',
#             'message': 'You are now connected!',
#             'sender': 'System',
#             'timestamp': get_current_time(),
#             'status': 'connected'
#         }))

#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

#     async def receive(self, text_data):
#         try:
#             data = json.loads(text_data)
#             sender = data['sender']
#             room_id = data['room_id']
#             receiver = data['receiver']
#             message = data['message']
#             timestamp = get_current_time()
#             to_group_name = f"prv_chat_{receiver}_channel"

#             sender_id = get_user_obj(sender)
#             receiver_id = get_user_obj(receiver)

#             is_blocked = await check_if_blocked(receiver_id, sender_id)
#             print("is block or no ==>", is_blocked)
            
#             if is_blocked:
#                 return await self.send(text_data=json.dumps({
#                     'type': 'error',
#                     'message': 'Message not sent. You have been blocked by this user.'
#                 }))

#             is_blocking = await check_if_blocked(sender_id, receiver_id)
#             if is_blocking:
#                 return await self.send(text_data=json.dumps({
#                     'type': 'error',
#                     'message': 'Message not sent. You have blocked this user.'
#                 }))
            
#             await save_message(room_id, sender, receiver, message)
#             # room = await sync_to_async(Room.objects.get)(id=room_id)

#             # Prepare message data with additional info for frontend display
#             message_data = {
#                 'type': 'chat_message',
#                 'message': message,
#                 'sender': sender,
#                 'receiver': receiver,
#                 'timestamp': timestamp,
#                 'is_sent': False  # Flag to distinguish sent/received messages
#             }

#             # Send to sender (with is_sent=True)
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {**message_data, 'is_sent': True}
#             )
            
#             # Send to receiver (with is_sent=False)
#             await self.channel_layer.group_send(
#                 to_group_name,
#                 message_data
#             )

#         except Exception as e:
#             await self.send(text_data=json.dumps({
#                 'type': 'error',
#                 'message': str(e)
#             }))

#     async def chat_message(self, event):
#         # Send message to WebSocket with all needed data for bubble display
#         await self.send(text_data=json.dumps({
#             'type': 'chat_message',
#             'message': event['message'],
#             'sender': event['sender'],
#             'receiver': event['receiver'],
#             'created_at': event['timestamp'],
#             'is_sent': event['is_sent']  # Frontend will use this to style the bubble
#         }))





# # consumers.py
# from channels.generic.websocket import AsyncWebsocketConsumer
# import json
# # from .models import PrivateMessageModel, Conversation, Notifications, BlockedList
# from django.contrib.auth import get_user_model
# from asgiref.sync import sync_to_async
# # from ..authen.models import UserProfile
# from authen.models import UserProfile  # absolute import
# # from .models import Message
# from channels.db import database_sync_to_async
# from django.core.cache import cache
# from django.db.models import Q
# from datetime import datetime

# def get_current_time():
#     now = datetime.now()
#     return now.strftime("%Y-%m-%d %H:%M:%S")

# @sync_to_async
# def get_user_obj(username):
#     return UserProfile.objects.get(user__username=username)
# # @sync_to_async
# # def get_blocked_friends(fr_block_list):
# #     return list(fr_block_list.blocked_friends.all())
# # @sync_to_async
# # def get_private_messages(receiver_obj, sender_obj):
# #     return list(PrivateMessageModel.objects.filter(
# #         Q(receiver=receiver_obj, sender=sender_obj) | Q(receiver=sender_obj, sender=receiver_obj)
# #     ).select_related('receiver', 'sender').order_by('-timestamp'))



# # @sync_to_async
# # def store_notifications(sender_obj, receiver_obj, timestamp):
# #     return Notifications.objects.create(
# #         user1=sender_obj,
# #         user2=receiver_obj,
# #         notify_at=timestamp
# #     )

# # @sync_to_async
# # def store_private_messages(sender_obj, receiver_obj, message, timestamp):
# #     if message:
# #         conversation, created = Conversation.objects.get_or_create(
# #             user1=sender_obj, user2=receiver_obj,
# #             defaults={'last_message_at': timestamp}
# #         )
# #         if not created:
# #             conversation.last_message_at = timestamp
# #             conversation.save()

# #         conversation_reverse, created_reverse = Conversation.objects.get_or_create(
# #             user1=receiver_obj, user2=sender_obj,
# #             defaults={'last_message_at': timestamp}
# #         )

# #         if not created_reverse:
# #             conversation_reverse.last_message_at = timestamp
# #             conversation_reverse.save()
# #         return PrivateMessageModel.objects.create(sender=sender_obj, receiver=receiver_obj, content=message)

# @sync_to_async
# def get_sender_username(msg):
#     return msg.sender.user.username

# # @sync_to_async
# # def check_blockedList(blocker, blocked_user):
# #     blockedlist =  BlockedList.objects.filter(
# #         Q(blocker=blocker, blocked=blocked_user) | Q(blocker=blocked_user, blocked=blocker)).first()
# #     if blockedlist:
# #         return True
# #     return False
#     # blockedlist = BlockedList.objects.filter(Q(blocker=blocker) & Q(blocked=blocked_user)).first()
#     # beingblockedlist = BlockedList.objects.filter(Q(blocker=blocked_user) & Q(blocked=blocker)).first()
#     # if blockedlist:
#     #     return blockedlist
#     # if beingblockedlist:
#     #     return beingblockedlist
#     # return None

# # onine_userslist = []
# class PrivateChat(AsyncWebsocketConsumer):
#     async def connect(self):
#         print("=======================================================")
#         self.username = self.scope['url_route']['kwargs']['room_name']
#         self.room_group_name = f"prv_chat_{self.username}_channel"

#         # Join room group(every user has a group that contain one or multiple channel_namezzz)
#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         # everyone connected(online), I add them to the active_users group, and everytime someone connected I broadcast the onine_userslist to everyone in this group.
#         await self.channel_layer.group_add("active_users", self.channel_name)
#         # update the list of online userzzz
#         # onine_userslist.append(self.username)
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'connectedfunc',
#                 'sender': "server",
#                 'receiver': self.username,
#                 'message': "Hello from server"
#             }
#         )
#         await self.accept()

#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

#     async def receive(self, text_data):
#         data = json.loads(text_data)
#         sender = data['sender']
#         receiver = data['receiver']
#         message = data['message']
#         timestamp = get_current_time()
#         to_group_name = f"prv_chat_{receiver}_channel"

#         print("===============Data: \n", data)


#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                     'type': 'prv_message',
#                     'message': message,
#                     'sender': sender,
#                     'receiver': receiver,
#                     'timestamp': timestamp,            }
#         )
#         await self.channel_layer.group_send(
#             to_group_name,
#             {
#                     'type': 'prv_message',
#                     'message': message,
#                     'sender': sender,
#                     'receiver': receiver,
#                     'timestamp': timestamp,
#             }
#         )

#     async def prv_message(self, event):
#         message = event['message']
#         sender = event['sender']
#         receiver = event['receiver']
#         timestamp = event['timestamp']        
#         await self.send(text_data=json.dumps({
#             'content': message,
#             'senderName': sender,
#             'receiverName': receiver,
#             'timestamp': timestamp,
#         }))

#     async def connectedfunc(self, event):
#         sender = event['sender']
#         receiver = event['receiver']
#         message = event['message']
        
#         await self.send(text_data=json.dumps({
#             'sender': sender,
#             'receiver': receiver,
#             'message': message
#     }))
# #================================================================================ End of idryab ================================================================================  