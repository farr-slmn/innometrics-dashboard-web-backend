from django.contrib.auth.models import User
from django.test import TransactionTestCase

from projects.models import Project, UserParticipation


class ProjectTestCase(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        user = User.objects.create_user(username='test_user_1', password='test_password', email='test1@email.com')
        project = Project.objects.create(name='test_project_1')
        UserParticipation.objects.create(user=user, project=None)
        UserParticipation.objects.create(user=user, project=project)

        user2 = User.objects.create_user(username='test_user_2', password='test_password', email='test2@email.com')
        project2 = Project.objects.create(name='test_project_2')
        UserParticipation.objects.create(user=user2, project=None)
        UserParticipation.objects.create(user=user2, project=project)
        UserParticipation.objects.create(user=user2, project=project2)

    def tearDown(self):
        self.client.logout()

    def test_not_authorized(self):
        # test not authorized
        response = self.client.get('/projects/')
        self.assertEqual(response.status_code, 401)

    def test_get_user_projects(self):
        # authenticate user 1
        result = self.client.login(username='test_user_1', password='test_password')
        self.assertTrue(result)

        # get projects
        response = self.client.get('/projects/', )
        self.assertEqual(response.status_code, 200, 'response is not 200')

        projects = response.json()['results']
        self.assertEqual(projects, [
            {
                'id': 1,
                'name': 'test_project_1',
                'description': '',
                'participants': [
                    {
                        'id': '1',
                        'username': 'test_user_1',
                        'email': 'test1@email.com'
                    },
                    {
                        'id': '2',
                        'username': 'test_user_2',
                        'email': 'test2@email.com'
                    }
                ]
            }
        ])

        # authenticate user 2
        result = self.client.login(username='test_user_2', password='test_password')
        self.assertTrue(result)

        # get projects
        response = self.client.get('/projects/', )
        self.assertEqual(response.status_code, 200, 'response is not 200')

        projects = response.json()['results']
        self.assertEqual(projects, [
            {
                'id': 1,
                'name': 'test_project_1',
                'description': '',
                'participants': [
                    {
                        'id': '1',
                        'username': 'test_user_1',
                        'email': 'test1@email.com'
                    },
                    {
                        'id': '2',
                        'username': 'test_user_2',
                        'email': 'test2@email.com'
                    }
                ]
            },
            {
                'id': 2,
                'name': 'test_project_2',
                'description': '',
                'participants': [
                    {
                        'id': '2',
                        'username': 'test_user_2',
                        'email': 'test2@email.com'
                    }
                ]
            }
        ])
