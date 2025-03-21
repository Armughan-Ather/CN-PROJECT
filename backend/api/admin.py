from django.contrib import admin
from .models import User,customUser
# Register your models here.

admin.site.register(User)
admin.site.register(customUser)
#admin.site.register(Message)