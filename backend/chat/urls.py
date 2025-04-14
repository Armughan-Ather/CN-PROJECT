from django.urls import path
from .views import get_chat_history

urlpatterns = [
    path('chat-history/<str:receiver_username>/', get_chat_history, name='chat_history'),
]

