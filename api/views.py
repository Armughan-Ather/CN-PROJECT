from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password
from api.models import User  # Import User Model

User = get_user_model()

# 🔹 User Registration API (Signup)
@api_view(['POST'])
def register_user(request):
    data = request.data
    if User.objects.filter(username=data['username']).exists():
        return Response({"error": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=data['email']).exists():
        return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create(
        username=data['username'],
        email=data['email'],
        password=make_password(data['password'])  # Hash Password
    )

    return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def login_user(request):
    data=request.data
    try:
        user=User.objects.get(username=data['username'])
    except User.DoesNotExist:
        return Response({"error" : "Invalid Username"},status=status.HTTP_400_BAD_REQUEST)
    if not user.check_password(data['password']):
        return Response({"error":"Incorrect Password"},status=status.HTTP_400_BAD_REQUEST)
    
    refresh=RefreshToken.for_user(user)
    return Response({
        "refresh":str(refresh),
        "access":str(refresh.access_token),
        "username":user.username
    })
'''
@api_view(['POST'])
def login_user(request):
    data = request.data
    try:
        user = User.objects.get(username=data['username'])
    except User.DoesNotExist:
        return Response({"error": "Invalid Username"}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(data['password']):
        return Response({"error": "Invalid Password"}, status=status.HTTP_400_BAD_REQUEST)

    # Generate JWT Tokens
    refresh = RefreshToken.for_user(user)
    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "username": user.username
    })
'''

# 🔹 Logout API (Blacklist Token)
@api_view(['POST'])
def logout_user(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()  # Blacklist Token
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
