from django.db import models
from django.dispatch import receiver
from rest_framework.authtoken.models import Token
from django.db.models.signals import post_save
from django.conf import settings

from projects.models import UserParticipation


class Group(models.Model):
    name = models.TextField(max_length=150, blank=True)
    participation = models.ForeignKey(UserParticipation, blank=True, null=True)

    def __str__(self):
        return self.name


class Entity(models.Model):
    name = models.TextField(max_length=120, blank=True)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, blank=True, null=True)

    class Meta:
        verbose_name = 'Entity'
        verbose_name_plural = 'Entities'

    def __str__(self):
        return self.name


class Activity(models.Model):
    comments = models.CharField(max_length=255, blank=True)
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, blank=True, null=True)
    participation = models.ForeignKey(UserParticipation, blank=True, null=True)

    def save(self, *args, **kwargs):
        super(Activity, self).save(*args, **kwargs)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)
