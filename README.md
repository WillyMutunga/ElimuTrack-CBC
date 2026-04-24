# ElimuTrack-CBC 🎓

ElimuTrack is a comprehensive **Competency-Based Curriculum (CBC)** management system designed to bridge the gap between students, teachers, and parents. It features specialized track management, automated assessment workflows, and real-time progress tracking.

## 🚀 Features

### For Students
*   **Specialized Track Portal**: See exams and modules tailored specifically to your specialized tracks (e.g., STEM, Arts, Social Sciences).
*   **Grade Level Locking**: Automatic restriction to classes and content matching your current grade level (Junior/Senior School).
*   **My Teachers**: Instantly see and connect with teachers who are specialized in your tracks.
*   **Exam Portal**: Take exams online with automated submission and instant feedback once results are published.

### For Teachers
*   **Track-Specific Classrooms**: Create and manage classes restricted to specific pathways.
*   **Smart Content Upload**: Upload videos, documents, and interactive lessons targeted at specific modules.
*   **Assessment Builder**: Create complex exams with multiple-choice and open-ended questions.
*   **Real-time Monitoring**: Monitor active exam sessions as they happen.

### For Parents
*   **Simplified Login**: Access your child's progress using your phone number and name.
*   **Performance Tracking**: View results and feedback from teachers.

## 🛠️ Tech Stack
*   **Backend**: Django / Django REST Framework (DRF)
*   **Frontend**: React / Vite / Vanilla CSS
*   **Authentication**: JWT (JSON Web Tokens)
*   **Database**: SQLite (Development)

## 🏁 Getting Started

### 1. Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt  # If available
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```

## 🔐 Security Features
*   **Verification System**: Students must be verified by an Admin before accessing full dashboard features.
*   **Cross-Enrollment Protection**: Backend validation prevents students from enrolling in mismatched tracks or grade levels.
*   **Token-based Auth**: Secure API communication using industry-standard JWT.

---
Built with ❤️ for the future of education.
