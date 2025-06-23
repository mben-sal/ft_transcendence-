from django.utils import timezone
from datetime import timedelta
from .models import UserProfile

class UserStatusMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            # Mettre à jour les statuts inactifs
            UserProfile.objects.filter(
                status='online',
                updated_at__lt=timezone.now() - timedelta(seconds=10)
            ).update(status='offline')

            response = self.get_response(request)

            # Si l'utilisateur est authentifié, mettre à jour son statut
            if hasattr(request, 'user') and request.user.is_authenticated:
                UserProfile.objects.filter(user=request.user).update(
                    status='online',
                    updated_at=timezone.now()
                )

            return response
        except Exception as e:
            print(f"Status middleware error: {str(e)}")
            return self.get_response(request)