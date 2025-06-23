# Create your views here.
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Room , FriendBlock
from django.http import JsonResponse
from django.contrib.auth import get_user_model

# {
#   "room_id": 5,
#   "messages": [
#     {
#       "id": 1,
#       "sender": "amine",
#       "receiver": "nissrine",
#       "message": "Salut !",
#       "created_at": "2025-04-29T15:00:00"
#     },
#     {
#       "id": 2,
#       "sender": "nissrine",
#       "receiver": "amine",
#       "message": "Coucou :)",
#       "created_at": "2025-04-29T15:01:00"
#     }
#   ]
# }

def getMessages(request, room_id):
    # Récupérer la Room ou retourner 404
    room = get_object_or_404(Room, id=room_id)

    # Récupérer les messages associés à cette Room
    messages = room.messages.all().order_by('created_at')

    # Préparer les données à retourner
    messages_data = [
        {
            'id': msg.id,
            'sender': msg.sender.username,
            'receiver': msg.receiver.username,
            'message': msg.message,
            'created_at': msg.created_at.isoformat(),
        }
        for msg in messages # chaque message le meme
    ]

    return JsonResponse({'room_id': room.id, 'messages': messages_data}, safe=False)




def get_room(request, room_id):
    # Get the room using the room_id, or return 404 if not found
    room = get_object_or_404(Room, id=room_id)

    # Example of what you might return in the response
    # Adjust this based on your Room model fields
    room_data = {
        'id': room.id,
        'name': room.name,
        'members': [member.username for member in room.members.all()],  # Assuming `members` is a related field
        'created_at': room.created_at.isoformat(),
        # Add any other relevant room data here
    }

    # Return the room data as JSON
    return JsonResponse(room_data)

class PrivConvo(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            member_ids = request.data.get('members', [])
            is_direct = request.data.get('is_direct', False)


            print("member_ids ====================> ", member_ids)
            # Toujours ajouter l'utilisateur actuel
            current_user_id = request.user.id
        
            if current_user_id not in member_ids:
                member_ids.append(current_user_id)

            if is_direct and len(member_ids) == 2:
                # Chercher s'il existe une room entre ces deux utilisateurs (peu importe l'ordre)
                existing_room = Room.objects.filter(is_direct=True, members__id=member_ids[0]).filter(members__id=member_ids[1]).distinct().first()
                if existing_room:
                    return Response({
                        'message': 'Conversation already existed.',
                        'conversation_id': existing_room.id
                    }, status=status.HTTP_200_OK)

            # Créer une nouvelle Room
            convo = Room.objects.create(name=f"room_{'_'.join(map(str, sorted(member_ids)))}", is_direct=is_direct)
            members = User.objects.filter(id__in=member_ids)
            convo.members.set(members)
            convo.save()

            return Response({
                'message': 'Conversation created successfully!',
                'conversation_id': convo.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



User = get_user_model()
class FriendBlockView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # List all blocks by the current user
        blocks = FriendBlock.objects.filter(blocker=request.user).select_related('blocked')
        data = [{
            'id': block.id,
            'blocked_user': {
                'id': block.blocked.id,
                'username': block.blocked.username,
            },
            'created_at': block.created_at,
        } for block in blocks]
        return Response({'data': data})

    def post(self, request, *args, **kwargs):
        # Get friend_id from URL parameter instead of request body
        friend_id = kwargs.get('friend_id')
        
        if not friend_id:
            return Response(
                {'error': 'User ID is required in URL'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            blocked_user = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if blocked_user == request.user:
            return Response(
                {'error': 'You cannot block yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )

        block, created = FriendBlock.objects.get_or_create(
            blocker=request.user,
            blocked=blocked_user
        )

        response_data = {
            'success': True,
            'message': f'Successfully blocked {blocked_user.username}',
            'block_id': block.id
        }
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        
        return Response(response_data, status=status_code)

    def delete(self, request, *args, **kwargs):
        # Get friend_id from URL parameter
        friend_id = kwargs.get('friend_id')
        
        if not friend_id:
            return Response(
                {'error': 'User ID is required in URL'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            blocked_user = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        block = get_object_or_404(
            FriendBlock,
            blocker=request.user,
            blocked=blocked_user
        )

        block.delete()
        return Response(
            {'success': True, 'message': f'You have unblocked {blocked_user.username}'},
            status=status.HTTP_200_OK
        )
# class PrivConvo(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         try:
#             # name = request.data.get('name')
#             is_direct = request.data.get('is_direct', False)
#             member_ids = request.data.get('members', [])

#             # Validate data
#             if not name:
#                 return Response({'error': 'Name is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
#             # Get or create the conversation
#             convo, created = Room.objects.get_or_create(name=name, is_direct=is_direct)
            
#             if created:
#                 # If it's a new convo, set initial members
#                 if member_ids:
#                     members = User.objects.filter(id__in=member_ids)
#                     convo.members.set(members)

#             # Always add the creator (request.user) to the conversation
#             convo.members.add(request.user)

#             convo.save()

#             return Response({
#                 'message': 'Conversation created successfully!' if created else 'Conversation already existed.',
#                 'conversation_id': convo.id
#             }, status=status.HTTP_201_CREATED)

#         except Exception as e:
#             print(f"Erreur lors du traitement de la demande: {str(e)}")
#             return Response(
#                 {'error': str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
