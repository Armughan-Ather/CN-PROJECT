"""
ASGI config for ChatBridge project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""


import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
import chat.routing  # Import WebSocket routes

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChatBridge.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # Handles HTTP requests
    "websocket": URLRouter(chat.routing.websocket_urlpatterns),  # WebSocket routes
})
