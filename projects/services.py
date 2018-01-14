import time
from collections import defaultdict
from datetime import date
from functools import reduce

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
    measurements = raw_metric_filters_qs(metric, participation, metric_data)
    measurements = measurements.filter(name=metric.info['field'])
    metric_data['measurements'] = JoinedMeasurementSerializer(measurements, many=True).data


def raw_metric_filters_qs(metric, participation, metric_data):
    measurements = Measurement.objects.filter(activity__participation=participation)
    # measurements = Measurement.objects.filter(name=measurement_field, activity__participation=participation)

    activity_name = metric.info.get('activity', None)
    if activity_name:
        measurements = measurements.filter(activity__entity__name=activity_name)

    measurements = apply_filters(measurements, metric.info['filters'])

    # list of properties names for filtered activities
    # should be retrieved before filtering by measurement name
    metric_data['fields'] = list(field[0] for field in set(measurements.values_list("name").distinct()))
    metric_data['fields'].sort()

    return measurements


def apply_filters(measurements_qs, filters):
    group = filters.get('group', None)
    if group and int(group) >= 0:
        measurements_qs = measurements_qs.filter(activity__entity__group_id=group)

    field_from = filters.get('field_from', None)
    if field_from:
        measurements_qs = measurements_qs.filter(value__gte=field_from)

    field_to = filters.get('field_to', None)
    if field_to:
        measurements_qs = measurements_qs.filter(value__lte=field_to)

    return measurements_qs


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

    if (components[0]['type'] == 'R') and (components[1]['type'] == 'R'):

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
            # if groupby['group_func'] == 'sum':
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

                return int(timestamp)

            grouped = {}
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

    elif (components[0]['type'] == 'C') and (components[1]['type'] == 'C'):
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
    else:
        metric_data['x_values'] = []
        metric_data['y_values'] = []


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
            by_day[day] = agg_func(by_day[day], av['value'])

    # fill by 0 other days
    cur_day_timestamp = time.time()
    cur_period = min(by_day.keys())
    while cur_period < cur_day_timestamp:
        by_day[cur_period] += 0
        cur_period += interval
    return by_day


def group_by_day(activity_values, key_func, agg_func):
    return group_by_interval(activity_values, key_func, agg_func, interval=60 * 60 * 24)


def group_by_3_days(activity_values, key_func, agg_func):
    return group_by_interval(activity_values, key_func, agg_func, interval=3 * 60 * 60 * 24, shift=True)


def group_by_7_days(activity_values, key_func, agg_func):
    return group_by_interval(activity_values, key_func, agg_func, interval=7 * 60 * 60 * 24, shift=True)


def group_by_30_days(activity_values, key_func, agg_func):
    return group_by_interval(activity_values, key_func, agg_func, interval=30 * 60 * 60 * 24, shift=True)


######################################################################
# retrieving only current metrics values

def retrieve_current_metrics(participation):
    result = []
    metrics = Metric.objects.filter(participation=participation)
    for m in metrics:
        result.append(retrieve_current_metric_data(m, participation))
    result.sort(key=lambda m: m['id'])
    return result


def retrieve_current_metric_data(metric, participation, strategy="NO_RAW", groupby=None):
    if type(metric) is int:
        metric = Metric.objects.get(pk=metric)
        metric_data = model_to_dict(metric)
    else:
        metric_data = model_to_dict(metric)

    if metric.type == Metric.COMPOSITE:
        retrieve_current_composite_metric_data(metric, participation, metric_data)
    elif strategy != "NO_RAW":
        retrieve_current_raw_metric_data(metric, participation, metric_data, strategy, groupby)
    else:
        # for retrieving only available activities fields
        raw_metric_filters_qs(metric, participation, metric_data)

    return metric_data


def retrieve_current_raw_metric_data(metric, participation, metric_data, strategy="LAST", groupby=None):
    measurements = raw_metric_filters_qs(metric, participation, metric_data)
    measurements = measurements.filter(name=metric.info['field'])

    if strategy == "LAST":
        metric_data['value'] = measurements.order_by('-id').first().value

    elif strategy == "GROUPING":
        metric_data['value'] = 0
        activity_ids = measurements.values_list('activity_id', flat=True)

        if groupby['group_type'] == 'day':
            cur_day_timestamp = int(time.time() / (24 * 60 * 60)) * 24 * 60 * 60
            time_measurements = Measurement.objects.filter(activity__in=activity_ids, name=groupby['group_timefield'])

            allowed_activities = set()
            for t in time_measurements:
                if t.type == "long":
                    timestamp = int(t.value) / 1000  # without millis
                elif t.type == "datetime":
                    timestamp = dateutil.parser.parse(t.value.upper()).timestamp()
                else:
                    continue

                if timestamp >= cur_day_timestamp:
                    allowed_activities.add(t.activity_id)

            measurements = measurements.filter(activity__in=allowed_activities)

        values = measurements.values_list('type', 'value')

        if groupby['group_func'] == 'count':
            metric_data['value'] = len(values)
        elif groupby['group_func'] == 'sum':
            metric_data['value'] = 0
            for v in values:
                if (v[0] == "long") or (v[0] == "int"):
                    metric_data['value'] += int(v[1])
                elif v[0] == "datetime":
                    metric_data['value'] += dateutil.parser.parse(v[1].upper()).timestamp() * 1000  # with millis


def retrieve_current_composite_metric_data(metric, participation, metric_data):
    component_ids = list(map(int, metric.info['components']))
    aggregate = metric.info['aggregate']
    groupby = metric.info.get('groupby', None)

    if groupby:
        # TODO more than two components
        components = [
            retrieve_current_metric_data(component_ids[0], participation, strategy="GROUPING", groupby=groupby),
            retrieve_current_metric_data(component_ids[1], participation, strategy="GROUPING", groupby=groupby),
        ]
    else:
        components = [
            retrieve_current_metric_data(component_ids[0], participation, strategy="LAST"),
            retrieve_current_metric_data(component_ids[1], participation, strategy="LAST"),
        ]

    values = [c['value'] for c in components]

    if aggregate == "minus":
        metric_data['value'] = float(values[0]) - float(values[1])
    elif aggregate == "sum":
        metric_data['value'] = sum(values)
    elif aggregate == "mult":
        metric_data['value'] = reduce(lambda x, y: x * y, values)
    elif aggregate == 'avg':
        metric_data['value'] = sum(values) / float(len(values))
