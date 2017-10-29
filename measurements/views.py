from django.http import JsonResponse
from measurements.models import Measurement
from measurements.serializers import MeasurementSerializer

from rest_framework.views import APIView


class MeasurementsList(APIView):
    """
    List all measurements
    """

    def get(self, request, format=None):
        measurements = Measurement.objects.all()

        project = request.GET.get('project', None)
        if (project is not None) and (int(project) >= 0):
            measurements = measurements.filter(activity__participation__project_id=project)

        user = request.GET.get('user', None)
        if (user is not None) and (int(user) >= 0):
            measurements = measurements.filter(activity__participation__user_id=user)

        group = request.GET.get('group', None)
        if (group is not None) and (int(group) >= 0):
            measurements = measurements.filter(activity__entity__group_id=group)

        serializer = MeasurementSerializer(measurements, many=True)
        resp = {'measurements': (serializer.data)}
        return JsonResponse(resp)
