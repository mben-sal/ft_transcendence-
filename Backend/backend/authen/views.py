from .models import Notification, Friendship, GameInvite
from .serializers import NotificationSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.core.mail import send_mail
from django.template.loader import render_to_string
from .models import PasswordResetToken
from django.shortcuts import redirect
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
import requests
from .models import UserProfile
from .serializers import UserSerializer, LoginSerializer, UserProfileSerializer , SignUpSerializer, DeleteAccountConfirmSerializer, FriendshipSerializer, FriendRequestSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework_simplejwt.tokens import RefreshToken
from urllib.parse import urlencode
import os
import random
import string
import uuid
import jwt
from django.core.mail import send_mail
from django.template.loader import render_to_string
from .models import TwoFactorCode
from django.utils import timezone
from datetime import timedelta
from datetime import datetime
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework.views import APIView
from rest_framework import status
from datetime import datetime
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import authenticate
from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from django.db.models import Q
from django.db import transaction
from rest_framework import status
from .serializers import GameInviteSerializer
from django.shortcuts import get_object_or_404
from game.models import GameRoom  
from .models import ActiveSession
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UserProfile
from .serializers import UserProfileSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            with transaction.atomic():
                serializer = LoginSerializer(data=request.data)
                if not serializer.is_valid():
                    return Response({
                        'status': 'error',
                        'message': 'Invalid data format',
                        'errors': serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)

                login_name = serializer.validated_data['login_name']
                password = serializer.validated_data['password']
                
                try:
                    user_profile = UserProfile.objects.get(intra_id=login_name)
                    user = user_profile.user
                except UserProfile.DoesNotExist:
                    try:
                        user = User.objects.get(email=login_name)
                        user_profile = user.userprofile
                    except (User.DoesNotExist, UserProfile.DoesNotExist):
                        return Response({
                            'status': 'error',
                            'message': 'Invalid credentials'
                        }, status=status.HTTP_401_UNAUTHORIZED)

                if user.check_password(password):
                    if user_profile.two_factor_enabled:
                        # Générer un code 2FA
                        code = ''.join(random.choices(string.digits, k=6))
                        TwoFactorCode.objects.create(
                            user=user,
                            code=code,
                            expires_at=timezone.now() + timedelta(minutes=2)
                        )
                        
                        # Envoyer le code par email
                        html_content = render_to_string('two_factor_email.html', {
                            'user': user,
                            'code': code,
                            'expires_in': '2 minutes'
                        })
                        
                        send_mail(
                            subject='Code de vérification',
                            message=f'Votre code de vérification est : {code}',
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[user.email],
                            fail_silently=False,
                            html_message=html_content
                        )
                        
                        # Créer un token temporaire pour la vérification 2FA
                        temp_token = jwt.encode(
                            {
                                'user_id': user.id, 
                                'exp': timezone.now() + timedelta(minutes=10)
                            },
                            settings.SECRET_KEY,
                            algorithm='HS256'
                        )
                        
                        return Response({
                            'requires_2fa': True,
                            'temp_token': temp_token
                        })
                    else:
                        # Connexion sans 2FA
                        user_profile.status = 'online'
                        user_profile.save()
                        
                        session_key = request.session.session_key
                        if not session_key:
                            request.session.create()
                            session_key = request.session.session_key
                            
                        from .models import ActiveSession  # Importez le modèle ici si besoin
                        ActiveSession.objects.update_or_create(
                            user=user,
                            defaults={
                                'session_key': session_key,
                                'last_activity': timezone.now()
                            }
                        )
                        
                        refresh = RefreshToken.for_user(user)
                        return Response({
                            'requires_2fa': False,
                            'token': str(refresh.access_token),
                            'refresh_token': str(refresh),
                            'user': UserProfileSerializer(user_profile).data
                        })
                else:
                    return Response({
                        'status': 'error',
                        'message': 'Invalid credentials'
                    }, status=status.HTTP_401_UNAUTHORIZED)

        except Exception as e:
            print(f"Login error: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'An error occurred during login'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FortyTwoLoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        state = request.GET.get('state', 'signin')
        auth_params = {
            'client_id': settings.FT_CLIENT_ID,
            'redirect_uri': settings.FT_REDIRECT_URI,
            'response_type': 'code',
            'scope': 'public',
            'state': state
        }
        
        auth_url = f"https://api.intra.42.fr/oauth/authorize?{urlencode(auth_params)}"
        return redirect(auth_url)

class FortyTwoCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        print("=== Starting FortyTwoCallbackView ===")
        try:
            code = request.GET.get('code')
            state = request.GET.get('state', 'signin')

            token_response = requests.post(
                settings.FT_TOKEN_URL,
                data={
                    'grant_type': 'authorization_code',
                    'client_id': settings.FT_CLIENT_ID,
                    'client_secret': settings.FT_CLIENT_SECRET,
                    'code': code,
                    'redirect_uri': settings.FT_REDIRECT_URI
                }
            )
            
            if not token_response.ok:
                print(f"Token error: {token_response.text}")
                return Response({
                    'status': 'error',
                    'message': 'Failed to get access token'
                }, status=status.HTTP_400_BAD_REQUEST)

            token_data = token_response.json()
            
            user_response = requests.get(
                f'{settings.FT_API_URL}/v2/me',
                headers={'Authorization': f'Bearer {token_data["access_token"]}'}
            )
            
            if not user_response.ok:
                print(f"User data error: {user_response.text}")
                return Response({
                    'status': 'error',
                    'message': 'Failed to get user data'
                }, status=status.HTTP_400_BAD_REQUEST)

            user_data = user_response.json()
            
            user, created = User.objects.get_or_create(
                username=user_data['login'],
                defaults={
                    'email': user_data.get('email', ''),
                    'first_name': user_data.get('first_name', ''),
                    'last_name': user_data.get('last_name', '')
                }
            )

            profile_defaults = {
                'intra_id': user_data['login'],
                'avatar': user_data.get('image', {}).get('link', ''),
                'display_name': user_data.get('displayname', user_data['login']),
                'status': 'online',
                'two_factor_enabled': False
            }

            profile, created_profile = UserProfile.objects.get_or_create(
                user=user,
                defaults=profile_defaults
            )

            if not created_profile:
                profile.status = 'online'
                # profile.two_factor_enabled = True
                profile.save()

            print(f"2FA enabled: {profile.two_factor_enabled}")

            if profile.two_factor_enabled:
                print("Generating 2FA code")
                code = ''.join(random.choices(string.digits, k=6))
                TwoFactorCode.objects.create(
                    user=user,
                    code=code,
                    expires_at=timezone.now() + timedelta(minutes=2)
                )
                
                html_content = render_to_string('two_factor_email.html', {
                    'user': user,
                    'code': code,
                    'expires_in': '10 minutes'
                })
                
                send_mail(
                    subject='Code de vérification',
                    message=f'Votre code de vérification est : {code}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                    html_message=html_content
                )
                
                temp_token = jwt.encode(
                    {
                        'user_id': user.id,
                        'exp': int((timezone.now() + timedelta(minutes=10)).timestamp())
                    },
                    settings.SECRET_KEY,
                    algorithm='HS256'
                )
                
                redirect_url = (
                    # f"{settings.FRONTEND_URL}/auth/callback"
                    f"{settings.FRONTEND_URL}/auth/callback"
                    f"?requires_2fa=true"
                    f"&temp_token={temp_token}"
                    f"&email={user.email}"
                )
                print(f"Redirecting to 2FA verification")
            else:
                print("No 2FA required, proceeding with normal login")
                refresh = RefreshToken.for_user(user)
                redirect_url = (
                    f"{settings.FRONTEND_URL}/auth/callback"
                    f"?access_token={str(refresh.access_token)}"
                    f"&refresh_token={str(refresh)}"
                    f"&is_new_user={str(created).lower()}"
                )

            return redirect(redirect_url)

        except Exception as e:
            print(f"Error in FortyTwoCallbackView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
            
            # Update user fields directly
            user = profile.user
            user.first_name = request.data.get('first_name', user.first_name)
            user.last_name = request.data.get('last_name', user.last_name)
            user.save()
            
            # Update profile fields
            if 'two_factor_enabled' in request.data:
                profile.two_factor_enabled = request.data['two_factor_enabled']
                profile.save()
            
            return Response(UserProfileSerializer(profile).data)
        except Exception as e:
            print("Update error:", str(e))
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            with transaction.atomic():
                # Supprimer la session active
                session_key = request.session.session_key
                if session_key:
                    ActiveSession.objects.filter(
                        user=request.user,
                        session_key=session_key
                    ).delete()
                
                # Forcer le statut offline
                UserProfile.objects.filter(user=request.user).update(
                    status='offline',
                    updated_at=timezone.now()
                )
                
                # Blacklister le token
                refresh_token = request.data.get('refresh_token')
                if refresh_token:
                    try:
                        token = RefreshToken(refresh_token)
                        token.blacklist()
                    except Exception as token_error:
                        print(f"Token blacklist error: {str(token_error)}")
                
                return Response({'status': 'success'})
        except Exception as e:
            print(f"Logout error: {str(e)}")
            # Forcer le statut offline même en cas d'erreur
            UserProfile.objects.filter(user=request.user).update(status='offline')
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UpdateAvatarView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("=== Starting avatar upload ===")
        try:
            print("Files in request:", request.FILES)
            
            if 'avatar' not in request.FILES:
                print("No avatar file found in request")
                return Response(
                    {'error': 'No image file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            image_file = request.FILES['avatar']
            print(f"File type: {image_file.content_type}")
            print(f"File size: {image_file.size}")
            
            allowed_types = ['image/jpeg', 'image/png', 'image/gif']
            if image_file.content_type not in allowed_types:
                print(f"Invalid file type: {image_file.content_type}")
                return Response(
                    {'error': f'Invalid file type: {image_file.content_type}. Only JPEG, PNG and GIF are allowed.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            file_extension = os.path.splitext(image_file.name)[1].lower()
            if not file_extension:
                file_extension = '.jpg'
            
            file_path = f'avatars/user_{request.user.id}{file_extension}'
            print(f"Saving to path: {file_path}")

            try:
                path = default_storage.save(file_path, ContentFile(image_file.read()))
                print(f"File saved successfully at: {path}")
                
                # Generate a consistent URL path that will work with Nginx config
                file_url = f"/media/{path}"
                print(f"File URL: {file_url}")

                profile = request.user.userprofile
                
                # Delete old image if it exists and is not the default avatar
                if profile.avatar and profile.avatar != profile.DEFAULT_AVATAR:
                    try:
                        # Remove /media/ prefix for storage operations
                        old_path = profile.avatar.replace('/media/', '', 1)
                        if default_storage.exists(old_path):
                            default_storage.delete(old_path)
                    except Exception as delete_error:
                        print(f"Warning: Failed to delete old avatar: {delete_error}")
                
                profile.avatar = file_url
                profile.save()
                print("Profile updated successfully")

                return Response({
                    'status': 'success',
                    'avatarUrl': file_url
                })

            except Exception as e:
                print(f"Error saving file: {str(e)}")
                raise

        except Exception as e:
            print(f"Error handling avatar upload: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request):
        print("=== Starting avatar deletion ===")
        try:
            profile = request.user.userprofile
            
            if profile.avatar and profile.avatar != profile.DEFAULT_AVATAR:
                # Remove /media/ prefix for storage operations
                file_path = profile.avatar.replace('/media/', '', 1)
                if default_storage.exists(file_path):
                    default_storage.delete(file_path)
                    print(f"Deleted file: {file_path}")
                
                # Reset avatar to default
                profile.avatar = profile.DEFAULT_AVATAR
                profile.save()
                print("Reset avatar to default")
                
                return Response({
                    'status': 'success',
                    'message': 'Avatar removed successfully',
                    'avatarUrl': profile.DEFAULT_AVATAR
                })
            
            return Response({
                'status': 'error',
                'message': 'No custom avatar to delete'
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"Error deleting avatar: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SignUpView(APIView):
    def post(self, request):
        try:
            print("Données reçues:", request.data)
            serializer = SignUpSerializer(data=request.data)
            
            if not serializer.is_valid():
                print("Erreurs de validation:", serializer.errors)
                return Response({
                    'status': 'error',
                    'message': 'Données invalides',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            
            user = User.objects.create(
                username=validated_data['login_name'],
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name']
            )
            
            user.set_password(validated_data['password'])
            user.save()

            # Créer le profil utilisateur
            profile = UserProfile.objects.create(
                user=user,
                intra_id=validated_data['login_name'],
                display_name=validated_data['login_name'],
                status='online',
                two_factor_enabled=validated_data.get('two_factor_enabled', False)
            )

            # Créer et renvoyer le token
            refresh = RefreshToken.for_user(user)
            return Response({
                'status': 'success',
                'message': 'Utilisateur créé avec succès',
                'token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserProfileSerializer(profile).data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    permission_classes = []

    def post(self, request):
        print("=== Démarrage du processus de réinitialisation ===")
        try:
            serializer = PasswordResetRequestSerializer(data=request.data)
            if not serializer.is_valid():
                print("Erreurs de validation:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            email = serializer.validated_data['email']
            print(f"Email reçu: {email}")

            try:
                user = User.objects.get(email=email)
                print(f"Utilisateur trouvé: {user.username}")

                # Supprimer les anciens tokens
                PasswordResetToken.objects.filter(user=user).delete()
                reset_token = PasswordResetToken.objects.create(user=user)
                print(f"Token créé: {reset_token.token}")

                reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={reset_token.token}"
                print(f"URL de réinitialisation: {reset_url}")

                try:
                    # Préparer le contenu de l'email
                    context = {
                        'user': user,
                        'reset_url': reset_url,
                        'expires_in': '15 minutes'
                    }
                    
                    print("Tentative de rendu du template...")
                    html_content = render_to_string('password_reset_email.html', context)
                    print("Template rendu avec succès")

                    print("Configuration email:")
                    print(f"HOST: {settings.EMAIL_HOST}")
                    print(f"PORT: {settings.EMAIL_PORT}")
                    print(f"FROM: {settings.DEFAULT_FROM_EMAIL}")
                    print(f"TO: {email}")

                    send_mail(
                        subject='Réinitialisation de votre mot de passe',
                        message=f'Pour réinitialiser votre mot de passe, cliquez sur ce lien : {reset_url}',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[email],
                        fail_silently=False,
                        html_message=html_content
                    )
                    print("Email envoyé avec succès!")

                except Exception as template_error:
                    print(f"Erreur lors du rendu du template ou de l'envoi de l'email: {str(template_error)}")
                    return Response({
                        'message': "Une erreur est survenue lors de l'envoi de l'email."
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            except User.DoesNotExist:
                # Ne pas révéler si l'utilisateur existe ou non
                print(f"Aucun utilisateur trouvé avec l'email: {email}")
                pass

            return Response({
                'message': 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
            })

        except Exception as e:
            print(f"Erreur inattendue: {str(e)}")
            return Response({
                'message': 'Une erreur inattendue est survenue.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetConfirmView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data) 
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            
            if not reset_token.is_valid():
                reset_token.delete()
                return Response({
                    'status': 'error',
                    'message': 'Ce lien de réinitialisation a expiré.'
                }, status=status.HTTP_400_BAD_REQUEST)

            user = reset_token.user
            user.set_password(new_password)
            user.save()

            # Supprimer le token après utilisation
            reset_token.delete()

            return Response({
                'status': 'success',
                'message': 'Votre mot de passe a été réinitialisé avec succès.'
            })

        except PasswordResetToken.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Le lien de réinitialisation est invalide ou a expiré.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
class RequestProfileChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            confirmation_code = ''.join(random.choices(string.digits, k=6))
            
            request.session['pending_changes'] = {
                'changes': request.data,
                'code': confirmation_code,
                'expires': str(timezone.now() + timedelta(minutes=15))
            }
            context = {
                'user': request.user,
                'confirmation_code': confirmation_code,
                'expires_in': '15 minutes'
			}

            # Préparer le contenu HTML de l'email
            html_content = render_to_string('profile_change_email.html', context)
            
            try:
                send_mail(
                    subject='Confirmez vos changements de profil',
                    message=f'Votre code de confirmation est : {confirmation_code}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[request.user.email],
                    fail_silently=False,
                    html_message=html_content
                )
                
                return Response({
                    'message': 'Code de confirmation envoyé',
                    'email': request.user.email
                })
                
            except Exception as email_error:
                print(f"Erreur d'envoi d'email: {str(email_error)}")
                return Response(
                    {'error': "Impossible d'envoyer l'email de confirmation. Veuillez réessayer."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            print(f"Erreur lors du traitement de la demande: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ConfirmProfileChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("Session data:", request.session.get('pending_changes'))  # Debug log
        pending = request.session.get('pending_changes')
        
        if not pending:
            return Response(
                {'error': 'No pending changes found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        received_code = request.data.get('confirmation_code')
        stored_code = pending.get('code')
        
        print(f"Received code: {received_code}, Stored code: {stored_code}")  # Debug log
            
        if received_code != stored_code:
            return Response(
                {'error': 'Invalid confirmation code'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            expires = datetime.fromisoformat(pending['expires'])
            if timezone.now() > expires:
                del request.session['pending_changes']
                return Response(
                    {'error': 'Confirmation code expired'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Apply changes
            user = request.user
            changes = pending['changes']
            
            user.first_name = changes.get('first_name', user.first_name)
            user.last_name = changes.get('last_name', user.last_name)
            user.save()
            
            profile = user.userprofile
            if 'two_factor_enabled' in changes:
                profile.two_factor_enabled = changes['two_factor_enabled']
                profile.save()
                
            # Clear pending changes
            del request.session['pending_changes']
            request.session.modified = True  # Important !
            
            return Response({'message': 'Profile updated successfully'})
            
        except Exception as e:
            print(f"Error updating profile: {str(e)}")  # Debug log
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class RequestPasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Vérifier l'ancien mot de passe
            old_password = request.data.get('old_password')
            new_password = request.data.get('new_password')
            
            # Vérifier l'ancien mot de passe
            if not request.user.check_password(old_password):
                return Response({
                    'status': 'error',
                    'message': 'Current password is incorrect'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Générer le code de confirmation
            confirmation_code = ''.join(random.choices(string.digits, k=6))
            
            # Stocker dans la session
            request.session['pending_password_change'] = {
                'code': confirmation_code,
                'new_password': new_password,
                'expires': str(timezone.now() + timedelta(minutes=15))
            }
            
            # Utiliser le même template que pour les changements de profil
            html_content = render_to_string('profile_change_email.html', {
                'user': request.user,
                'confirmation_code': confirmation_code,
                'expires_in': '15 minutes'
            })
            
            send_mail(
                subject='Confirmation du changement de mot de passe',
                message=f'Votre code de confirmation est : {confirmation_code}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[request.user.email],
                fail_silently=False,
                html_message=html_content
            )
            
            return Response({
                'status': 'success',
                'message': 'Code de confirmation envoyé'
            })
            
        except Exception as e:
            print(f"Error requesting password change: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Une erreur est survenue'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ConfirmPasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            confirmation_code = request.data.get('confirmation_code')
            pending = request.session.get('pending_password_change')
            
            if not pending:
                return Response({
                    'status': 'error',
                    'message': 'Aucun changement de mot de passe en attente'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if pending.get('code') != confirmation_code:
                return Response({
                    'status': 'error',
                    'message': 'Code de confirmation invalide'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Vérifier l'expiration
            expires = datetime.strptime(pending['expires'], '%Y-%m-%d %H:%M:%S.%f%z')
            if timezone.now() > expires:
                del request.session['pending_password_change']
                return Response({
                    'status': 'error',
                    'message': 'Code de confirmation expiré'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Changer le mot de passe
            request.user.set_password(pending['new_password'])
            request.user.save()
            
            # Nettoyer la session
            del request.session['pending_password_change']
            request.session.modified = True
            
            return Response({
                'status': 'success',
                'message': 'Mot de passe changé avec succès'
            })
            
        except Exception as e:
            print(f"Error confirming password change: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Une erreur est survenue'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class DeleteAccountConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = DeleteAccountConfirmSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Vérifier le mot de passe
            password = serializer.validated_data['password']
            if not request.user.check_password(password):
                return Response({
                    'status': 'error',
                    'message': 'Mot de passe incorrect'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Supprimer le compte
            user = request.user
            user.delete()

            return Response({
                'status': 'success',
                'message': 'Compte supprimé avec succès'
            })

        except Exception as e:
            print(f"Error deleting account: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Une erreur est survenue lors de la suppression du compte'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyTwoFactorView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            temp_token = request.data.get('temp_token')
            code = request.data.get('code')

            if not temp_token or not code:
                return Response({
                    'status': 'error',
                    'message': 'Missing required fields'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                payload = jwt.decode(temp_token, settings.SECRET_KEY, algorithms=['HS256'])
                user = User.objects.get(id=payload['user_id'])
            except (jwt.InvalidTokenError, User.DoesNotExist):
                return Response({
                    'status': 'error',
                    'message': 'Invalid token'
                }, status=status.HTTP_400_BAD_REQUEST)

            two_factor = TwoFactorCode.objects.filter(
                user=user,
                code=code,
                is_used=False,
                expires_at__gt=timezone.now()
            ).first()

            if not two_factor:
                return Response({
                    'status': 'error',
                    'message': 'Invalid or expired code'
                }, status=status.HTTP_400_BAD_REQUEST)

            two_factor.is_used = True
            two_factor.save()

            refresh = RefreshToken.for_user(user)
            
            return Response({
                'status': 'success',
                'token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserProfileSerializer(user.userprofile).data
            })

        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SearchUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        if len(query) < 2:
            return Response([])

        users = UserProfile.objects.filter(
            Q(display_name__icontains=query) |
            Q(intra_id__icontains=query)
        ).distinct()[:10]

        serializer = UserProfileSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)
    

class UserProfileDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            profile = UserProfile.objects.get(id=user_id)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
class UserProfileByIntraIdView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, intra_id):
        try:
            profile = UserProfile.objects.get(intra_id=intra_id)
            if profile.user == request.user:
                profile.status = 'online'
                profile.save()
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
class UserStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.userprofile
            return Response({'status': profile.status})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        try:
            profile = request.user.userprofile
            new_status = request.data.get('status')
            
            if new_status in ['online', 'offline', 'in_game']:
                profile.status = new_status
                
                # Si le statut est passé à offline, on s'assure qu'il est traité immédiatement
                # en reculant la date de mise à jour
                if new_status == 'offline':
                    profile.updated_at = timezone.now() - timedelta(minutes=5)
                else:
                    profile.updated_at = timezone.now()
                    
                profile.save(update_fields=['status', 'updated_at'])
                return Response({'status': 'success'})
            
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def perform_create(self, serializer):
        notification = serializer.save(sender=self.request.user)
        
        # Envoyer la notification via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{notification.recipient.id}",
            {
                "type": "notification_message",
                "message": NotificationSerializer(notification).data
            }
        )

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(profile, context={'request': request})
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
            
            # Update user fields directly
            user = profile.user
            user.first_name = request.data.get('first_name', user.first_name)
            user.last_name = request.data.get('last_name', user.last_name)
            user.save()
            
            # Update profile fields
            if 'two_factor_enabled' in request.data:
                profile.two_factor_enabled = request.data['two_factor_enabled']
                profile.save()
            
            serializer = UserProfileSerializer(profile, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            print("Update error:", str(e))
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FriendRequestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            print("Données reçues pour la demande d'ami:", request.data)
            serializer = FriendRequestSerializer(data=request.data)
            if not serializer.is_valid():
                print("Erreurs de validation:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
            receiver_id = serializer.validated_data['receiver_id']
            
            # Vérifier si l'utilisateur essaie de s'ajouter lui-même
            if receiver_id == request.user.id:
                return Response(
                    {'error': 'Vous ne pouvez pas vous ajouter vous-même comme ami'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Vérifier si le destinataire existe
            try:
                receiver = User.objects.get(id=receiver_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'Utilisateur non trouvé'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Vérifier si une demande existe déjà
            existing_request = Friendship.objects.filter(
                (Q(sender=request.user) & Q(receiver=receiver)) | 
                (Q(sender=receiver) & Q(receiver=request.user))
            ).first()
            
            if existing_request:
                if existing_request.status == 'accepted':
                    return Response(
                        {'error': 'Vous êtes déjà amis avec cet utilisateur'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif existing_request.status == 'pending':
                    if existing_request.sender == request.user:
                        return Response(
                            {'error': 'Vous avez déjà envoyé une invitation à cet utilisateur'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    else:
                        # L'autre utilisateur nous a déjà envoyé une invitation, on l'accepte automatiquement
                        existing_request.status = 'accepted'
                        existing_request.updated_at = timezone.now()
                        existing_request.save()
                        
                        return Response({
                            'message': 'Invitation acceptée',
                            'friendship': FriendshipSerializer(existing_request).data
                        })
            
            # Créer une nouvelle demande d'ami
            friendship = Friendship.objects.create(
                sender=request.user,
                receiver=receiver,
                status='pending'
            )
            
            # Créer une notification pour le destinataire
            notification = Notification.objects.create(
                recipient=receiver,
                sender=request.user,
                notification_type='friend_request',
                content=f"{request.user.userprofile.display_name} vous a envoyé une invitation d'ami"
            )
            
            # Essayer d'envoyer la notification via WebSocket, mais gérer les erreurs
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"user_{receiver.id}",
                    {
                        "type": "notification_message",
                        "message": NotificationSerializer(notification).data
                    }
                )
            except Exception as ws_error:
                # Si Redis n'est pas configuré, on ignore simplement l'erreur
                print(f"WebSocket notification error (ignored): {str(ws_error)}")
            
            # Renvoyer une réponse réussie même si WebSocket échoue
            return Response(
                FriendshipSerializer(friendship).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            print(f"Error in friend request: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class FriendshipView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Récupérer toutes les amitiés (acceptées) de l'utilisateur
        friendships = Friendship.objects.filter(
            (Q(sender=request.user) | Q(receiver=request.user)) &
            Q(status='accepted')
        )
        
        serializer = FriendshipSerializer(friendships, many=True)
        return Response(serializer.data)
        
class FriendRequestActionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, friendship_id):
        try:
            action = request.data.get('action')
            if action not in ['accept', 'reject', 'cancel']:
                return Response(
                    {'error': 'Action invalide. Les actions possibles sont: accept, reject, cancel'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            try:
                friendship = Friendship.objects.get(id=friendship_id)
            except Friendship.DoesNotExist:
                return Response(
                    {'error': 'Invitation non trouvée'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Vérifier les permissions
            if action == 'accept' or action == 'reject':
                # Seul le destinataire peut accepter ou rejeter
                if friendship.receiver != request.user:
                    return Response(
                        {'error': 'Vous n\'êtes pas autorisé à effectuer cette action'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                    
                if friendship.status != 'pending':
                    return Response(
                        {'error': 'Cette invitation n\'est plus en attente'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
                friendship.status = 'accepted' if action == 'accept' else 'rejected'
                friendship.save()
                
                if action == 'accept':
                    # Créer une notification pour l'expéditeur
                    notification = Notification.objects.create(
                        recipient=friendship.sender,
                        sender=request.user,
                        notification_type='friend_accepted',
                        content=f"{request.user.userprofile.display_name} a accepté votre invitation d'ami"
                    )
                    
                    # Envoyer la notification via WebSocket
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f"user_{friendship.sender.id}",
                        {
                            "type": "notification_message",
                            "message": NotificationSerializer(notification).data
                        }
                    )
                
            elif action == 'cancel':
                # Seul l'expéditeur peut annuler
                if friendship.sender != request.user:
                    return Response(
                        {'error': 'Vous n\'êtes pas autorisé à effectuer cette action'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                    
                if friendship.status != 'pending':
                    return Response(
                        {'error': 'Cette invitation n\'est plus en attente'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
                friendship.delete()
                return Response({'message': 'Invitation annulée'})
                
            return Response(FriendshipSerializer(friendship).data)
            
        except Exception as e:
            print(f"Error in friendship action: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class PendingFriendRequestsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Récupérer toutes les demandes d'amitié en attente reçues par l'utilisateur
        pending_requests = Friendship.objects.filter(
            receiver=request.user,
            status='pending'
        )
        
        serializer = FriendshipSerializer(pending_requests, many=True)
        return Response(serializer.data)
        
class SentFriendRequestsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Récupérer toutes les demandes d'amitié envoyées par l'utilisateur
        sent_requests = Friendship.objects.filter(
            sender=request.user,
            status='pending'
        )
        
        serializer = FriendshipSerializer(sent_requests, many=True)
        return Response(serializer.data)
    
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Notification
from .serializers import NotificationSerializer
from django.db.models import Q

class MarkNotificationAsReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, notification_id=None):
        """
        Mark a single notification or multiple notifications as read
        
        Request body can include:
        - Single notification ID
        - List of notification IDs
        - Optional: mark_all (boolean to mark all notifications as read)
        """
        try:
            # Check if marking a single notification
            if notification_id:
                try:
                    notification = Notification.objects.get(
                        id=notification_id, 
                        recipient=request.user
                    )
                    notification.is_read = True
                    notification.save()
                    return Response({
                        'status': 'success',
                        'message': 'Notification marked as read',
                        'notification': NotificationSerializer(notification).data
                    })
                except Notification.DoesNotExist:
                    return Response({
                        'status': 'error',
                        'message': 'Notification not found or not authorized'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # Check for bulk marking or mark all
            mark_all = request.data.get('mark_all', False)
            notification_ids = request.data.get('notification_ids', [])
            
            # Mark all unread notifications
            if mark_all:
                unread_notifications = Notification.objects.filter(
                    recipient=request.user, 
                    is_read=False
                )
                count = unread_notifications.count()
                unread_notifications.update(is_read=True)
                
                return Response({
                    'status': 'success',
                    'message': f'Marked {count} notifications as read',
                    'count': count
                })
            
            # Mark specific notifications
            if notification_ids:
                # Validate and mark only notifications belonging to the user
                notifications = Notification.objects.filter(
                    Q(id__in=notification_ids) & 
                    Q(recipient=request.user) & 
                    Q(is_read=False)
                )
                
                count = notifications.count()
                notifications.update(is_read=True)
                
                return Response({
                    'status': 'success',
                    'message': f'Marked {count} notifications as read',
                    'count': count,
                    'marked_ids': list(notifications.values_list('id', flat=True))
                })
            
            # If no specific action specified
            return Response({
                'status': 'error',
                'message': 'No action specified. Provide notification_id, notification_ids, or mark_all'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            print(f"Error marking notifications as read: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'An unexpected error occurred'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RemoveFriendView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, friendship_id=None, user_id=None):
        try:
            # Si un friendship_id est fourni
            if friendship_id:
                try:
                    friendship = Friendship.objects.get(
                        Q(sender=request.user) | Q(receiver=request.user),
                        id=friendship_id,
                        status='accepted'
                    )
                    friendship.delete()
                    return Response({'message': 'Ami retiré avec succès'})
                except Friendship.DoesNotExist:
                    return Response({'error': 'Relation d\'amitié non trouvée'}, status=404)
            
            # Si un user_id est fourni à la place
            elif user_id:
                friendship = Friendship.objects.filter(
                    status='accepted'
                ).filter(
                    (Q(sender=request.user) & Q(receiver_id=user_id)) | 
                    (Q(receiver=request.user) & Q(sender_id=user_id))
                ).first()
                
                if friendship:
                    friendship.delete()
                    return Response({'message': 'Ami retiré avec succès'})
                else:
                    return Response({'error': 'Relation d\'amitié non trouvée'}, status=404)
            else:
                return Response({'error': 'ID d\'amitié ou d\'utilisateur requis'}, status=400)
                
        except Exception as e:
            print(f"Error removing friend: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)

# Dans views.py
# class UserHeartbeatView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def post(self, request):
#         try:
#             # Mettre à jour la session active
#             session_key = request.session.session_key or request.session.create()
            
#             # Assurez-vous que le modèle ActiveSession est bien importé
#             # et créé dans votre base de données
#             ActiveSession.objects.update_or_create(
#                 user=request.user,
#                 defaults={'session_key': session_key, 'last_activity': timezone.now()}
#             )
            
#             # Mettre à jour le statut
#             UserProfile.objects.filter(user=request.user).update(
#                 status='online',
#                 updated_at=timezone.now()
#             )
            
#             return Response({'status': 'success'})
#         except Exception as e:
#             print(f"Heartbeat error: {str(e)}")
#             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserIPView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Récupérer l'adresse IP
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            
            return Response({
                'status': 'success',
                'ip_address': ip
            })
        except Exception as e:
            print(f"Error retrieving user IP: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class GameInviteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        receiver_id = request.data.get('receiver_id')
        if not receiver_id:
            return Response({'error': 'receiver_id is required'}, status=400)

        try:
            receiver = User.objects.get(id=receiver_id)
            
        except User.DoesNotExist:
            return Response({'error': 'Receiver not found'}, status=404)

        # This part should be outside the `except` block
        notification = Notification.objects.create(
            recipient=receiver,
            sender=request.user,
            notification_type='game_invite',
            content=f"{request.user.userprofile.display_name} t'invite à jouer au Ping Pong !"
        )
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{receiver.id}",
                {
                    "type": "notification_message",
                    "message": NotificationSerializer(notification).data
                }
            )
        except Exception as e:
            print(f"WebSocket error: {e}")

        return Response({'message': 'Game invite sent successfully'}, status=200)
class GameInviteResponseView(APIView):
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request, invite_id):
        try:
            # Get notification and game invite
            notification = Notification.objects.select_for_update().get(
                id=invite_id,
                recipient=request.user,
                notification_type='game_invite'
            )
            invite = GameInvite.objects.select_for_update().get(
                sender=notification.sender,
                receiver=request.user,
                status='pending'
            )

            action = request.data.get('action')
            if action not in ['accept', 'reject']:
                return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

            response_data = {'status': action}
            channel_layer = get_channel_layer()

            if action == 'accept':
                # Create game room with atomic transaction
                game_room = GameRoom.objects.create(
                    player1=invite.sender,
                    player2=request.user,
                    status='active'
                )
                
                # Update invite and link to game room
                invite.status = 'accepted'
                invite.game_room = game_room
                invite.save()
                
                # Create sender notification with game room ID
                Notification.objects.create(
                    recipient=invite.sender,
                    sender=request.user,
                    notification_type='game_ready',
                    content=f"Game with {request.user.username} is ready!",
                    redirect_url=f"/game/{game_room.id}/"
                )

                # WebSocket update for sender
                async_to_sync(channel_layer.group_send)(
                    f"user_{invite.sender.id}",
                    {
                        "type": "notification.message",
                        "message": {
                            'type': 'game_ready',
                            'room_id': str(game_room.id),
                            'redirect_url': f"/game/{game_room.id}/"
                        }
                    }
                )

            else:
                invite.status = 'rejected'
                invite.save()

                # Create rejection notification for sender
                Notification.objects.create(
                    recipient=invite.sender,
                    sender=request.user,
                    notification_type='invite_rejected',
                    content=f"{request.user.username} rejected your game invite",
                    is_read=False
                )

                # WebSocket message
                async_to_sync(channel_layer.group_send)(
                    f"user_{invite.sender.id}",
                    {
                        "type": "notification.message",
                        "message": {
                            'type': 'game_notification',
                            'action': 'invite_rejected',
                            'message': f"{request.user.username} rejected your game invite"
                        }
                    }
                )

            # Mark original notification as read
            notification.is_read = True
            notification.save()

            return Response(response_data)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class CreateGameInviteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        receiver_id = request.data.get('receiver_id')
        if not receiver_id:
            return Response(
                {'error': 'Receiver ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Receiver not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check for existing pending invite
        existing_invite = GameInvite.objects.filter(
            sender=request.user,
            receiver=receiver,
            status='pending'
        ).first()
        
        if existing_invite:
            return Response(
                {'error': 'You already have a pending invite to this user'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Create the game invite
        game_invite = GameInvite.objects.create(
            sender=request.user,
            receiver=receiver,
            status='pending'
        )
        
        # Create the notification
        notification = Notification.objects.create(
            recipient=receiver,
            sender=request.user,
            notification_type='game_invite',
            content=f"{request.user.userprofile.display_name} invited you to play a game",
            is_read=False
        )
        
        # Send WebSocket notification
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{receiver.id}",
                {
                    "type": "notification_message",
                    "message": NotificationSerializer(notification).data
                }
            )
        except Exception as e:
            print(f"WebSocket error (ignored): {str(e)}")
        
        return Response(
            {
                'game_invite': GameInviteSerializer(game_invite).data,
                'notification': NotificationSerializer(notification).data
            },
            status=status.HTTP_201_CREATED
        )