from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'intra_id', 'wins', 'losses')
    search_fields = ('display_name', 'intra_id')