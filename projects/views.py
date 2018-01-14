from django.http import JsonResponse, Http404, HttpResponseForbidden
from rest_framework import generics, permissions, status
from rest_framework.views import APIView

from activities.models import Entity
from measurements.models import Measurement
from projects.models import Project, UserParticipation, Metric
from projects.serializers import ProjectSerializer, MetricSerializer
from projects.services import retrieve_current_metrics, retrieve_metric_data, \
    retrieve_current_metric_data


class ProjectList(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ProjectSerializer

    def get_queryset(self):
        """
        This view should return a list of all the projects
        for the currently authenticated user.
        """
        user = self.request.user
        return Project.objects.filter(participations__user=user)


class ProjectActivitiesAutocomplete(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        project_id = request.GET.get('project', None)
        participation = UserParticipation.objects.get(user=request.user.id, project=project_id)
        activities = Entity.objects.filter(activity__participation=participation).values("name").distinct()
        result = []
        for activity in activities:
            item = {'name': activity['name']}
            query = Measurement.objects.filter(activity__participation=participation,
                                               activity__entity__name=activity['name'])
            # item['fields'] = list(field[0] for field in set(query.values_list("name").distinct()))
            item['fields'] = list(set(query.values_list("name", flat=True)))
            result.append(item)
        return JsonResponse({'activities': list(result)})


class MetricsValues(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        project_id = request.GET.get('project', None)
        participation = UserParticipation.objects.get(user=request.user.id, project=project_id)
        result = retrieve_current_metrics(participation)

        return JsonResponse({'metrics': list(result)})


class MetricsData(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self, pk):
        try:
            return Metric.objects.get(pk=pk)
        except Metric.DoesNotExist:
            return Http404()

    def get(self, request, pk):
        project_id = request.GET.get('project', None)
        metric = self.get_object(pk)
        participation = UserParticipation.objects.get(user=request.user.id, project=project_id)

        if metric.participation_id != participation.id:
            return HttpResponseForbidden()

        result = retrieve_metric_data(metric, participation, [])
        return JsonResponse(result)


class UserProjectMetrics(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def put(self, request):
        project_id = request.GET.get('project', None)
        participation = UserParticipation.objects.get(user=request.user.id, project=project_id)
        request.data['participation'] = participation.id
        serializer = MetricSerializer(data=request.data)
        if serializer.is_valid():
            new_metric = serializer.save()
            metric = retrieve_current_metric_data(new_metric, participation, [])
            return JsonResponse(metric, status=status.HTTP_201_CREATED)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        project_id = request.GET.get('project', None)
        metrics = Metric.objects.filter(participation__user=request.user.id,
                                        participation__project=project_id).order_by("id")
        serializer = MetricSerializer(metrics, many=True)

        return JsonResponse({'metrics': serializer.data})
