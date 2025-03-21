from django.urls import path
from .views import chat_history

urlpatterns = [
    path('chat-history/<str:username>/', chat_history, name='chat_history'),
]
