import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User, LearningArea, Module, Content, Assessment, Question

def seed_data():
    print("Seeding database...")
    
    # Create Users
    admin, created = User.objects.get_or_create(username='admin', defaults={'email': 'admin@elimutrack.com', 'role': 'ADMIN'})
    if created: admin.set_password('password123'); admin.save()
    
    teacher, created = User.objects.get_or_create(username='teacher1', defaults={'email': 'teacher1@elimutrack.com', 'role': 'TEACHER'})
    if created: teacher.set_password('password123'); teacher.save()

    student, created = User.objects.get_or_create(username='student1', defaults={'email': 'student1@elimutrack.com', 'role': 'STUDENT', 'grade_level': 'Grade 4'})
    if created: student.set_password('password123'); student.save()
    
    parent, created = User.objects.get_or_create(username='parent1', defaults={'email': 'parent1@elimutrack.com', 'role': 'PARENT'})
    if created: parent.set_password('password123'); parent.save()

    print("Users created.")

    # Create Curriculum Data
    science, _ = LearningArea.objects.get_or_create(name="Science & Technology", description="Basic science concepts")
    
    module1, _ = Module.objects.get_or_create(learning_area=science, title="The Environment", description="Understanding our surroundings", order_index=1)
    module2, _ = Module.objects.get_or_create(learning_area=science, title="Water and Hygiene", description="Water safety and health", order_index=2, is_locked=True, prerequisite=module1)
    
    # Create Content
    Content.objects.get_or_create(module=module1, title="Introduction to Environment", content_type="VIDEO", external_link="https://www.youtube.com/watch?v=sUKtxs71QQY", teacher=teacher)
    
    # Create Assessment
    assessment, created = Assessment.objects.get_or_create(module=module1, title="Environment CAT 1", type="CAT", time_limit_minutes=15, teacher=teacher)
    if created:
        Question.objects.create(assessment=assessment, text="What is an environment?", type="MCQ", points=1, options={"choices": ["Everything around us", "Only animals", "Only buildings"], "correct": "Everything around us"})
        Question.objects.create(assessment=assessment, text="Is water part of the environment?", type="TF", points=1, options={"correct": "True"})

    print("Curriculum and Assessment data created.")
    print("Database seeding completed successfully.")

if __name__ == '__main__':
    seed_data()
