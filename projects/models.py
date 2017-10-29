from django.db import models


class Project(models.Model):
    name = models.CharField(max_length=150, blank=True)
    description = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return self.name


class UserParticipation(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, blank=True, null=True, related_name='participations')

    def __str__(self):
        return str(self.user) + " - " + str(self.project)
