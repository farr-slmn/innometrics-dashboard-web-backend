from django.contrib.auth import get_user_model
from rest_framework import serializers

from activities.models import Activity, Entity
from measurements.models import Measurement
from measurements.serializers import MeasurementSaveSerializer


class UserSerializer(serializers.HyperlinkedModelSerializer):
    activities = serializers.PrimaryKeyRelatedField(
        read_only=True,
        many=True
    )
    password = serializers.CharField(write_only=True)

    class Meta:
        model = get_user_model()
        fields = ('id', 'username', 'password', 'email', 'activities')

    def create(self, validated_data):
        user = get_user_model().objects.create(
            username=validated_data['username'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class ActivitySerializer(serializers.ModelSerializer):
    measurements = MeasurementSaveSerializer(many=True)

    class Meta:
        model = Activity
        fields = ('id', 'comments', 'measurements', 'participation', 'entity')

    def create(self, validated_data):
        measurements_data = validated_data.pop('measurements')
        activity = Activity.objects.create(**validated_data)
        for measurement_data in measurements_data:
            Measurement.objects.create(activity=activity, **measurement_data)
        return activity


class EntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = ('id', 'name', 'group')

    def create(self, validated_data):
        activity = Activity.objects.create(**validated_data)
        return activity
