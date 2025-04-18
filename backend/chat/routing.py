
from django.urls import path
from . import consumers
from django.urls import re_path

    


websocket_urlpatterns = [
    path("ws/chat/<str:username>/", consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/call/(?P<username>\w+)/$', consumers.CallSignalingConsumer.as_asgi()),]
