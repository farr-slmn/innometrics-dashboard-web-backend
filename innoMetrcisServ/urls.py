from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth.decorators import login_required
from django.views.generic import TemplateView
from rest_framework.authtoken import views as rest_views

from activities import views
from innoMetrcisServ.rpc import Router

router = Router()

urlpatterns = [
    # intro and installation info:
    url(r'^$', views.DownloadList.as_view()),
    url(r'^downloadables/$', views.DownloadList.as_view()),
    url(r'^downloadables/(?P<path>.+)$', views.DownloadList.as_view()),

    # users management:
    url(r'^users/$', views.UserList.as_view()),
    url(r'^users/(?P<pk>[0-9]+)/$', views.UserDetail.as_view()),
    url(r'^admin/', admin.site.urls),

    # applications:
    url(r'^measurements/', include('measurements.urls')),
    url(r'^', include('activities.urls')),

    # registration and authentication:
    url(r'^api-auth/', include('rest_framework.urls',
                               namespace='rest_framework')),
    url(r'^api-token-auth/', rest_views.obtain_auth_token),
    url(r'^register/$', views.CreateUserView.as_view(), name='user'),

    # for dashboards:
    url(r'^dashboard/', include('dash.urls')),
    url(r'^dash_react/', TemplateView.as_view(template_name="dash_react.html")),

    url(r'^projects/', include('projects.urls')),

    url(r'^', include('dash.contrib.apps.public_dashboard.urls')),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
