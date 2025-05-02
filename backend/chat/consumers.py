
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.username = self.scope['url_route']['kwargs']['username']  # Assuming URL is ws/chat/<username>/
        self.room_name = f"chat_{self.username}"
        self.room_group_name = f"group_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"Connected to {self.room_group_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        sender_username = data['sender']
        receiver_username = data['receiver']
        message = data['message']

        # Save message to DB
        await self.save_message(sender_username, receiver_username, message)

        # Send message to both sender and receiver groups
        for user in [sender_username, receiver_username]:
            await self.channel_layer.group_send(
                f"group_chat_{user}",
                {
                    'type': 'chat_message',
                    'sender': sender_username,
                    'receiver': receiver_username,
                    'message': message,
                }
            )
    
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'sender': event['sender'],
            'receiver': event['receiver'],
            'message': event['message'],
        }))


    @database_sync_to_async
    def save_message(self, sender_username, receiver_username, content):
        sender = User.objects.get(username=sender_username)
        receiver = User.objects.get(username=receiver_username)
        Message.objects.create(sender=sender, receiver=receiver, content=content)


# class CallSignalingConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.user = self.scope['url_route']['kwargs']['username']
#         self.room_group_name = f"call_{self.user}"

#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()

#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

#     async def receive(self, text_data):
#         data = json.loads(text_data)
#         receiver = data.get("receiver")
#         payload = data.get("payload")

#         await self.channel_layer.group_send(
#             f"call_{receiver}",
#             {
#                 "type": "send_signal",
#                 "sender": self.user,
#                 "payload": payload
#             }
#         )

#     async def send_signal(self, event):
#         await self.send(text_data=json.dumps({
#             "sender": event["sender"],
#             "payload": event["payload"]
#         }))



# class CallSignalingConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         # Use self.scope['user'] if authentication is set up, otherwise use URL kwarg
#         # For simplicity using URL kwarg as per your original code
#         self.user = self.scope['url_route']['kwargs']['username']
#         # Use a consistent naming convention, perhaps underscores
#         self.room_group_name = f"call_{self.user}" # Use underscore for potential clarity
#         print(f"CallSignalingConsumer: User {self.user} connecting to group {self.room_group_name}")

#         await self.channel_layer.group_add(
#             self.room_group_name,
#             self.channel_name
#         )
#         await self.accept()
#         print(f"CallSignalingConsumer: User {self.user} connected and added to {self.room_group_name}")

#     async def disconnect(self, close_code):
#         print(f"CallSignalingConsumer: User {self.user} disconnecting from {self.room_group_name}")
#         await self.channel_layer.group_discard(
#             self.room_group_name,
#             self.channel_name
#         )
#         # Optional: Send a hangup signal if disconnect wasn't initiated by user action
#         # This requires knowing the peer, which isn't stored here currently.
#         # Consider adding logic to notify peers if needed.

#     async def receive(self, text_data):
#         try:
#             data = json.loads(text_data)
#             receiver_username = data.get("receiver")
#             signal_type = data.get("type") # e.g., 'offer', 'answer', 'candidate', 'hangup'
#             payload = data.get("payload") # The actual SDP or candidate data

#             if not receiver_username or not signal_type:
#                 print(f"CallSignalingConsumer: Received invalid data from {self.user}: Missing receiver or type. Data: {text_data}")
#                 return
            

#             target_group = f"call_{receiver_username}"
#             print(f"CallSignalingConsumer: Relaying signal '{signal_type}' from {self.user} to {target_group}")

#             # Send message to the receiver's group
#             await self.channel_layer.group_send(
#                 target_group,
#                 {
#                     "type": "send_signal", # This triggers the send_signal method below
#                     "sender": self.user,
#                     "signal_type": signal_type, # Pass the specific type
#                     "payload": payload
#                 }
#             )
#         except json.JSONDecodeError:
#              print(f"CallSignalingConsumer: Received invalid JSON from {self.user}: {text_data}")
#         except Exception as e:
#              print(f"CallSignalingConsumer: Error processing received data from {self.user}: {e}")


#     # This method is called by the group_send operation
#     async def send_signal(self, event):
#         print(f"CallSignalingConsumer: Sending signal type '{event['signal_type']}' to {self.user} from {event['sender']}")
#         # Send message to the WebSocket client connected to this consumer instance
#         await self.send(text_data=json.dumps({
#             "sender": event["sender"],
#             "type": event["signal_type"], # Use the specific type from the event
#             "payload": event["payload"]
#         }))

from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import json

def sanitize_group_name(name):
    return "".join(c for c in name if c.isalnum() or c in "-_.")

class CallConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

        # response to client, that we are connected.
        self.send(text_data=json.dumps({
            'type': 'connection',
            'data': {
                'message': "Connected"
            }
        }))

    def disconnect(self, close_code):
        if hasattr(self, 'my_name'):
            # Leave room group
            async_to_sync(self.channel_layer.group_discard)(
                self.my_name,
                self.channel_name
            )

    # Receive message from client WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)

        eventType = text_data_json['type']

        if eventType == 'login':
            print("login")
            name = text_data_json['data']['name']

            # Validate and sanitize the name
            self.my_name = sanitize_group_name(name)

            # Join room
            async_to_sync(self.channel_layer.group_add)(
                self.my_name,
                self.channel_name
            )

        if eventType == 'call':
            name = text_data_json['data']['name']
            print(self.my_name, "is calling", name)

            rtcMessage = text_data_json['data'].get('rtcMessage', None)
            if not rtcMessage:
                self.send(text_data=json.dumps({
                    'type': 'error',
                    'data': {'message': 'Missing rtcMessage in the event.'}
                }))
                return

            # to notify the callee we sent an event to the group name
            async_to_sync(self.channel_layer.group_send)(
                name,
                {
                    'type': 'call_received',
                    'data': {
                        'caller': self.my_name,
                        'rtcMessage': rtcMessage
                    }
                }
            )

        if eventType == 'answer_call':
            caller = text_data_json['data']['caller']
            rtcMessage = text_data_json['data'].get('rtcMessage', None)
            if not rtcMessage:
                self.send(text_data=json.dumps({
                    'type': 'error',
                    'data': {'message': 'Missing rtcMessage in the event.'}
                }))
                return

            async_to_sync(self.channel_layer.group_send)(
                caller,
                {
                    'type': 'call_answered',
                    'data': {
                        'rtcMessage': rtcMessage
                    }
                }
            )

        if eventType == 'ICEcandidate':
            user = text_data_json['data']['user']
            rtcMessage = text_data_json['data'].get('rtcMessage', None)
            if not rtcMessage:
                self.send(text_data=json.dumps({
                    'type': 'error',
                    'data': {'message': 'Missing ICE candidate in the event.'}
                }))
                return

            async_to_sync(self.channel_layer.group_send)(
                user,
                {
                    'type': 'ICEcandidate',
                    'data': {
                        'rtcMessage': rtcMessage
                    }
                }
            )

    def call_received(self, event):
        print('Call received by ', self.my_name)
        self.send(text_data=json.dumps({
            'type': 'call_received',
            'data': event['data']
        }))

    def call_answered(self, event):
        print(self.my_name, "'s call answered")
        self.send(text_data=json.dumps({
            'type': 'call_answered',
            'data': event['data']
        }))

    def ICEcandidate(self, event):
        self.send(text_data=json.dumps({
            'type': 'ICEcandidate',
            'data': event['data']
        }))
