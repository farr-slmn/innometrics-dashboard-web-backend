from collections import defaultdict
from datetime import date

import dateutil
import dateutil.parser
from django.forms import model_to_dict

from measurements.models import Measurement
from measurements.serializers import JoinedMeasurementSerializer
from projects.models import Metric


def retrieve_metrics(participation):
    result = []
    metrics = Metric.objects.filter(participation=participation)
    for m in metrics:
        retrieve_metric(m, participation, result)
    return result


def retrieve_metric(metric, participation, result):
    metr = retrieve_metric_data(metric, participation, result)
    if metr not in result:
        result.append(metr)
    return result


def retrieve_metric_data(metric, participation, result_list):
    # metric_data = None
    if type(metric) is int:
        metric = Metric.objects.get(pk=metric)
        metric_data = model_to_dict(metric)
        result_list.append(metric_data)
    else:
        metric_data = model_to_dict(metric)

    if metric.type == Metric.RAW:
        retrieve_raw_metric_data(metric, participation, metric_data)
    else:
        retrieve_composite_metric_data(metric, participation, metric_data, result_list)
    return metric_data


def retrieve_raw_metric_data(metric, participation, metric_data):
    measurement_field = metric.info['field']
    measurements = Measurement.objects.filter(activity__participation=participation)
    # measurements = Measurement.objects.filter(name=measurement_field, activity__participation=participation)

    activity_name = metric.info.get('activity', None)
    if activity_name:
        measurements = measurements.filter(activity__entity__name=activity_name)

    group = metric.info['filters'].get('group', None)
    if group and int(group) >= 0:
        measurements = measurements.filter(activity__entity__group_id=group)

    field_from = metric.info['filters'].get('field_from', None)
    if field_from:
        measurements = measurements.filter(value__gte=field_from)

    field_to = metric.info['filters'].get('field_to', None)
    if field_to:
        measurements = measurements.filter(value__lte=field_to)

    # list of properties names for filtered activities
    metric_data['fields'] = list(field[0] for field in set(measurements.values_list("name").distinct()))
    metric_data['fields'].sort()

    measurements = measurements.filter(name=measurement_field)

    metric_data['measurements'] = JoinedMeasurementSerializer(measurements, many=True).data


def retrieve_composite_metric_data(metric, participation, metric_data, result_list):
    component_ids = list(map(int, metric.info['components']))
    aggregate = metric.info['aggregate']
    groupby = metric.info.get('groupby', None)

    # TODO more than two components
    # find metrics if they already retrieved, otherwise put ids
    components = [
        next((m for m in result_list if m['id'] == component_ids[0]), component_ids[0]),
        next((m for m in result_list if m['id'] == component_ids[1]), component_ids[1])
    ]

    def retrieve(mtc):
        if type(mtc) is int:
            mtc = next((m for m in result_list if m['id'] == mtc), mtc)
        # retrieve metric if mtc is id
        return retrieve_metric_data(mtc, participation, result_list) if type(mtc) is int else mtc

    components = list(map(retrieve, components))
    metric_data['components'] = component_ids

    if components[0]['type'] == 'R':

        # measurements grouping by activity
        activity_measurements = defaultdict(list)
        for comp in components:
            for idx, measurement in enumerate(comp['measurements']):
                if groupby:
                    activity_measurements[measurement['activity_id']].append(measurement)
                else:
                    activity_measurements[idx].append(measurement)

        activity_values = []
        for key, measurements in activity_measurements.items():
            activity_value = {
                'source': measurements
            }
            if aggregate == 'minus':
                a = measurements[0]['value']
                b = measurements[1]['value']
                activity_value['value'] = float(a) - float(b)

            elif aggregate == 'timeinter':
                # represent time as timestamp in seconds
                c = int(dateutil.parser.parse(measurements[0]['value'].upper()).timestamp())
                d = int(dateutil.parser.parse(measurements[1]['value'].upper()).timestamp())
                activity_value['value'] = abs(c - d)

            activity_values.append(activity_value)

        x_val = []
        y_val = []

        if groupby:
            # if groupby[1] == 'sum':
            agg_func = lambda a, b: a + b
            if groupby['group_func'] == 'count':
                agg_func = lambda a, b: a + 1

            def get_timestamp_from_activity(activity_value):
                timestamp = 0
                # TODO for any field of an activity
                for m in activity_value['source']:
                    if m['name'] == groupby['group_timefield']:
                        if m['type'] == "long":
                            timestamp = int(m['value']) / 1000  # without millis
                        elif m['type'] == "datetime":
                            timestamp = dateutil.parser.parse(m['value'].upper()).timestamp()
                        break
                        # if m['name'] == 'connect time' or m['name'] == 'code begin time':
                        #
                        # elif m['name'] == 'from':

                return int(timestamp)

            grouped = []
            if groupby['group_type'] == 'day':
                grouped = group_by_day(activity_values, get_timestamp_from_activity, agg_func)
            elif groupby['group_type'] == '3_days':
                grouped = group_by_3_days(activity_values, get_timestamp_from_activity, agg_func)
            elif groupby['group_type'] == '7_days':
                grouped = group_by_7_days(activity_values, get_timestamp_from_activity, agg_func)
            elif groupby['group_type'] == '30_days':
                grouped = group_by_30_days(activity_values, get_timestamp_from_activity, agg_func)

            grouped_items = list(grouped.items())
            grouped_items.sort(key=lambda x: x[0])  # sort by time

            for seconds, value in grouped_items:
                x_val.append(str(date.fromtimestamp(int(seconds))))
                y_val.append(value)
        else:
            activity_values.sort(key=lambda x: x['source'][0]['id'])
            y_val = list(map(lambda x: x['value'], activity_values))
            x_val = list(range(0, len(y_val)))

        metric_data['x_values'] = x_val
        metric_data['y_values'] = y_val
        if y_val:
            metric_data['value'] = y_val[-1]

    else:
        y_val_0 = components[0]['y_values']
        y_val_1 = components[1]['y_values']

        # TODO merge by x values
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


def group_by_interval(activity_values, key_func, agg_func, interval, shift=False):
    by_day = defaultdict(int)
    if activity_values and shift:
        last_val = max(map(key_func, activity_values))
        shift = last_val - int(last_val / interval) * interval + 1
    for av in activity_values:
        timestamp_seconds = key_func(av)
        # d = dateutil.date.fromtimestamp()
        period_start = (timestamp_seconds - shift) / interval
        if shift:
            period_start = period_start + 1
        day = int(period_start) * interval + shift
        if day:
            day = str(day)
            by_day[day] = agg_func(by_day[day], av['value'])
    return by_day


def group_by_day(activity_values, key_func, agg_func):
    return group_by_interval(activity_values, key_func, agg_func, interval=60 * 60 * 24)


def group_by_3_days(activity_values, key_func, agg_func):
    return group_by_interval(activity_values, key_func, agg_func, interval=3 * 60 * 60 * 24, shift=True)


def group_by_7_days(activity_values, key_func, agg_func):
    return group_by_interval(activity_values, key_func, agg_func, interval=7 * 60 * 60 * 24, shift=True)


def group_by_30_days(activity_values, key_func, agg_func):
    return group_by_interval(activity_values, key_func, agg_func, interval=30 * 60 * 60 * 24, shift=True)
