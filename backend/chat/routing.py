# from django.urls import re_path
# from . import consumers

# websocket_urlpatterns = [
#     re_path(r'ws/chat/(?P<username>\w+)/$', consumers.ChatConsumer.as_asgi()),
#     re_path(r'ws/call/(?P<username>\w+)/$', consumers.CallSignalingConsumer.as_asgi()),
# ]


# routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<username>\w+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/call/', consumers.CallConsumer.as_asgi()),
    # Ensure the path matches the consumer's expectation
    #re_path(r'ws/call/(?P<username>\w+)/$', consumers.CallSignalingConsumer.as_asgi()),
    
]