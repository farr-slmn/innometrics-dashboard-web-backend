from django.http import JsonResponse
from rest_framework import generics, permissions, status
from rest_framework.views import APIView

from activities.models import Entity
from measurements.models import Measurement
from projects.models import Project, UserParticipation, Metric
from projects.serializers import ProjectSerializer, MetricSerializer
from projects.services import retrieve_metrics, retrieve_metric


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


class ProjectActivitiesAutocomlete(APIView):
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


class UserProjectMetrics(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def put(self, request):
        project_id = request.GET.get('project', None)
        participation = UserParticipation.objects.get(user=request.user.id, project=project_id)
        request.data['participation'] = participation.id
        serializer = MetricSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data['type'] == 'C':
                components = serializer.validated_data['info']['components']
                available = set(
                    Metric.objects.filter(id__in=components, participation=participation).values_list('id', flat=True))
                if (not components) or (len(components) != 2) or (not set(components).issubset(available)):
                    return JsonResponse({"info": {"components": ["inaccessible components "]}},
                                        status=status.HTTP_400_BAD_REQUEST)
            new_metric = serializer.save()
            metrics = retrieve_metric(new_metric, participation, [])
            return JsonResponse({'metrics': list(metrics)}, status=status.HTTP_201_CREATED)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        project_id = request.GET.get('project', None)
        participation = UserParticipation.objects.get(user=request.user.id, project=project_id)
        result = retrieve_metrics(participation)

        return JsonResponse({'metrics': list(result)})
