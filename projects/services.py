import time
from collections import defaultdict
from datetime import date
from functools import reduce
from itertools import groupby

import dateutil
import dateutil.parser
from django.db.models import Q, F
from django.forms import model_to_dict

from activities.models import Entity
from measurements.models import Measurement
from projects.models import Metric

DAY_SEC = 24 * 60 * 60


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
        metric_data['measurements'], metric_data['fields'] = retrieve_raw_metric_data(metric, participation)
    else:
        retrieve_composite_metric_data(metric, participation, metric_data, result_list)
    return metric_data


# for Raw metric
def retrieve_raw_metric_data(metric, participation):
    """
    Retrieves measurements and corresponding activity fields from provided raw metric

    :param metric: Metric model instance
    :param participation: Participation model instance
    :return: (measurements, fields) tuple of
    list of measurement (dict with keys: 'id', 'name', 'value', 'type', 'activity_id', 'entity', 'group')
    and  list of fields (dict with keys: 'name', 'type')
    """
    if metric.type != Metric.RAW:
        raise ValueError

    measurements_qs, fields_qs = raw_metric_filters_qs(metric, participation)
    measurements_qs = measurements_qs.filter(name=metric.info['field']) \
        .annotate(entity=F('activity__entity__name'), group=F('activity__entity__group__name')) \
        .values('id', 'name', 'value', 'type', 'activity_id', 'entity', "group") \
        .order_by('id')
    return list(measurements_qs), list(fields_qs)


# for Raw metric
def raw_metric_filters_qs(metric, participation):
    """
    Builds QuerySets for measurements and corresponding activity fields from metric info.

    :param metric: Metric model instance
    :param participation: UserParticipation model instance
    :return: (measurements_qs, metric_data_fields_qs) tuple of measurements QuerySet and metric data fields QuerySet
    """
    if metric.type != Metric.RAW:
        raise ValueError

    measurements_qs = Measurement.objects.filter(activity__participation=participation)

    activity_name = metric.info.get('activity', None)
    if activity_name:
        measurements_qs = measurements_qs.filter(activity__entity__name=activity_name)

        measurements_qs = apply_filters(measurements_qs, metric.info['filters'], metric.info['field'])

    # list of properties names and type for filtered activities
    # should be retrieved before filtering by measurement name
    # metric_data['fields'] = list(measurements.values('name', 'type').distinct().order_by('type', 'name'))
    metric_data_fields_qs = measurements_qs.values('name', 'type').distinct().order_by('type', 'name')

    return measurements_qs, metric_data_fields_qs


# for Raw metric
def apply_filters(measurements_qs, filters, field_name):
    """
    Returns new QuerySet instance with filters from metric info applied to the provided QuerySet.

    :param measurements_qs: QuerySet
    :param filters: dict of filters from metric info
    :param field_name: string - activity field name from metric info
    :return: new QuerySet with applied filters
    """
    group = filters.get('group', None)
    if group and int(group) >= 0:
        measurements_qs = measurements_qs.filter(activity__entity__group_id=group)

    field_from = filters.get('field_from', None)
    if field_from:
        # TODO could be reasonable to filter whole activity by property value
        measurements_qs = measurements_qs.filter(~Q(name=field_name) | Q(value__gte=field_from))

    field_to = filters.get('field_to', None)
    if field_to:
        measurements_qs = measurements_qs.filter(~Q(name=field_name) | Q(value__lte=field_to))

    return measurements_qs


# for Composite metric
def retrieve_composite_metric_data(metric, participation, metric_data, result_list):
    component_ids = list(map(int, metric.info['components']))
    aggregate = metric.info['aggregate']
    group_by = metric.info.get('groupby', None)

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
                if group_by:
                    activity_measurements[measurement['activity_id']].append(measurement)
                else:
                    activity_measurements[idx].append(measurement)

        activity_values = []
        for key, measurements in activity_measurements.items():
            activity_value = {
                'source': measurements
            }
            a = measurements[0]['value']
            b = measurements[1]['value']
            if aggregate == 'minus':
                activity_value['value'] = float(a) - float(b)
            elif aggregate == 'timeinter':
                # represent time as timestamp in seconds
                c = int(dateutil.parser.parse(a.upper()).timestamp())
                d = int(dateutil.parser.parse(b.upper()).timestamp())
                activity_value['value'] = abs(c - d)
            elif aggregate == 'sum':
                activity_value['value'] = float(a) + float(b)
            elif aggregate == 'mult':
                activity_value['value'] = float(a) * float(b)
            elif aggregate == 'div':
                activity_value['value'] = float(a) / float(b)
            elif aggregate == 'avg':
                activity_value['value'] = (float(a) + float(b))
            elif aggregate == 'min':
                activity_value['value'] = min(float(a), float(b))
            elif aggregate == 'max':
                activity_value['value'] = max(float(a), float(b))

            activity_values.append(activity_value)

        x_val = []
        y_val = []

        if group_by:
            if group_by['group_func'] == 'sum':
                agg_func = lambda a, b: a + b
            elif group_by['group_func'] == 'count':
                agg_func = lambda a, b: a + 1
            if group_by['group_func'] == 'min':
                agg_func = min
            if group_by['group_func'] == 'max':
                agg_func = max

            def get_timestamp_from_activity(activity_value):
                timestamp = 0
                # TODO for any field of an activity
                for m in activity_value['source']:
                    if m['name'] == group_by['group_timefield']:
                        if m['type'] == "long":
                            timestamp = int(m['value']) / 1000  # without millis
                        elif m['type'] == "datetime":
                            timestamp = dateutil.parser.parse(m['value'].upper()).timestamp()
                        break

                return int(timestamp)

            grouped = {}
            if group_by['group_type'] == 'day':
                grouped = group_by_day(activity_values, get_timestamp_from_activity, agg_func)
            elif group_by['group_type'] == '3_days':
                grouped = group_by_3_days(activity_values, get_timestamp_from_activity, agg_func)
            elif group_by['group_type'] == '7_days':
                grouped = group_by_7_days(activity_values, get_timestamp_from_activity, agg_func)
            elif group_by['group_type'] == '30_days':
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
                if aggregate == 'minus':
                    y_value = float(y_val_0[i]) - float(y_val_1[i])
                elif aggregate == 'sum':
                    y_value = float(y_val_0[i]) + float(y_val_1[i])
                elif aggregate == 'mult':
                    y_value = float(y_val_0[i]) * float(y_val_1[i])
                elif aggregate == 'div':
                    y_value = float(y_val_0[i]) / float(y_val_1[i])
                elif aggregate == 'avg':
                    y_value = (float(y_val_0[i]) + float(y_val_1[i])) / 2
                elif aggregate == 'min':
                    y_value = min(float(y_val_0[i]), float(y_val_1[i]))
                elif aggregate == 'max':
                    y_value = max(float(y_val_0[i]), float(y_val_1[i]))

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
    """
    Returns metrics with current values for composite metrics.
    Also metrics contain list of available activity fields for that metric.

    :param participation: UserParticipation model instance
    :return: list of metrics with values and available fields
    """
    result = []
    metrics = Metric.objects.filter(participation=participation)
    for m in metrics:
        result.append(retrieve_current_metric_data(m, participation))
    result.sort(key=lambda metric: metric['id'])
    return result


def retrieve_current_metric_data(metric, participation, strategy="NO_RAW", group_by=None):
    """
    Returns metrics with current values for composite metrics.

    :param metric: metric id or Metric model instance
    :param participation: UserParticipation model instance
    :param strategy: "NO_RAW" - returns only available fields without metric data for raw metrics,
    "LAST" - returns last measurement value (by id) for raw metric,
    "GROUPING" - groups and aggregates measurements values according to 'group_by' info.

    :param group_by: groupby dict from metric info
    :return: metric dict with fields and values
    """
    if type(metric) is int:
        metric = Metric.objects.get(pk=metric)
        metric_data = model_to_dict(metric)
    else:
        metric_data = model_to_dict(metric)

    if metric.type == Metric.COMPOSITE:
        metric_data['value'] = retrieve_current_composite_metric_value(metric, participation)
    elif strategy != "NO_RAW":
        # 'LAST' or 'GROUPING'
        metric_data['value'], fields_qs = retrieve_current_raw_metric_value(metric, participation, strategy, group_by)
    else:
        # for retrieving only available activities fields
        _, fields_qs = raw_metric_filters_qs(metric, participation)

    if (metric.type == Metric.RAW) and (strategy != "LAST") and (strategy != "GROUPED"):
        metric_data['fields'] = list(fields_qs)

    return metric_data


def retrieve_current_raw_metric_value(metric, participation, strategy="LAST", group_by=None):
    """
    Returns current value of a raw metric according to specified strategy.

    :param metric: Metric model instance
    :param participation: UserParticipation model instance
    :param strategy: "LAST" - returns last measurement value (by id) for raw metric,
    "GROUPING" - groups and aggregates measurements values according to 'group_by' info.

    :param group_by: groupby dict from metric info
    :return: (metric_value, metric_fields) tuple of metric value and available activity fields QuerySet
    """
    if metric.type != Metric.RAW:
        raise ValueError

    measurements_qs, fields_qs = raw_metric_filters_qs(metric, participation)
    measurements_qs = measurements_qs.filter(name=metric.info['field'])

    value = None
    if strategy == "LAST":
        value = int(measurements_qs.order_by('-id').first().value)
    elif strategy == "GROUPING":
        value = retrieve_grouped_current_raw_metric_value(measurements_qs, group_by)

    return value, fields_qs


def retrieve_grouped_current_raw_metric_value(measurements_qs, group_by):
    """
    Returns current metric value using grouping operation.

    :param measurements_qs: QuerySet instance for filtered measurements
    :param group_by: groupby dict from metric info
    :return: single integer value
    """
    if not group_by:
        raise ValueError

    activity_ids = measurements_qs.values_list('activity_id', flat=True)

    if group_by['group_type'] == 'day':
        day_shift = 0
    elif group_by['group_type'] == '3_days':
        day_shift = 2
    elif group_by['group_type'] == '7_days':
        day_shift = 6
    elif group_by['group_type'] == '30_days':
        day_shift = 29

    period_start_sec = int(time.time() / DAY_SEC - day_shift) * DAY_SEC

    time_measurements = Measurement.objects.filter(activity__in=activity_ids, name=group_by['group_timefield'])

    allowed_activities = set()
    for t in time_measurements:
        if t.type == "long":
            timestamp = int(t.value) / 1000  # without millis
        elif t.type == "datetime":
            timestamp = dateutil.parser.parse(t.value.upper()).timestamp()
        else:
            continue

        if timestamp >= period_start_sec:
            allowed_activities.add(t.activity_id)

    measurements_qs = measurements_qs.filter(activity__in=allowed_activities)
    measurements = measurements_qs.values('type', 'value')

    fn = group_by['group_func']
    if fn == 'count':
        return measurements.count()

    elif (fn == 'sum') or (fn == 'max') or (fn == 'min'):
        # converting to numbers
        values = []
        for m in measurements:
            if (m['type'] == "long") or (m['type'] == "int"):
                values.append(int(m['value']))
            elif m['type'] == "datetime":
                values.append(dateutil.parser.parse(m['value'].upper()).timestamp() * 1000)  # with millis

        # aggregating
        if fn == 'sum':
            aggr = sum
        elif fn == 'max':
            aggr = max
        elif fn == 'min':
            aggr = min

        return aggr(values) if values else None

    return None


def retrieve_current_composite_metric_value(metric, participation):
    """
    Returns current composite metric value.

    :param metric: Metric model instance
    :param participation: UserParticipation model instance
    :return: current composite metric value
    """
    if metric.type != Metric.COMPOSITE:
        raise ValueError

    component_ids = list(map(int, metric.info['components']))
    aggregate = metric.info['aggregate']
    group_by = metric.info.get('groupby', None)

    if group_by:
        # TODO more than two components
        components = [
            retrieve_current_metric_data(component_ids[0], participation, strategy="GROUPING", group_by=group_by),
            retrieve_current_metric_data(component_ids[1], participation, strategy="GROUPING", group_by=group_by),
        ]
    else:
        components = [
            retrieve_current_metric_data(component_ids[0], participation, strategy="LAST"),
            retrieve_current_metric_data(component_ids[1], participation, strategy="LAST"),
        ]

    values = [c['value'] for c in components]
    if None in values:
        return None

    val = None
    if aggregate == "minus":
        val = values[0] - values[1]
    elif aggregate == 'timeinter':
        # already converted to seconds in the retrieve_current_metric_data()
        val = abs(values[0] - values[1])
    elif aggregate == "sum":
        val = sum(values)
    elif aggregate == "mult":
        val = reduce(lambda x, y: x * y, values)
    elif aggregate == "div":
        val = values[0] / values[1]
    elif aggregate == 'avg':
        val = sum(values) / len(values)
    elif aggregate == 'min':
        val = min(values)
    elif aggregate == 'max':
        val = max(values)

    return val


######################################################################

def get_activity_properties(participation):
    """
    Returns activities and their properties with types.

    :param participation: UserParticipation model instance
    :return: list of activities (dict with keys: 'name', 'properties'. A property is a dict with keys: 'name', 'type').
    """
    lst = Entity.objects.filter(activity__participation=participation) \
        .annotate(activityName=F('name'),
                  propertyName=F('activity__measurements__name'),
                  propertyType=F('activity__measurements__type')) \
        .values("activityName", "propertyName", "propertyType") \
        .distinct().order_by("activityName", "propertyType")

    result = []
    for k, v in groupby(lst, key=lambda x: x['activityName']):
        properties = map(lambda x: {
            'name': x['propertyName'],
            'type': x['propertyType']
        }, v)
        result.append({'name': k, 'properties': list(properties)})

    return list(result)
