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
        new_metric_response = {
            "info": {
                "field": "m_begin",
                "filters": {}
            },
            "id": 1, "participation": 1,
            "name": "metric_1",
            "fields": ["extra_field", "m_begin", "m_end"],
            "type": "R"
        }

        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 201)
        self.assertJSONEqual(str(response.content, encoding='utf8'), new_metric_response)

        metrics_response = {
            "metrics": [
                {
                    "info": {
                        "field": "m_begin",
                        "filters": {}
                    },
                    "id": 1, "participation": 1,
                    "name": "metric_1",
                    "type": "R"
                }
            ]
        }

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

        response = self.client.put('/projects/metrics/', content_type='application/json',
                                   data=json.dumps(composite_metric_json))
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
        self.assertJSONEqual(str(response.content, encoding='utf8'),
                             {"info": {"components": ["inaccessible components"]}})


class BaseMetricTestCase(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        user = User.objects.create_user(username='test_user_1', password='test_password', email='test1@email.com')
        UserParticipation.objects.create(user=user, project=None)
        self.client.login(username='test_user_1', password='test_password')

    def test_empty_field(self):
        metric_json = {
            "name": "",
            "type": "R",
            "info": {
                "field": "",
                "filters": {}
            }
        }
        metrics_response = {
            "name": ["This field may not be blank."]
        }
        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metrics_response)

    def test_required_field(self):
        metric_json = {
            "type": "R",
            "info": {
                "field": "",
                "filters": {}
            }
        }
        metrics_response = {
            "name": ["This field is required."]
        }
        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metrics_response)

        metric_json = {
            "name": "metric_1",
            "info": {
                "field": "m_begin",
                "filters": {}
            }
        }
        metrics_response = {
            "type": ["This field is required."]
        }
        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metrics_response)

    def test_wrong_type(self):
        metric_json = {
            "name": "metric_1",
            "type": "T",
            "info": {
                "field": "m_begin",
                "filters": {}
            }
        }
        metrics_response = {
            "type": ["\"T\" is not a valid choice."]
        }
        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metrics_response)

        metric_json = {
            "name": "metric_1",
            "type": "",
            "info": {
                "field": "",
                "filters": {}
            }
        }
        metrics_response = {
            "type": ["\"\" is not a valid choice."]
        }
        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metrics_response)

    def test_info_field(self):
        metric_json = {
            "name": "metric_1",
            "type": "R",
        }
        metrics_response = {
            "info": ["This field is required."]
        }

        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metrics_response)

        metric_json = '{"name": "metric_1", "type": "R", "info": b\'qwe\'}'
        metrics_response = {
            "detail": "JSON parse error - Expecting value: line 1 column 43 (char 42)"
        }
        response = self.client.put('/projects/metrics/', content_type='application/json', data=metric_json)
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metrics_response)


class RawMetricTestCase(TransactionTestCase):
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
                        {"name": "m_begin", "value": "123", "type": "long"},
                        {"name": "m_end", "value": "234", "type": "long"},
                        {"name": "extra_field", "value": "example", "type": "string"},
                    ]
                },
                {
                    "name": "activity_2",
                    "measurements": [
                        {"name": "m_begin", "value": "234", "type": "long"},
                        {"name": "m_end", "value": "456", "type": "long"}
                    ]
                },
                {
                    "name": "activity_1",
                    "measurements": [
                        {"name": "m_begin", "value": "567", "type": "long"},
                        {"name": "m_end", "value": "890", "type": "long"},
                        {"name": "another_extra_field", "value": "example_2", "type": "string"},
                    ]
                },
            ]
        }
        self.client.post('/activities/', content_type='application/json', data=json.dumps(activities_json))

    def test_empty_property(self):
        metric_json = {
            "name": "metric_1",
            "type": "R",
            "info": {
                "field": "",
                "filters": {}
            }
        }
        metrics_response = {
            "info": {
                "field": ["This field may not be blank."]
            }
        }

        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metrics_response)

    def test_not_existing_property(self):
        metric_json = {
            "name": "metric_1",
            "type": "R",
            "info": {
                "field": "does not exist",
                "filters": {}
            }
        }
        metric_response = {
            "fields": ["another_extra_field", "extra_field", "m_begin", "m_end"],
            "info": {
                "field": "does not exist",
                "filters": {}
            },
            "id": 1, "participation": 1,
            "name": "metric_1",
            "type": "R"
        }

        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 201)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metric_response)

        metric_data_response = {
            "fields": ["another_extra_field", "extra_field", "m_begin", "m_end"],
            "measurements": [],
            "info": {
                "field": "does not exist",
                "filters": {}
            },
            "id": 1, "participation": 1,
            "name": "metric_1",
            "type": "R"
        }

        response = self.client.get("/projects/metrics/1/data/")
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metric_data_response)

    def test_empty_filter_value(self):
        metric_json = {
            "name": "metric_1",
            "type": "R",
            "info": {
                "field": "m_begin",
                "filters": {
                    "some_filter": ""
                }
            }
        }
        metrics_response = {
            "info": {
                "filters": ["Filter value may not be blank."]
            }
        }

        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metrics_response)

    def test_not_existing_activity(self):
        metric_json = {
            "name": "metric_1",
            "type": "R",
            "info": {
                "activity": "does not exist",
                "field": "m_begin",
                "filters": {}
            }
        }
        metric_response = {
            "fields": [],
            "info": {
                "activity": "does not exist",
                "field": "m_begin",
                "filters": {}
            },
            "id": 1, "participation": 1,
            "name": "metric_1",
            "type": "R"
        }

        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 201)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metric_response)

        metric_data_response = {
            "fields": [],
            "measurements": [],
            "info": {
                "activity": "does not exist",
                "field": "m_begin",
                "filters": {}
            },
            "id": 1, "participation": 1,
            "name": "metric_1",
            "type": "R"
        }

        response = self.client.get("/projects/metrics/1/data/")
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metric_data_response)

    def test_value_filter(self):
        self.maxDiff = None
        metric_json = {
            "name": "metric_1",
            "type": "R",
            "info": {
                "field": "m_begin",
                "filters": {
                    "field_from": "234"
                }
            }
        }
        new_metric_response = {
            "fields": ["another_extra_field", "extra_field", "m_begin", "m_end"],
            "info": {
                "field": "m_begin",
                "filters": {"field_from": "234"}
            },
            "id": 1, "participation": 1,
            "name": "metric_1",
            "type": "R"
        }

        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 201)
        self.assertJSONEqual(str(response.content, encoding='utf8'), new_metric_response)

        metric_data_response = {
            "fields": ["another_extra_field", "extra_field", "m_begin", "m_end"],
            "measurements": [
                {"id": 4, "name": "m_begin", "value": "234", "type": "long", "activity_id": 2,
                 "entity": "activity_2", "group": None},
                {"id": 6, "name": "m_begin", "value": "567", "type": "long", "activity_id": 3,
                 "entity": "activity_1", "group": None}
            ],
            "info": {
                "field": "m_begin",
                "filters": {"field_from": "234"}
            },
            "id": 1, "participation": 1,
            "name": "metric_1",
            "type": "R"
        }
        response = self.client.get("/projects/metrics/1/data/")
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metric_data_response)

        metric_json = {
            "name": "metric_2",
            "type": "R",
            "info": {
                "field": "m_begin",
                "filters": {
                    "field_to": "234"
                }
            }
        }
        new_metric_response = {
            "fields": ["another_extra_field", "extra_field", "m_begin", "m_end"],
            "info": {
                "field": "m_begin",
                "filters": {"field_to": "234"}
            },
            "id": 2, "participation": 1,
            "name": "metric_2",
            "type": "R"
        }

        response = self.client.put('/projects/metrics/', content_type='application/json', data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 201)
        self.assertJSONEqual(str(response.content, encoding='utf8'), new_metric_response)

        metric_data_response = {
            "fields": ["another_extra_field", "extra_field", "m_begin", "m_end"],
            "measurements": [
                {"id": 1, "name": "m_begin", "value": "123", "type": "long", "activity_id": 1,
                 "entity": "activity_1", "group": None},
                {"id": 4, "name": "m_begin", "value": "234", "type": "long", "activity_id": 2,
                 "entity": "activity_2", "group": None},
            ],
            "info": {
                "field": "m_begin",
                "filters": {"field_to": "234"}
            },
            "id": 2, "participation": 1,
            "name": "metric_2",
            "type": "R"
        }
        response = self.client.get("/projects/metrics/2/data/")
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metric_data_response)

    def test_metric_value(self):
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

        metrics_values_response = {
            "metrics": [
                {
                    "info": {
                        "field": "m_begin",
                        "filters": {}
                    },
                    "id": 1, "participation": 1,
                    "name": "metric_1",
                    "fields": ["another_extra_field", "extra_field", "m_begin", "m_end"],
                    "type": "R"
                }
            ]
        }

        response = self.client.get("/projects/metrics/values/")
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metrics_values_response)

    def test_metric_data(self):
        self.client.login(username='test_user_1', password='test_password')

        metric_json = {
            "name": "metric_1",
            "type": "R",
            "info": {
                "field": "m_begin",
                "filters": {}
            }
        }
        response = self.client.put('/projects/metrics/', content_type='application/json',
                                   data=json.dumps(metric_json))
        self.assertEqual(response.status_code, 201)

        metric_data_response = {
            "measurements": [
                {"id": 1, "name": "m_begin", "value": "123", "type": "long", "activity_id": 1,
                 "entity": "activity_1", "group": None},
                {"id": 4, "name": "m_begin", "value": "234", "type": "long", "activity_id": 2,
                 "entity": "activity_2", "group": None},
                {"id": 6, "name": "m_begin", "value": "567", "type": "long", "activity_id": 3,
                 "entity": "activity_1", "group": None}
            ],
            "info": {
                "field": "m_begin",
                "filters": {}
            },
            "id": 1, "participation": 1,
            "name": "metric_1",
            "fields": ["another_extra_field", "extra_field", "m_begin", "m_end"],
            "type": "R"
        }

        response = self.client.get("/projects/metrics/1/data/")
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(str(response.content, encoding='utf8'), metric_data_response)
