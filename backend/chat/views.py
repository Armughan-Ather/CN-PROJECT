from rest_framework.decorators import api_view, permission_classes,parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Message
from django.contrib.auth import get_user_model
from api.models import User  # Import User Model
from rest_framework.parsers import MultiPartParser
import cloudinary.uploader
from .models import VoiceMessage  # import at the top

from cloudinary.uploader import upload

User = get_user_model()


@permission_classes([IsAuthenticated])
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Optional during testing
def upload_voice_message(request):
    audio = request.FILES.get('audio')
    receiver_username = request.data.get('receiver')

    if not audio or not receiver_username:
        return Response({"error": "Missing audio file or receiver"}, status=400)

    try:
        receiver = User.objects.get(username=receiver_username)
    except User.DoesNotExist:
        return Response({"error": "Receiver not found"}, status=404)

    result = cloudinary.uploader.upload(
        audio,
        resource_type="auto",
        folder="voice_messages/"  # Optional: organize uploads in a folder
    )

    voice_url = result.get("secure_url")
    # After successful upload
    VoiceMessage.objects.create(
        sender=request.user,
        receiver=receiver,
        voice_url=voice_url
    )

    return Response({
        "message": "Voice message uploaded successfully",
        "voice_url": voice_url
    }, status=201)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_voice_messages(request, username):
    sender = request.user
    try:
        receiver = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    messages = VoiceMessage.objects.filter(
        sender__in=[sender, receiver],
        receiver__in=[sender, receiver]
    ).order_by("timestamp")

    result = [
        {
            "sender": msg.sender.username,
            "receiver": msg.receiver.username,
            "voice_url": msg.voice_url,
            "timestamp": msg.timestamp
        }
        for msg in messages
    ]
    return Response(result)
