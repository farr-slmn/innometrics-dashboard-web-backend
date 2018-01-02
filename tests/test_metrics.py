from django.contrib.auth.models import User
from django.test import TransactionTestCase
from rest_framework.utils import json

from projects.models import UserParticipation


class MetricTestCase(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        user = User.objects.create_user(username='test_user_1', password='test_password', email='test1@email.com')
        UserParticipation.objects.create(user=user, project=None)
        self.client.login(username='test_user_1', password='test_password')

        activities_json = {
            "activities": [
                {
                    "name": "activity_1",
                    "measurements": [
                        {
                            "name": "m_begin",
                            "value": "123",
                            "type": "long"
                        },
                        {
                            "name": "m_end",
                            "value": "234",
                            "type": "long"
                        },
                        {
                            "name": "extra_field",
                            "value": "example",
                            "type": "string"
                        },
                    ]
                },
                {
                    "name": "activity_2",
                    "measurements": [
                        {
                            "name": "m_begin",
                            "value": "234",
                            "type": "long"
                        },
                        {
                            "name": "m_end",
                            "value": "456",
                            "type": "long"
                        }
                    ]
                },
                {
                    "name": "activity_1",
                    "measurements": [
                        {
                            "name": "m_begin",
                            "value": "567",
                            "type": "long"
                        },
                        {
                            "name": "m_end",
                            "value": "890",
                            "type": "long"
                        },
                        {
                            "name": "extra_field",
                            "value": "example_2",
                            "type": "string"
                        },
                    ]
                },
            ]
        }
        self.client.post('/activities/', content_type='application/json', data=json.dumps(activities_json))
        self.client.logout()

    def tearDown(self):
        self.client.logout()

    def test_not_authorized(self):
        # test not authorized
        response = self.client.get('/projects/metrics/')
        self.assertEqual(response.status_code, 401)

    def test_metric_creation(self):
        self.client.login(username='test_user_1', password='test_password')
        metric_json = {
            "name": "metric_1",
            "type": "R",
            "info": {
                "field": "m_begin",
                "filters": {}
            }
        }
        metrics_response = {
            "metrics": [
                {
                    "measurements": [
                        {"id": 1, "name": "m_begin", "value": "123", "type": "long", "activity_id": 1,
                         "entity": "activity_1",
                         "group": None},
                        {"id": 4, "name": "m_begin", "value": "234", "type": "long", "activity_id": 2,
                         "entity": "activity_2",
                         "group": None},
                        {"id": 6, "name": "m_begin", "value": "567", "type": "long", "activity_id": 3,
                         "entity": "activity_1",
                         "group": None}
                    ],
                    "info": {
                        "field": "m_begin",
                        "filters": {}
                    },
                    "id": 1, "participation": 1,
                    "name": "metric_1",
                    "fields": ["extra_field", "m_begin", "m_end"],
                    "type": "R"
                }
            ]
        }

        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 201)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metrics_response)

        response = self.client.get("/projects/metrics/")
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metrics_response)

    def test_inaccessible_composite_metrics(self):
        self.client.login(username='test_user_1', password='test_password')
        metric_json = {
            "name": "metric_1",
            "type": "R",
            "info": {
                "field": "m_begin",
                "filters": {}
            }
        }
        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 201)

        composite_metric_json = {
            "name": "metric_2",
            "type": "C",
            "info": {
                "aggregate": "minus",
                "components": [1, 1],
                "groupby": {}
            }
        }

        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(composite_metric_json))
        self.assertEqual(response.status_code, 201)

        composite_metric_json = {
            "name": "metric_3",
            "type": "C",
            "info": {
                "aggregate": "minus",
                "components": [10, 1],
                "groupby": {}
            }
        }

        response = self.client.put('/projects/metrics/', content_type='application/json',
                                   data=json.dumps(composite_metric_json))
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(str(response.content, encoding='utf8'), {"info": {"components": ["inaccessible components "]}})
