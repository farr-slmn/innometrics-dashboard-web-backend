from rest_framework import serializers

from projects.models import Project, UserParticipation


class ProjectMembersSerializer(serializers.ModelSerializer):
    id = serializers.StringRelatedField(source="user.id")
    username = serializers.StringRelatedField(source="user.username")
    email = serializers.StringRelatedField(source="user.email")

    class Meta:
        model = UserParticipation
        # field are from 'User' object, not from 'UserParticipation' !
        fields = ('id', 'username', 'email')


class ProjectSerializer(serializers.ModelSerializer):
    participants = ProjectMembersSerializer(source='participations', many=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'participants')
