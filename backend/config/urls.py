from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.serializers import CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from core.views import (LearningAreaViewSet, ModuleViewSet, ContentViewSet, 
                        TrackViewSet, ClassGroupViewSet, EnrollmentViewSet, 
                        TimetableViewSet, AssessmentViewSet,
                        StudentRegistrationView, TeacherCreationView, ProfileUpdateView,
                        ParentLoginView, QuestionViewSet, ExamSessionViewSet, UserViewSet,
                        AssessmentSubmissionViewSet, UserContentProgressViewSet,
                        PasswordResetRequestViewSet, RequestPasswordResetView, AdminPasswordResetView)

router = DefaultRouter()
router.register(r'learning-areas', LearningAreaViewSet)
router.register(r'modules', ModuleViewSet)
router.register(r'contents', ContentViewSet)
router.register(r'tracks', TrackViewSet)
router.register(r'classes', ClassGroupViewSet)
router.register(r'enrollments', EnrollmentViewSet)
router.register(r'timetables', TimetableViewSet)
router.register(r'assessments', AssessmentViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'exam-sessions', ExamSessionViewSet)
router.register(r'assessment-submissions', AssessmentSubmissionViewSet)
router.register(r'users', UserViewSet)
router.register(r'progress', UserContentProgressViewSet)
router.register(r'reset-requests', PasswordResetRequestViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', StudentRegistrationView.as_view(), name='student_register'),
    path('api/parent-login/', ParentLoginView.as_view(), name='parent_login'),
    path('api/create-teacher/', TeacherCreationView.as_view(), name='create_teacher'),
    path('api/profile/', ProfileUpdateView.as_view(), name='profile_update'),
    path('api/request-reset/', RequestPasswordResetView.as_view(), name='request_reset'),
    path('api/admin-reset/', AdminPasswordResetView.as_view(), name='admin_reset'),
    path('api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
