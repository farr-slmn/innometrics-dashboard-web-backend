from rest_framework import serializers

from measurements.models import Measurement


class MeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = ('id', 'name', 'value', 'type', 'activity')


class MeasurementSaveSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        fields = ('name', 'value', 'type')
        model = Measurement


class JoinedMeasurementSerializer(serializers.ModelSerializer):
    entity = serializers.StringRelatedField(source="activity.entity.name")
    group = serializers.StringRelatedField(source="activity.entity.group")

    class Meta:
        model = Measurement
        fields = ('id', 'name', 'value', 'type', 'activity_id', 'entity', 'group')