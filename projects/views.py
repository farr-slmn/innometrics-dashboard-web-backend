from collections import defaultdict
from datetime import date

import dateutil
import dateutil.parser
from django.forms import model_to_dict
from django.http import JsonResponse
from rest_framework import generics, permissions, status
from rest_framework.views import APIView

from activities.models import Entity
from measurements.models import Measurement
from measurements.serializers import JoinedMeasurementSerializer
from projects.models import Project, Metric, UserParticipation
from projects.serializers import ProjectSerializer, MetricSerializer


class ProjectList(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


class ProjectActivitiesAutocomlete(APIView):
    def get(self, request):
        project_id = request.GET.get('project', None)
        participation = UserParticipation.objects.get(user=request.user.id, project=project_id)
        activities = Entity.objects.filter(activity__participation=participation).values("name").distinct()
        result = []
        for activity in activities:
            item = {'name': activity['name']}
            query = Measurement.objects.filter(activity__participation=participation, activity__entity__name=activity['name'])
            item['fields'] = list(field[0] for field in set(query.values_list("name").distinct()))
            result.append(item)
        return JsonResponse({'activities': list(result)})


class UserProjectMetrics(APIView):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def put(self, request):
        project_id = request.GET.get('project', None)
        participation = UserParticipation.objects.get(user=request.user.id, project=project_id)
        request.data['participation'] = participation.id
        serializer = MetricSerializer(data=request.data)
        if serializer.is_valid():
            new_metric = serializer.save()
            metrics = []
            metric = self.retrieve_metric_data(new_metric, participation, metrics)
            if metric not in metrics:
                metrics.append(metric)
            return JsonResponse({'metrics': list(metrics)}, status=status.HTTP_201_CREATED)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        project_id = request.GET.get('project', None)
        participation = UserParticipation.objects.get(user=request.user.id, project=project_id)
        metrics = Metric.objects.filter(participation=participation)
        result = []
        for m in metrics:
            metric = self.retrieve_metric_data(m, participation, result)
            if metric not in result:
                result.append(metric)

        # leave only composite metrics for root tiles
        # result = filter(lambda m: m['type'] == 'C', result)

        return JsonResponse({'metrics': list(result)})

    def retrieve_metric_data(self, metric, participation, result_list):
        # metric_data = None
        if type(metric) is int:
            metric = Metric.objects.get(pk=metric)
            metric_data = model_to_dict(metric)
            result_list.append(metric_data)
        else:
            metric_data = model_to_dict(metric)

        if metric.type == Metric.RAW:
            measurement_field = metric.info['field']
            measurements = Measurement.objects.filter(activity__participation=participation, name=measurement_field)

            activity_name = metric.info.get('activity', None)
            if activity_name:
                measurements = measurements.filter(activity__entity__name=activity_name)

            group = metric.info['filters'].get('group', None)
            if group and int(group) >= 0:
                measurements = measurements.filter(activity__entity__group_id=group)

            field_from = metric.info['filters'].get('field_from', None)
            if field_from:
                # print(metric.id)
                # print(field_from)
                measurements = measurements.filter(value__gte=field_from)

            field_to = metric.info['filters'].get('field_to', None)
            if field_to:
                measurements = measurements.filter(value__lte=field_to)

            metric_data['measurements'] = JoinedMeasurementSerializer(measurements, many=True).data

        else:
            component_ids = metric.info['components']
            aggregate = metric.info['aggregate']
            groupby = metric.info['groupby']

            # TODO more than two components
            components = [
                next(filter(lambda metric: metric['id'] == component_ids[0], result_list), component_ids[0]),
                next(filter(lambda metric: metric['id'] == component_ids[1], result_list), component_ids[1])
            ]

            def retrieve(mtc):
                return self.retrieve_metric_data(mtc, participation, result_list) if type(mtc) is int else mtc

            components = list(map(retrieve, components))
            # TODO leave only needed components info (e.g. id, name, value)
            metric_data['components'] = components

            if components[0]['type'] == 'R':

                # measurements grouping by activity
                activity_measurements = defaultdict(list)
                for comp in components:
                    for idx, measurement in enumerate(comp['measurements']):
                        activity_measurements[measurement['activity_id']].append(measurement)

                activity_values = []
                for act_id, measurements in activity_measurements.items():
                    activity_value = {
                        'source': measurements
                    }
                    if aggregate == 'minus':
                        a = measurements[0]['value']
                        b = measurements[1]['value']
                        activity_value['value'] = a - b

                    elif aggregate == 'timeinter':
                        # represent time as timestamp in seconds
                        c = int(dateutil.parser.parse(measurements[0]['value'].upper()).timestamp())
                        d = int(dateutil.parser.parse(measurements[1]['value'].upper()).timestamp())
                        activity_value['value'] = abs(c - d)

                    activity_values.append(activity_value)

                def group_by_day(activity_values, key_func, agg_func):
                    by_day = defaultdict(int)
                    for av in activity_values:
                        timestamp_seconds = key_func(av)
                        # d = dateutil.date.fromtimestamp()
                        day = int(timestamp_seconds / (60 * 60 * 24)) * (60 * 60 * 24)
                        if day:
                            day = str(day)
                            by_day[day] = agg_func(by_day[day], av['value'])
                    return by_day

                if groupby:
                    if groupby[0] == 'day':
                        agg_func = lambda a, b: a + b

                        def get_timestamp_from_activity(activity_value):
                            timestamp = 0
                            for m in activity_value['source']:
                                if m['name'] == 'connect time':
                                    timestamp = m['value'] / 1000  # without millis
                                if m['name'] == 'from':
                                    timestamp = dateutil.parser.parse(m['value'].upper()).timestamp()
                            return int(timestamp)

                        grouped = group_by_day(activity_values, get_timestamp_from_activity, agg_func)

                        x_val = []
                        y_val = []

                        grouped_items = list(grouped.items())
                        grouped_items.sort(key=lambda x: x[0])  # sort by time

                        for seconds, value in grouped_items:
                            x_val.append(str(date.fromtimestamp(int(seconds))))
                            y_val.append(value)

                        metric_data['x_values'] = x_val
                        metric_data['y_values'] = y_val
                        if y_val:
                            metric_data['value'] = y_val[-1]

            else:
                y_val_0 = components[0]['y_values']
                y_val_1 = components[1]['y_values']

                x_val_0 = components[0]['x_values']

                y_val = []

                # TODO aggregation with different values lengths
                if len(y_val_0) == len(y_val_1):
                    for i, val in enumerate(y_val_0):
                        y_value = 0
                        if aggregate == 'div':
                            y_value = float(y_val_0[i]) / float(y_val_1[i])
                        elif aggregate == 'mult':
                            y_value = float(y_val_0[i]) * float(y_val_1[i])
                        elif aggregate == 'sum':
                            y_value = float(y_val_0[i]) + float(y_val_1[i])
                        elif aggregate == 'minus':
                            y_value = float(y_val_0[i]) - float(y_val_1[i])
                        elif aggregate == 'avg':
                            y_value = (float(y_val_0[i]) + float(y_val_1[i])) / 2

                        y_val.append(y_value)

                metric_data['x_values'] = x_val_0
                metric_data['y_values'] = y_val
                if y_val:
                    metric_data['value'] = y_val[-1]

        return metric_data
