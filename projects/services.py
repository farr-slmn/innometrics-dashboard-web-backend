import random as rnd
import time
from collections import defaultdict
from datetime import date
from functools import reduce
from itertools import groupby

import dateutil
import dateutil.parser
from django.db import transaction
from django.db.models import Q, F
from django.forms import model_to_dict

from activities.models import Entity, Activity
from measurements.models import Measurement
from projects.models import Metric, UserParticipation

DAY_SEC = 24 * 60 * 60

AGGR_FUNCTIONS = {'sum': sum, 'count': len, 'min': min, 'max': max}


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
        v, x, y = retrieve_composite_metric_data(metric, participation, result_list)
        metric_data['value'], metric_data['x_values'], metric_data['y_values'] = v, x, y
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
        .values('id', 'name', 'value', 'type', 'activity_id', 'entity', 'group') \
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
def get_grouped_measurements(metric, participation, time_field, interval, shifted=False):
    """
    Groups measurements from raw metric by period according to provided 'time_field' and interval value.

    :param metric: Metric model instance
    :param participation: UserParticipation model instance
    :param time_field: field name of activity that represents time (epoch time or UTC)
    :param interval: time interval for grouping in seconds
    :param shifted: whether shift interval to the current time or not.
    :return: dictionary of measurements lists grouped by period
    """
    if metric.type != Metric.RAW:
        raise ValueError

    if not time_field:
        return {}

    field_name = metric.info['field']
    activity_name = metric.info.get('activity', None)
    group = metric.info['filters'].get('group', None)
    field_from = metric.info['filters'].get('field_from', None)
    field_to = metric.info['filters'].get('field_to', None)

    # retrieve time for target measurements
    qs = Measurement.objects.filter(activity__participation=participation, name=time_field)
    if activity_name:
        qs = qs.filter(activity__entity__name=activity_name)
    if group and int(group) >= 0:
        qs = qs.filter(activity__entity__group_id=group)

    activities = qs.values('activity_id', 'value', 'type')
    act_time = {}
    for a in activities:
        act_time[a['activity_id']] = a['value'], a['type']

    # retrieve target measurements
    m_qs = Measurement.objects.filter(activity_id__in=act_time.keys(), name=field_name)
    if field_from:
        m_qs = m_qs.filter(value__gte=field_from)
    if field_to:
        m_qs = m_qs.filter(value__lte=field_to)

    # set time to measurements
    measurements = m_qs.values('value', 'type', 'activity_id').order_by('id')
    for m in measurements:
        time_v, time_type = act_time[m['activity_id']]

        if time_type == "long":
            m['time'] = int(time_v) / 1000  # without millis
        elif time_type == "datetime":
            m['time'] = dateutil.parser.parse(time_v.upper()).timestamp()

    # group measurements by period
    return group_by_period(measurements, interval, shifted)


def get_interval_and_shift(group_by):
    """
    Returns time interval and shifting flag according to 'group_by' options.

    :param group_by: 'group_by' options dictionary from metric info
    :return: (interval, shifted) tuple of interval in seconds and shifting boolean flag
    """

    if group_by['group_type'] == '3_days':
        return 3 * DAY_SEC, True
    elif group_by['group_type'] == '7_days':
        return 7 * DAY_SEC, True
    elif group_by['group_type'] == '30_days':
        return 30 * DAY_SEC, True

    return DAY_SEC, False


# for Composite metric
def retrieve_composite_metric_data(metric, participation, result_list):
    """
    Retrieves composite metric data from provided composite metric

    :param metric: Metric model instance
    :param participation: UserParticipation model instance
    :param result_list: list for storing already retrieved metric data for reuse
    :return: (metric_value, x_values, y_values) - tuple with current metric value, list of x values and list of y values
    """
    if metric.type != Metric.COMPOSITE:
        raise ValueError

    metric_value, x_values, y_values = 0, None, None
    component_ids = list(map(int, metric.info['components']))
    aggregate = metric.info['aggregate']
    group_by = metric.info.get('groupby', None)

    metric_components = Metric.objects.filter(id__in=component_ids, participation=participation)
    if len(metric_components) != 2 and component_ids[0] != component_ids[1]:
        raise ValueError

    if component_ids[0] != metric_components[0].id:
        metric_components = [metric_components[1], metric_components[0]]

    all_raw = all([m.type == Metric.RAW for m in metric_components])

    if group_by and all_raw:
        # both metric components should be 'raw'

        interval, shifted = get_interval_and_shift(group_by)
        time_field = group_by.get('group_timefield', None)
        measurement_grouped = []
        for mc in metric_components:
            grouped = get_grouped_measurements(mc, participation, time_field, interval, shifted)
            measurement_grouped.append(grouped)

        res = {}
        agg_func = AGGR_FUNCTIONS[group_by['group_func']]
        # merge and apply aggregation to grouped measurements
        m_groups_1, m_groups_2 = measurement_grouped[0], measurement_grouped[-1]
        for k, group_1 in m_groups_1.items():
            if k in m_groups_2 and len(group_1) == len(m_groups_2[k]):
                group_values = map(lambda a, b: main_aggregate_operation(a, b, aggregate), group_1, m_groups_2[k])
                res[k] = agg_func(group_values)

        # fill by None other days
        cur_day_timestamp = time.time()
        cur_period = min(res.keys())
        while cur_period < cur_day_timestamp:
            val = res.get(cur_period, None)
            if val is None:
                res[cur_period] = None
            cur_period += interval

        res = list(res.items())
        res.sort(key=lambda v: v[0])

        x_values, y_values = zip(*res)

        if y_values:
            metric_value = y_values[-1]

        return metric_value, x_values, y_values

    else:
        # TODO more than two components
        # find metrics if they already retrieved, otherwise put ids
        components = [
            next((m for m in result_list if m['id'] == component_ids[0]), component_ids[0]),
            next((m for m in result_list if m['id'] == component_ids[1]), component_ids[1])
        ]

        def retrieve(mtc):
            if type(mtc) is int:
                mtc = next((m for m in result_list if m['id'] == mtc), mtc)
            if type(mtc) is int:
                # retrieve metric data if mtc is id
                mtc = next((m for m in metric_components if m.id == mtc), mtc)
                mtc = retrieve_metric_data(mtc, participation, result_list)
            return mtc

        if all_raw:
            components_data = list(map(retrieve, components))
            values = [list(map(lambda x: x['value'], comp['measurements'])) for comp in components_data]

            n = max(map(len, values))
            x_values = list(range(n))

            cur_len = len(values[0])
            y_values = values[0]
            y_values = ([None] * (n - cur_len)) + y_values

            for vs in values[1:]:
                cur_len = len(vs)
                y_vals = ([None] * (n - cur_len)) + vs

                for i, y in enumerate(y_vals):
                    y_values[i] = main_aggregate_operation(y_values[i], y, aggregate)

            if y_values:
                metric_value = y_values[-1]

            return metric_value, x_values, y_values

        elif all([m.type == Metric.COMPOSITE for m in metric_components]):
            components_data = list(map(retrieve, components))

            x_val_0 = components_data[0]['x_values']
            y_val_0 = components_data[0]['y_values']
            x_val_1 = components_data[1]['x_values']
            y_val_1 = components_data[1]['y_values']

        else:
            if metric_components[0].type == Metric.RAW:
                raw_idx, cmp_idx = 0, 1
            else:
                raw_idx, cmp_idx = 1, 0
            group_by = metric_components[cmp_idx].info.get('groupby', None)

            composite_data = retrieve(metric_components[cmp_idx].id)
            x_val_0 = composite_data['x_values']
            y_val_0 = composite_data['y_values']

            if group_by:
                interval, shifted = get_interval_and_shift(group_by)
                time_field = group_by.get('group_timefield', None)
                agg_func = AGGR_FUNCTIONS[group_by['group_func']]

                measurement_grouped = get_grouped_measurements(metric_components[raw_idx], participation,
                                                               time_field, interval, shifted)

                x_val_1 = list(measurement_grouped.keys())
                values = list(measurement_grouped.values())
                if group_by['group_func'] != 'count':
                    for i in range(len(values)):
                        values[i] = list(map(float, values[i]))

                y_val_1 = [agg_func(y) for y in values]

            else:
                raw_data = retrieve(metric_components[raw_idx].id)
                y_val_1 = list(map(lambda x: x['value'], raw_data['measurements']))
                n = max([len(y_val_0), len(y_val_1)])

                x_val_0 = list(range(n))
                x_val_1 = x_val_0

                y_val_0 = ([None] * (n - len(y_val_0))) + y_val_0
                y_val_1 = ([None] * (n - len(y_val_1))) + y_val_1

            if metric_components[0].type == Metric.RAW:
                x_val_0, y_val_0, x_val_1, y_val_1 = x_val_1, y_val_1, x_val_0, y_val_0

        vals_0 = dict(zip(x_val_0, y_val_0))
        vals_1 = dict(zip(x_val_1, y_val_1))
        values_dict = {}

        # merge (apply aggregation) by x values
        for key, val in vals_0.items():
            if key in vals_1:
                values_dict[key] = main_aggregate_operation(val, vals_1[key], aggregate)

        # sort by x values
        res = list(values_dict.items())
        res.sort(key=lambda v: v[0])

        x_values, y_values = zip(*res)
        if y_values:
            metric_value = y_values[-1]

    return metric_value, x_values, y_values


def main_aggregate_operation(a, b, aggregate):
    """
    Evaluates input values according to aggregation function.

    :param a: first value
    :param b: second value
    :param aggregate: aggregation type
    :return: single float value or None if some of the values is None
    """
    if (a is None) or (b is None):
        return None

    if aggregate == 'minus':
        return float(a) - float(b)
    elif aggregate == 'timeinter':
        # represent time as timestamp in seconds
        c = int(dateutil.parser.parse(a.upper()).timestamp())
        d = int(dateutil.parser.parse(b.upper()).timestamp())
        return abs(c - d)
    elif aggregate == 'sum':
        return float(a) + float(b)
    elif aggregate == 'mult':
        return float(a) * float(b)
    elif aggregate == 'div':
        return float(a) / float(b)
    elif aggregate == 'avg':
        return (float(a) + float(b)) / 2
    elif aggregate == 'min':
        return min(float(a), float(b))
    elif aggregate == 'max':
        return max(float(a), float(b))


def group_by_period(measurements, interval=DAY_SEC, shifted=False):
    """
    Groups measurements by period according to provided time interval.

    :param measurements: list of measurements with attributes 'time' and 'value'
    :param interval: time interval for grouping in seconds
    :param shifted: whether shift interval to the current time or not.
    :return: dictionary of values lists grouped by period
    """

    by_period = defaultdict(list)
    if measurements and shifted:
        last_val = max(map(lambda m: m['time'], measurements))
        shifted = last_val - int(last_val / interval) * interval + 1
    for m in measurements:
        timestamp_seconds = m['time']
        period_start = (timestamp_seconds - shifted) / interval
        if shifted:
            period_start = period_start + 1
        day = int(period_start) * interval + shifted
        if day:
            by_period[day].append(m['value'])
    return by_period


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
        last = measurements_qs.order_by('-id').first()
        value = None if last is None else int(last.value)
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


def add_test_examples(user_id):
    """
    Creates test activities, measurements and metric examples in default project for user.
    If the user already has such activities then does nothing.

    :param user_id: user id
    """
    example_activity = "Test Activity Example"
    test_examples = Activity.objects.filter(entity__name=example_activity, participation__user=user_id)
    if test_examples.count() == 0:
        with transaction.atomic():
            part = UserParticipation.objects.get(user=user_id, project=None)
            e, created = Entity.objects.get_or_create(name=example_activity)

            # activities for 10 days
            for i in range(10):
                cur_day_timestamp = int(time.time() / DAY_SEC - i) * DAY_SEC

                # ten activities per day
                for j in range(10):
                    a = Activity(participation=part, entity=e)
                    a.save()

                    start_time = cur_day_timestamp + rnd.randint(9 * 60 * 60, 18 * 60 * 60)
                    end_time = start_time + rnd.randint(60 * 60, 2 * 60 * 60)

                    Measurement(type='int', name='int property 1', value=str(rnd.randint(0, 100)), activity=a).save()
                    Measurement(type='int', name='int property 2', value=str(rnd.randint(0, 100)), activity=a).save()
                    Measurement(type='long', name='start time', value=str(start_time * 1000), activity=a).save()
                    Measurement(type='long', name='end time', value=str(end_time * 1000), activity=a).save()

            p1 = Metric(name='Tst activity prop 1', type=Metric.RAW, participation=part,
                        info={"field": "int property 1", "filters": {}, "activity": example_activity})
            p2 = Metric(name='Tst activity prop 2', type=Metric.RAW, participation=part,
                        info={"field": "int property 2", "filters": {}, "activity": example_activity})
            p1.save()
            p2.save()

            c1 = Metric(name='Tst props diff', type=Metric.COMPOSITE, participation=part,
                        info={"bounds": {}, "groupby": {}, "aggregate": "minus", "components": [p1.id, p2.id]})
            c2 = Metric(name='Tst diff by day', type=Metric.COMPOSITE, participation=part,
                        info={"bounds": {"lower": 20, "upper": 80},
                              "groupby": {"group_func": "sum", "group_type": "day", "group_timefield": "start time"},
                              "aggregate": "minus", "components": [p1.id, p2.id]})
            c3 = Metric(name='Tst diff by 3 days', type=Metric.COMPOSITE, participation=part,
                        info={"bounds": {},
                              "groupby": {"group_func": "sum", "group_type": "3_days", "group_timefield": "start time"},
                              "aggregate": "minus", "components": [p1.id, p2.id]})
            c1.save()
            c2.save()
            c3.save()

            c4 = Metric(name='Tst diff mult', type=Metric.COMPOSITE, participation=part,
                        info={"bounds": {"lower": 0, "upper": 1000000}, "groupby": {}, "aggregate": "mult",
                              "components": [c2.id, c2.id]})
            c4.save()
