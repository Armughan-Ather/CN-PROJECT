from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Message
from django.contrib.auth import get_user_model
from api.models import User  # Import User Model

User = get_user_model()

#@permission_classes([IsAuthenticated])

@api_view(['GET'])
def get_chat_history(request, receiver_username):
    sender = request.user
    try:
        receiver = User.objects.get(username=receiver_username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    messages = Message.objects.filter(
        sender__in=[sender, receiver], receiver__in=[sender, receiver]
    ).order_by("timestamp")

    chat_history = [
        {"sender": msg.sender.username, "receiver": msg.receiver.username, "message": msg.content, "timestamp": msg.timestamp}
        for msg in messages
    ]

    return Response(chat_history)

def chat_history(request, username):
    return JsonResponse({"message": f"Chat history for {username}"})