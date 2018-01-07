from rest_framework import serializers

from projects.models import Project, UserParticipation, Metric


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


class MetricSerializer(serializers.ModelSerializer):
    name = serializers.CharField(allow_blank=False, max_length=255, required=True)
    info = serializers.JSONField(required=True)

    class Meta:
        model = Metric
        fields = ('id', 'name', 'type', 'info', 'participation')

    def create(self, validated_data):
        metric = Metric.objects.create(**validated_data)
        return metric

    def validate(self, data):
        validated_data = super().validate(data)
        type = validated_data.get("type")
        info = validated_data.get("info")

        if type == "R":
            if not info['field']:
                raise serializers.ValidationError({"info": {"field": ["This field may not be blank."]}})
            if info['filters'] is not None:
                for key in info['filters']:
                    if not info['filters'][key]:
                        raise serializers.ValidationError({"info": {"filters": ["Filter value may not be blank."]}})
        else:
            components = info['components']
            if not components:
                raise serializers.ValidationError({"info": {"components": ["This field may not be blank."]}})
            available = set(
                Metric.objects.filter(id__in=components, participation=validated_data.get("participation"))
                    .values_list('id', flat=True)
            )
            if (not components) or (len(components) != 2) or (not set(components).issubset(available)):
                raise serializers.ValidationError({"info": {"components": ["inaccessible components"]}})

        return validated_data
