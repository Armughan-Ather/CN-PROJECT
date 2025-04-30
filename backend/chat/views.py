from rest_framework.decorators import api_view, permission_classes,parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import models
from .models import Message
from django.contrib.auth import get_user_model
from api.models import User  # Import User Model
from rest_framework.parsers import MultiPartParser
import cloudinary.uploader
from .models import VoiceMessage  # import at the top
from django.db.models import Q, Max

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
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_contacts(request):
    user = request.user

    text_partners = Message.objects.filter(
        Q(sender=user) | Q(receiver=user)
    ).values('sender', 'receiver', 'timestamp')

    all_partners = set()
    for entry in text_partners:
        if entry['sender'] != user.id:
            all_partners.add(entry['sender'])
        if entry['receiver'] != user.id:
            all_partners.add(entry['receiver'])

    contact_data = []
    for partner_id in all_partners:
        partner = User.objects.get(id=partner_id)
        last_msg = Message.objects.filter(
            Q(sender=user, receiver=partner) | Q(sender=partner, receiver=user)
        ).order_by('-timestamp').first()

        contact_data.append({
            "username": partner.username,
            "lastMessage": last_msg.content if last_msg else "",
            "timestamp": last_msg.timestamp if last_msg else None,
        })

    contact_data.sort(key=lambda x: x['timestamp'], reverse=True)
    return Response(contact_data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    query = request.GET.get('q', '')
    if not query:
        return Response([])

    users = User.objects.filter(username__icontains=query).exclude(username=request.user.username)
    return Response([{"username": user.username} for user in users])


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
        audio_url=voice_url
    )

    return Response({
        "message": "Voice message uploaded successfully",
        "voice_url": voice_url
    }, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_voice_history(request, receiver_username):
    sender = request.user
    try:
        receiver = User.objects.get(username=receiver_username)
    except User.DoesNotExist:
        return Response({"error": "Receiver not found"}, status=404)

    messages = VoiceMessage.objects.filter(
        sender__in=[sender, receiver],
        receiver__in=[sender, receiver]
    ).order_by("timestamp")

    data = [
        {"sender": msg.sender.username, "receiver": msg.receiver.username, "audio_url": msg.audio_url, "timestamp": msg.timestamp}
        for msg in messages
    ]
    return Response(data)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_combined_chat_history(request, receiver_username):
    sender = request.user

    try:
        receiver = User.objects.get(username=receiver_username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # Get text messages
    text_msgs = Message.objects.filter(
        sender__in=[sender, receiver], receiver__in=[sender, receiver]
    ).values('sender__username', 'receiver__username', 'content', 'timestamp').annotate(is_voice=models.Value(False, output_field=models.BooleanField()))

    # Get voice messages
    voice_msgs = VoiceMessage.objects.filter(
        sender__in=[sender, receiver], receiver__in=[sender, receiver]
    ).values('sender__username', 'receiver__username', 'audio_url', 'timestamp').annotate(
        content=models.F('audio_url'),
        is_voice=models.Value(True, output_field=models.BooleanField())
    )

    # Combine and sort by timestamp
    combined = list(text_msgs) + list(voice_msgs)
    combined_sorted = sorted(combined, key=lambda x: x['timestamp'])

    return Response(combined_sorted)