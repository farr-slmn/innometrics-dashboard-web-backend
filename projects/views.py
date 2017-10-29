from django.contrib.auth.models import User
from django.shortcuts import render
from rest_framework import generics, permissions

from projects.models import Project
from projects.serializers import ProjectSerializer


class ProjectList(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
