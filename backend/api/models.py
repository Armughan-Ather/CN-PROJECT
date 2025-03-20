from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):  
    email = models.EmailField(unique=True)  
    created_at = models.DateTimeField(auto_now_add=True)

    groups = models.ManyToManyField(
        "auth.Group", related_name="api_users"
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission", related_name="api_users_permissions"
    )

    def __str__(self):
        return self.username

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} -> {self.receiver}: {self.content[:30]}"
