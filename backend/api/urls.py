from django.urls import path
from api.views import register_user, login_user, logout_user
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', register_user, name='register'),  # Signup
    path('login/', login_user, name='login'),  # Login
    path('logout/', logout_user, name='logout'),  # Logout
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Refresh Token
]
