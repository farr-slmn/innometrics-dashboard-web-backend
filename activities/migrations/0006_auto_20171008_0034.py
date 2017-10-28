# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2017-10-07 21:34
from __future__ import unicode_literals

from django.db import migrations


def move_data(apps, schema_editor):
    activity = apps.get_model("activities", "Activity")
    participations = apps.get_model("projects", "UserParticipation")
    objects_total = activity.objects.all().count()
    current_index = 1
    for activity_row in activity.objects.all():
        participation, created = participations.objects.get_or_create(user_id=activity_row.user_id, project_id=None)
        activity_row.participation_id = participation.id
        activity_row.save()
        if current_index % 100 == 0:
            percentage = (current_index / objects_total) * 100
            print("\rProgress: " + "{0:.2f}".format(percentage) + "%", end='')
        current_index += 1


class Migration(migrations.Migration):
    dependencies = [
        ('activities', '0005_auto_20171008_0028'),
    ]

    operations = [
        migrations.RunPython(move_data)
    ]