from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.ProjectList.as_view()),
    url(r'^metrics/activities/$', views.ProjectActivitiesAutocomplete.as_view()),
    url(r'^metrics/(?P<pk>[0-9]+)/data/$', views.MetricsData.as_view()),
    url(r'^metrics/$', views.UserProjectMetrics.as_view()),
]
