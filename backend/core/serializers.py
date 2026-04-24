from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from .models import (User, LearningArea, Module, Content, Track, ClassGroup, 
                     Enrollment, Timetable, Assessment, Question, 
                     ExamSession, AssessmentSubmission, UserContentProgress,
                     PasswordResetRequest)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['is_verified'] = user.is_verified
        token['is_profile_complete'] = user.is_profile_complete
        token['id'] = user.id
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.role == 'STUDENT' and not self.user.is_verified:
            raise AuthenticationFailed(
                'Your account is pending verification. Please wait for an Admin to verify your academic documents.',
                code='unverified_account'
            )
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = '__all__'

class ModuleSerializer(serializers.ModelSerializer):
    contents = ContentSerializer(many=True, read_only=True)
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = '__all__'

    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        
        total_contents = obj.contents.count()
        if total_contents == 0:
            return 0
        
        completed_contents = UserContentProgress.objects.filter(
            user=request.user,
            content__module=obj,
            is_completed=True
        ).count()
        
        return round((completed_contents / total_contents) * 100)

class LearningAreaSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    class Meta:
        model = LearningArea
        fields = '__all__'

class TrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    tracks_details = TrackSerializer(source='tracks', many=True, read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'full_name', 'phone_number', 'bio', 'is_profile_complete', 'grade_level', 'verification_document', 'is_verified', 'parent_first_name', 'parent_phone_number', 'associated_student', 'learning_areas', 'tracks', 'tracks_details']
        read_only_fields = ['role', 'username']

    def validate(self, data):
        grade_level = data.get('grade_level')
        tracks = data.get('tracks')
        
        if grade_level == 'Senior School' and tracks and tracks.count() > 1:
            raise serializers.ValidationError("Senior School students can only enroll in one specific pathway track.")
        return data

class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    track_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'full_name', 'grade_level', 'parent_first_name', 'parent_phone_number', 'verification_document', 'track_ids']

    def validate(self, data):
        grade_level = data.get('grade_level')
        track_ids = data.get('track_ids', [])
        
        if grade_level == 'Senior School' and len(track_ids) != 1:
            raise serializers.ValidationError("Senior School students must select exactly one specialized track.")
        return data

    def create(self, validated_data):
        track_ids = validated_data.pop('track_ids', [])
        password = validated_data.pop('password')
        username = validated_data.pop('username')
        
        user = User.objects.create_user(
            username=username,
            password=password,
            role='STUDENT',
            **validated_data
        )
        if track_ids:
            user.tracks.set(track_ids)
        return user

class UserContentProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserContentProgress
        fields = '__all__'


class ClassGroupSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source='teacher.full_name')
    class Meta:
        model = ClassGroup
        fields = ['id', 'name', 'teacher', 'teacher_name', 'track', 'grade_level']

class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.full_name')
    class_name = serializers.ReadOnlyField(source='class_group.name')
    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'class_group', 'date_enrolled', 'student_name', 'class_name']

class TimetableSerializer(serializers.ModelSerializer):
    subject_name = serializers.ReadOnlyField(source='subject.name')
    class Meta:
        model = Timetable
        fields = ['id', 'class_group', 'teacher', 'subject', 'subject_name', 'day_of_week', 'start_time', 'end_time']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'

class AssessmentSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    class Meta:
        model = Assessment
        fields = '__all__'

class ExamSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamSession
        fields = '__all__'

class AssessmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    assessment_title = serializers.CharField(source='assessment.title', read_only=True)
    class Meta:
        model = AssessmentSubmission
        fields = '__all__'

class UserContentProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserContentProgress
        fields = '__all__'

class PasswordResetRequestSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    class Meta:
        model = PasswordResetRequest
        fields = '__all__'
