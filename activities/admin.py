from django.contrib import admin

from activities.models import Entity, Group


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', lambda gr: gr.participation.user, lambda gr: gr.participation.project)
    list_display_links = ('id', 'name')


@admin.register(Entity)
class EntityAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'group')
    list_display_links = ('id', 'name')
