from django.http import JsonResponse
from measurements.models import Measurement
from measurements.serializers import MeasurementSerializer, JoinedMeasurementSerializer

from rest_framework.views import APIView


def filter_measurements(request, serializer_class, personal=True):
    measurements = Measurement.objects.all()

    if personal:
        measurements = Measurement.objects.filter(activity__participation__user=request.user.id)

    project = request.GET.get('project', None)
    if (project is not None) and (int(project) >= 0):
        measurements = measurements.filter(activity__participation__project_id=project)

    user = request.GET.get('user', None)
    if (user is not None) and (int(user) >= 0):
        measurements = measurements.filter(activity__participation__user_id=user)

    group = request.GET.get('group', None)
    if (group is not None) and (int(group) >= 0):
        measurements = measurements.filter(activity__entity__group_id=group)

    serializer = serializer_class(measurements, many=True)
    resp = {'measurements': serializer.data}
    return JsonResponse(resp)


class MeasurementsList(APIView):
    """
    List filtered measurements
    """

    def get(self, request, format=None):
        return filter_measurements(request, MeasurementSerializer)


class JoinedMeasurementsList(APIView):
    def get(self, request, format=None):
        return filter_measurements(request, JoinedMeasurementSerializer, personal=True)
