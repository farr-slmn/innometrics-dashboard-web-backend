from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.ProjectList.as_view()),
    url(r'^metrics/$', views.UserProjectMetrics.as_view()),
]
