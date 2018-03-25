from django.contrib import admin
from projects.models import Project, UserParticipation


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    list_display_links = ('id', 'name')


@admin.register(UserParticipation)
class ParticipationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'project')
    list_display_links = ('id', 'user', 'project')
