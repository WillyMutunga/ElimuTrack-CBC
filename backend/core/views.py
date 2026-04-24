from rest_framework import viewsets, generics, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (LearningArea, Module, Content, Track, ClassGroup, 
                     Enrollment, Timetable, Assessment, Question, 
                     ExamSession, AssessmentSubmission, UserContentProgress,
                     PasswordResetRequest)
from .serializers import (LearningAreaSerializer, ModuleSerializer, ContentSerializer,
                          UserSerializer, StudentRegistrationSerializer, 
                          TrackSerializer, ClassGroupSerializer, 
                          EnrollmentSerializer, TimetableSerializer, 
                          AssessmentSerializer, QuestionSerializer, 
                          ExamSessionSerializer, AssessmentSubmissionSerializer,
                          UserContentProgressSerializer, PasswordResetRequestSerializer)

User = get_user_model()
from django.db import models

class LearningAreaViewSet(viewsets.ModelViewSet):
    queryset = LearningArea.objects.all()
    serializer_class = LearningAreaSerializer
    permission_classes = [IsAuthenticated]

class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Module.objects.all()
        elif user.role == 'TEACHER':
            # Teachers see modules of tracks they teach
            return Module.objects.filter(track__in=user.tracks.all())
        elif user.role == 'STUDENT':
            # Students see modules of tracks they are registered in
            return Module.objects.filter(track__in=user.tracks.all())
        return Module.objects.none()

class ContentViewSet(viewsets.ModelViewSet):
    queryset = Content.objects.all()
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Content.objects.all()
        # Filter by modules accessible to the user
        return Content.objects.filter(module__track__in=user.tracks.all())
    
    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        module = serializer.validated_data.get('module')
        
        # Ensure module is an object if ID was passed
        if isinstance(module, int):
            module = Module.objects.get(id=module)
            
        if self.request.user.role == 'TEACHER':
            user_tracks = list(self.request.user.tracks.all())
            print(f"DEBUG: Teacher {self.request.user.username} (ID: {self.request.user.id})")
            print(f"DEBUG: User Tracks: {[t.name for t in user_tracks]}")
            print(f"DEBUG: Module: {module.title} (Track: {module.track.name if module.track else 'None'})")
            
            if module.track and module.track not in user_tracks:
                # Log the denial but don't block if we're debugging? 
                # No, let's just make the check super explicit
                print("DEBUG: PERMISSION DENIED - Track mismatch")
                raise PermissionDenied(f"You are not specialized in the {module.track.name} track. Please update your profile.")
                
            serializer.save(teacher=self.request.user)
        else:
            serializer.save()

class UserContentProgressViewSet(viewsets.ModelViewSet):
    queryset = UserContentProgress.objects.all()
    serializer_class = UserContentProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserContentProgress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class StudentRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = StudentRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class TeacherCreationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({"detail": "Username and password required."}, status=status.HTTP_400_BAD_REQUEST)
        
        teacher = User.objects.create_user(username=username, password=password, role='TEACHER')
        return Response({"detail": f"Teacher {username} created."}, status=status.HTTP_201_CREATED)

class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class TrackViewSet(viewsets.ModelViewSet):
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

class ClassGroupViewSet(viewsets.ModelViewSet):
    queryset = ClassGroup.objects.all()
    serializer_class = ClassGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return ClassGroup.objects.all()
        if user.role == 'TEACHER':
            return ClassGroup.objects.filter(teacher=user)
        return ClassGroup.objects.all()

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        if self.request.user.role == 'TEACHER':
            track = serializer.validated_data.get('track')
            if track and track not in self.request.user.tracks.all():
                raise ValidationError({"detail": f"You can only create classes for your specialized tracks. Track '{track.name}' is not in your profile."})
            serializer.save(teacher=self.request.user)
        else:
            serializer.save()

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Enrollment.objects.all()
        if user.role == 'TEACHER':
            # Teachers see enrollments for classes they manage
            return Enrollment.objects.filter(class_group__teacher=user)
        if user.role == 'STUDENT':
            return Enrollment.objects.filter(student=user)
        return Enrollment.objects.all()

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        student = serializer.validated_data.get('student')
        class_group = serializer.validated_data.get('class_group')
        
        if student.grade_level and class_group.grade_level and student.grade_level != class_group.grade_level:
            raise ValidationError({"detail": f"Cannot enroll. This is a {class_group.grade_level} class, but your profile is set to {student.grade_level}."})
            
        if class_group.track and class_group.track not in student.tracks.all():
            raise ValidationError({"detail": f"Cannot enroll. You are not specialized in the '{class_group.track.name}' track."})
            
        serializer.save()

class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.all()
    serializer_class = TimetableSerializer
    permission_classes = [IsAuthenticated]

class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Assessment.objects.all()
        user = self.request.user
        if user.role == 'STUDENT':
            # Only see exams for their tracks, and only exams created after they registered
            queryset = queryset.filter(
                models.Q(track__in=user.tracks.all()) | models.Q(track__isnull=True),
                created_at__gte=user.date_joined
            ).distinct()
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def authorize(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Only admins can authorize exams."}, status=status.HTTP_403_FORBIDDEN)
        
        assessment = self.get_object()
        assessment.is_authorized = True
        assessment.save()
        return Response({"detail": f"Assessment {assessment.title} authorized."})

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        module = serializer.validated_data.get('module')
        if self.request.user.role == 'TEACHER':
            if module.track and module.track not in self.request.user.tracks.all():
                raise PermissionDenied("You can only create assessments for tracks you specialize in.")
        serializer.save()

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

class ExamSessionViewSet(viewsets.ModelViewSet):
    queryset = ExamSession.objects.all()
    serializer_class = ExamSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ExamSession.objects.all()
        if self.request.user.role == 'TEACHER':
            return queryset
        return queryset.filter(student=self.request.user)

class AssessmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssessmentSubmission.objects.all()
    serializer_class = AssessmentSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = AssessmentSubmission.objects.all()
        user = self.request.user
        
        if user.role == 'ADMIN' or user.role == 'TEACHER':
            return queryset
        elif user.role == 'STUDENT':
            return queryset.filter(student=user)
        elif user.role == 'PARENT':
            # Parent sees their child's published results
            # Note: We use parent_phone_number from student model to match parent's phone_number
            return queryset.filter(student__parent_phone_number=user.phone_number, status='PUBLISHED')
        return queryset.none()

    def perform_update(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        submission = self.get_object()
        
        # Only teachers and admins can grade/update submissions
        if self.request.user.role == 'TEACHER':
            # Check if teacher is specialized in this track
            if submission.assessment.module.track and submission.assessment.module.track not in self.request.user.tracks.all():
                raise PermissionDenied("You are not authorized to grade assessments for this Track.")
        elif self.request.user.role != 'ADMIN':
            raise PermissionDenied("Not authorized to grade exams.")
            
        serializer.save()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return User.objects.all()
        if user.role == 'TEACHER':
            return User.objects.filter(role='STUDENT', tracks__in=user.tracks.all()).distinct()
        if user.role == 'STUDENT':
            # Students can see themselves and teachers who teach their tracks
            return User.objects.filter(models.Q(id=user.id) | models.Q(role='TEACHER', tracks__in=user.tracks.all())).distinct()
        if user.role == 'PARENT':
            if user.associated_student:
                return User.objects.filter(models.Q(id=user.id) | models.Q(id=user.associated_student.id))
            return User.objects.filter(id=user.id)
        return User.objects.filter(id=user.id)

class ParentLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        first_name = request.data.get('first_name', '').strip()
        phone_number = request.data.get('phone_number', '').strip()
        
        print(f"DEBUG: Parent Login Attempt - Name: {first_name}, Phone: {phone_number}")
        
        student = User.objects.filter(
            parent_first_name__iexact=first_name, 
            parent_phone_number=phone_number, 
            role='STUDENT'
        ).first()
        
        if not student:
            # Try a slightly broader search if exact match fails
            student = User.objects.filter(
                parent_first_name__icontains=first_name,
                parent_phone_number__icontains=phone_number,
                role='STUDENT'
            ).first()
            
        if not student:
            print("DEBUG: No matching student found.")
            return Response({"detail": "Invalid credentials or no associated student found."}, status=status.HTTP_401_UNAUTHORIZED)
        
        print(f"DEBUG: Found student {student.username} for parent {first_name}")
        
        parent, created = User.objects.get_or_create(
            username=f"parent_{phone_number}",
            defaults={'role': 'PARENT', 'full_name': first_name, 'associated_student': student}
        )
        if not created:
            parent.associated_student = student
            parent.save()
        
        refresh = RefreshToken.for_user(parent)
        refresh['username'] = parent.username
        refresh['role'] = 'PARENT'
        refresh['student_id'] = student.id
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'student_id': student.id
        })

class PasswordResetRequestViewSet(viewsets.ModelViewSet):
    queryset = PasswordResetRequest.objects.all().order_by('-date_requested')
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return PasswordResetRequest.objects.none()
        return super().get_queryset()

class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        user = User.objects.filter(username=username).first()
        if user:
            PasswordResetRequest.objects.create(user=user)
            return Response({"detail": "Reset request sent to administrator."})
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

class AdminPasswordResetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        user_id = request.data.get('user_id')
        new_password = request.data.get('new_password')
        
        user = User.objects.get(id=user_id)
        user.set_password(new_password)
        user.save()
        
        # Mark related requests as resolved
        PasswordResetRequest.objects.filter(user=user).update(is_resolved=True)
        
        return Response({"detail": f"Password for {user.username} has been reset."})
