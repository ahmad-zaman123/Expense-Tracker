from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.permissions import AllowAny

from apps.users.serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)


class MeAPIView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self, *args, **kwargs):
        return self.request.user
