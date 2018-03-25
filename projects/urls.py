from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.ProjectList.as_view()),
    url(r'^metrics/activities/$', views.ProjectActivitiesAutocomplete.as_view()),
    url(r'^metrics/(?P<pk>[0-9]+)/data/$', views.MetricsData.as_view()),
    url(r'^metrics/values/$', views.MetricsValues.as_view()),
    url(r'^metrics/$', views.UserProjectMetrics.as_view()),
    url(r'^metrics/(?P<pk>[0-9]+)/$', views.UserProjectMetrics.as_view()),
]
