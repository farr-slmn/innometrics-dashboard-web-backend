from django.contrib.auth.models import User
from django.test import TestCase

from activities.models import Activity, Entity
from measurements.models import Measurement
from projects.models import UserParticipation, Metric
from projects.services import get_activity_properties, retrieve_current_composite_metric_value


class ActivityPropertiesTestCase(TestCase):
    def setUp(self):
        e1 = Entity.objects.create(name="Activity 1")
        e2 = Entity.objects.create(name="Activity 2")
        a1 = Activity.objects.create(entity=e1)
        a2 = Activity.objects.create(entity=e2)

        Measurement.objects.create(activity=a1, type='int', name='int property 1', value="123")
        Measurement.objects.create(activity=a1, type='string', name='property 2', value="234")

        Measurement.objects.create(activity=a2, type='int', name='int property 3', value="123")
        Measurement.objects.create(activity=a2, type='string', name='property 4', value="234")

        user = User.objects.create_user(username='test_user_1', password='test_password', email='test1@email.com')
        p = UserParticipation.objects.create(user=user, project=None)
        e3 = Entity.objects.create(name="Activity 3")
        e4 = Entity.objects.create(name="Activity 4")
        a3 = Activity.objects.create(entity=e3, participation=p)
        a4 = Activity.objects.create(entity=e4, participation=p)

        Measurement.objects.create(activity=a3, type='int', name='int property 5', value="123")
        Measurement.objects.create(activity=a3, type='string', name='property 6', value="234")

        Measurement.objects.create(activity=a4, type='int', name='int property 7', value="123")
        Measurement.objects.create(activity=a4, type='string', name='property 8', value="234")

    def test_activity_props(self):
        expected = [
            {
                "name": "Activity 1",
                "properties": [
                    {"name": "int property 1", "type": "int"},
                    {"name": "property 2", "type": "string"}
                ]
            },
            {
                "name": "Activity 2",
                "properties": [
                    {"name": "int property 3", "type": "int"},
                    {"name": "property 4", "type": "string"}
                ]
            }
        ]
        result = get_activity_properties(None)
        self.assertEqual(result, expected)

    def test_activity_props_2(self):
        expected = [
            {
                "name": "Activity 3",
                "properties": [
                    {"name": "int property 5", "type": "int"},
                    {"name": "property 6", "type": "string"}
                ]
            },
            {
                "name": "Activity 4",
                "properties": [
                    {"name": "int property 7", "type": "int"},
                    {"name": "property 8", "type": "string"}
                ]
            }
        ]
        participation = UserParticipation.objects.get(user__username="test_user_1")
        result = get_activity_properties(participation)
        self.assertEqual(result, expected)


class RawCurrentValue(TestCase):
    def setUp(self):
        pass


class CompositeCurrentValue(TestCase):
    part = None

    def setUp(self):
        user = User.objects.create_user(username='test_user_1', password='test_password', email='test1@email.com')
        self.part = UserParticipation.objects.create(user=user, project=None)
        e = Entity.objects.create(name="activity_test")
        a1 = Activity.objects.create(entity=e, participation=self.part)
        a2 = Activity.objects.create(entity=e, participation=self.part)

        Measurement.objects.create(activity=a1, type='int', name='int_property', value="123")
        Measurement.objects.create(activity=a1, type='long', name='begin_time', value="234")
        Measurement.objects.create(activity=a1, type='long', name='end_time', value="345")

        Measurement.objects.create(activity=a2, type='int', name='int_property', value="124")
        Measurement.objects.create(activity=a2, type='long', name='begin_time', value="235")
        Measurement.objects.create(activity=a2, type='long', name='end_time', value="346")

    def test_simple_composite(self):
        m_raw = Metric.objects.create(name="m_1", type=Metric.RAW, participation=self.part,
                                      info={"field": "int_property", "filters": {}, "activity": "activity_test"})

        m_comp = Metric.objects.create(name="m_1", type=Metric.COMPOSITE, participation=self.part,
                                       info={"bounds": {}, "groupby": {}, "aggregate": "sum",
                                             "components": [m_raw.id, m_raw.id]})

        result = retrieve_current_composite_metric_value(m_comp, self.part)
        self.assertEqual(result, (248, 246))
