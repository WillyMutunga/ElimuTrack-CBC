from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('TEACHER', 'Teacher'),
        ('STUDENT', 'Student'),
        ('PARENT', 'Parent'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    grade_level = models.CharField(max_length=50, blank=True, null=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    is_profile_complete = models.BooleanField(default=False)
    
    # New Phase 3 Fields
    verification_document = models.FileField(upload_to='student_docs/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    parent_first_name = models.CharField(max_length=100, null=True, blank=True)
    parent_phone_number = models.CharField(max_length=20, null=True, blank=True)
    associated_student = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='parents')
    learning_areas = models.ManyToManyField('LearningArea', blank=True, related_name='teachers')
    tracks = models.ManyToManyField('Track', blank=True, related_name='users')

    def __str__(self):
        return f"{self.username} ({self.role})"

class Track(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class ClassGroup(models.Model):
    name = models.CharField(max_length=100)
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_classes', limit_choices_to={'role': 'TEACHER'})
    track = models.ForeignKey(Track, on_delete=models.SET_NULL, null=True, blank=True, related_name='classes')
    grade_level = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.name} - {self.grade_level}"

class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments', limit_choices_to={'role': 'STUDENT'})
    class_group = models.ForeignKey(ClassGroup, on_delete=models.CASCADE, related_name='enrollments')
    date_enrolled = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} -> {self.class_group.name}"

class Timetable(models.Model):
    DAYS_OF_WEEK = [
        ('MON', 'Monday'), ('TUE', 'Tuesday'), ('WED', 'Wednesday'),
        ('THU', 'Thursday'), ('FRI', 'Friday'), ('SAT', 'Saturday'), ('SUN', 'Sunday')
    ]
    class_group = models.ForeignKey(ClassGroup, on_delete=models.CASCADE, related_name='timetables')
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, limit_choices_to={'role': 'TEACHER'})
    subject = models.ForeignKey('LearningArea', on_delete=models.CASCADE)
    day_of_week = models.CharField(max_length=3, choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.class_group.name} - {self.subject.name} ({self.day_of_week})"

class LearningArea(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Module(models.Model):
    learning_area = models.ForeignKey(LearningArea, on_delete=models.CASCADE, related_name='modules')
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='modules', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order_index = models.IntegerField(default=0)
    is_locked = models.BooleanField(default=False)
    prerequisite = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return f"{self.learning_area.name} - {self.title}"

class Content(models.Model):
    CONTENT_TYPES = [
        ('PDF', 'PDF Document'),
        ('VIDEO', 'Video Lesson'),
        ('LINK', 'External Link'),
        ('TEXT', 'Text Lesson'),
    ]
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='contents')
    title = models.CharField(max_length=200)
    content_type = models.CharField(max_length=10, choices=CONTENT_TYPES)
    file = models.FileField(upload_to='module_content/', blank=True, null=True)
    external_link = models.URLField(blank=True, null=True)
    text_content = models.TextField(blank=True, null=True)
    date_uploaded = models.DateTimeField(auto_now_add=True)
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, limit_choices_to={'role': 'TEACHER'})

    class Meta:
        ordering = ['date_uploaded']

    def __str__(self):
        return f"{self.title} ({self.content_type})"

class Assessment(models.Model):
    TYPES = [
        ('CAT', 'Continuous Assessment Test'),
        ('EXAM', 'Exam'),
    ]
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='assessments')
    track = models.ForeignKey('Track', on_delete=models.SET_NULL, null=True, blank=True, related_name='assessments')
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=10, choices=TYPES)
    time_limit_minutes = models.IntegerField(default=30)
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, limit_choices_to={'role': 'TEACHER'})
    created_at = models.DateTimeField(auto_now_add=True)
    is_authorized = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=True)  # Locked by default until scheduled
    scheduled_start_time = models.DateTimeField(null=True, blank=True)
    scheduled_end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.type}"

class Question(models.Model):
    TYPES = [
        ('MCQ', 'Multiple Choice'),
        ('TF', 'True/False'),
        ('SHORT', 'Short Answer'),
    ]
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    type = models.CharField(max_length=10, choices=TYPES)
    points = models.IntegerField(default=1)
    options = models.JSONField(blank=True, null=True, help_text="JSON format for choices and correct answer. E.g., {'choices': ['A', 'B'], 'correct': 'A'}")

    def __str__(self):
        return self.text[:50]

class AssessmentSubmission(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
    ]
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'STUDENT'})
    score = models.FloatField(default=0.0)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='DRAFT')
    timestamp = models.DateTimeField(auto_now_add=True)
    answers = models.JSONField(blank=True, null=True, help_text="Student's submitted answers")

    def __str__(self):
        return f"{self.student.username} - {self.assessment.title}"

class Observation(models.Model):
    RATINGS = [
        ('EE', 'Exceeding Expectations'),
        ('ME', 'Meeting Expectations'),
        ('AE', 'Approaching Expectations'),
        ('BE', 'Below Expectations'),
    ]
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='observations', limit_choices_to={'role': 'STUDENT'})
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recorded_observations', limit_choices_to={'role': 'TEACHER'})
    sub_strand = models.CharField(max_length=200)
    rating = models.CharField(max_length=5, choices=RATINGS)
    date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.student.username} - {self.sub_strand} ({self.rating})"

class ExamSession(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_sessions')
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='sessions')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField()
    is_submitted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.student.username} - {self.assessment.title} Session"

class UserContentProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    content = models.ForeignKey('Content', on_delete=models.CASCADE, related_name='user_progress')
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'content')

    def __str__(self):
        return f"{self.user.username} - {self.content.title} ({self.is_completed})"

class PasswordResetRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_requests')
    date_requested = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Reset for {self.user.username}"
