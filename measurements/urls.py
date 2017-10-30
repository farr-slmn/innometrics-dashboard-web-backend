from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.MeasurementsList.as_view()),
    url(r'^joined/$', views.JoinedMeasurementsList.as_view()),
]
