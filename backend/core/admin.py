from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, LearningArea, Module, Content, Assessment, Question, AssessmentSubmission, Observation

admin.site.register(User, UserAdmin)
admin.site.register(LearningArea)
admin.site.register(Module)
admin.site.register(Content)
admin.site.register(Assessment)
admin.site.register(Question)
admin.site.register(AssessmentSubmission)
admin.site.register(Observation)
