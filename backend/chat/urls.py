from django.urls import path
from .views import get_chat_history
from .views import upload_voice_message
urlpatterns = [
    path('chat-history/<str:receiver_username>/', get_chat_history, name='chat_history'),
    path('upload-voice/', upload_voice_message, name='upload_voice'),


]

