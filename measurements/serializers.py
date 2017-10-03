from measurements.models import Measurement

from rest_framework import serializers


class MeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = ('id', 'name', 'value', 'type', 'activity')


class MeasurementSaveSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        fields = ('name', 'value', 'type')
        model = Measurement
