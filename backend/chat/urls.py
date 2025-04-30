from django.urls import path
from .views import get_chat_history, upload_voice_message, get_voice_history, recent_contacts, search_users
from .views import get_combined_chat_history


urlpatterns = [
    path('chat-history/<str:receiver_username>/', get_chat_history, name='chat_history'),
    path('recent-contacts/', recent_contacts, name='recent_contacts'),
    path('search-users/', search_users, name='search_users'),
    
    path('upload-voice/', upload_voice_message, name='upload_voice_message'),
    path('voice-messages/<str:receiver_username>/', get_voice_history, name='voice_messages'),
    #path('chat-history/<str:receiver_username>/', get_combined_chat_history, name='chat_history'),

]
