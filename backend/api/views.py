from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password
from api.models import User  # Import User Model

User = get_user_model()

@api_view(['POST'])
def register_user(request):
    data = request.data

    if not data.get("username") or not data.get("email") or not data.get("password"):
        return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=data['username']).exists():
        return Response({"error": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=data['email']).exists():
        return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

    if len(data["password"]) < 6:
        return Response({"error": "Password must be at least 6 characters"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create(
        username=data['username'],
        email=data['email'],
        password=make_password(data['password'])  # Hash Password for security
    )

    return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def login_user(request):
    data=request.data
    if not data.get("username") or not data.get("password"):
        return Response({"error":"Both username and password are required"},status=status.HTTP_400_BAD_REQUEST)
    try:
        user=User.objects.get(username=data['username'])
    except User.DoesNotExist:
        return Response({"error" : "Invalid Username"},status=status.HTTP_401_UNAUTHORIZED)
    if not user.check_password(data['password']):
        return Response({"error":"Incorrect Password"},status=status.HTTP_401_UNAUTHORIZED)
     
    refresh=RefreshToken.for_user(user)
    return Response({
        "refresh":str(refresh),
        "access":str(refresh.access_token),
        "username":user.username
    })

# 🔹 Logout API (Blacklist Token)
@api_view(['POST'])
#@permission_classes([IsAuthenticated])
def logout_user(request):
    try:
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "Refresh Token is required"}, status=status.HTTP_400_BAD_REQUEST)

        #print("Received Refresh Token:", refresh_token)  # Debugging line

        token = RefreshToken(refresh_token)
        #print("Decoded Token:", token.payload)  # Debugging line

        token.blacklist()  # Blacklist Token
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": "Invalid token", "details": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def test():
    return Response({"message": "test"})