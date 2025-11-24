"""
Advanced Timetable Scheduler with Constraint Satisfaction
========================================================

This module implements an intelligent timetable scheduler that:
1. Considers faculty availability and workload
2. Avoids scheduling conflicts
3. Optimizes resource allocation
4. Ensures subject credit requirements are met
5. Balances teacher workload distribution

Author: Generated for The Phoenix Project
"""

import uuid
from typing import Dict, List, Set, Tuple, Optional
from dataclasses import dataclass, field
from enum import Enum
import random
from collections import defaultdict, Counter
from database import supabase_admin
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DayOfWeek(Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"

class SubjectType(Enum):
    THEORY = "Theory"
    PRACTICAL = "Practical"
    LAB = "Lab"
    FIELD_WORK = "Field Work"

@dataclass
class TimeSlot:
    day: DayOfWeek
    period: int
    start_time: str
    end_time: str
    
    def __hash__(self):
        return hash((self.day.value, self.period))
    
    def __str__(self):
        return f"{self.day.value} P{self.period} ({self.start_time}-{self.end_time})"

@dataclass
class Subject:
    subject_id: str
    name: str
    code: str
    department: str
    credits: int
    subject_type: SubjectType
    weekly_hours: int = None
    
    def __post_init__(self):
        if self.weekly_hours is None:
            # Estimate weekly hours based on credits and type
            if self.subject_type in [SubjectType.LAB, SubjectType.PRACTICAL]:
                self.weekly_hours = self.credits * 2  # Labs need more hours
            else:
                self.weekly_hours = self.credits

@dataclass
class Teacher:
    teacher_id: str
    name: str
    department: str
    max_credits: int
    primary_subject: str
    other_subjects: List[str] = field(default_factory=list)
    availability: Set[TimeSlot] = field(default_factory=set)
    current_load: int = 0
    
    def can_teach(self, subject: Subject) -> bool:
        """Check if teacher can teach this subject with intelligent matching"""
        # Direct subject name match
        if subject.name == self.primary_subject or subject.name in self.other_subjects:
            return True
            
        # Exact department match
        if subject.department == self.department:
            return True
            
        # Intelligent department mapping for common mismatches
        dept_mappings = {
            "Computer Science": ["CSE", "IT", "AIML", "IoT"],
            "Chemistry": ["Chemistry", "Science", "Chemical", "Mechanical", "Civil"],  # Broadened
            "Humanities": ["English", "Humanities", "Liberal Arts", "Management"],  # Broadened
            "Mathematics": ["Math", "Science", "Applied Math"],
            "Physics": ["Physics", "Science", "Applied Physics"],
            "Management": ["MBA", "Business", "Management"]
        }
        
        for target_dept, compatible_depts in dept_mappings.items():
            if subject.department == target_dept and self.department in compatible_depts:
                return True
            if self.department == target_dept and subject.department in compatible_depts:
                return True
                
        # Subject name partial matching for related subjects
        subject_keywords = {
            "Database": ["Database", "Data", "SQL", "DBMS"],
            "Chemistry": ["Chemistry", "Chemical", "Organic", "Inorganic"],
            "English": ["English", "Communication", "Language", "Literature"],
            "Mathematics": ["Math", "Statistics", "Calculus", "Algebra"],
            "Programming": ["Programming", "Coding", "Software", "Development"]
        }
        
        for keyword, related_terms in subject_keywords.items():
            if any(term.lower() in subject.name.lower() for term in related_terms):
                if any(term.lower() in self.primary_subject.lower() for term in related_terms):
                    return True
                if any(any(term.lower() in other_subj.lower() for term in related_terms) 
                      for other_subj in self.other_subjects):
                    return True
        
        # Universal fallback: Any teacher can teach basic/general subjects
        general_subjects = ["English Communication", "Basic Mathematics", "General Chemistry", 
                          "Physics Fundamentals", "Communication Skills"]
        if any(general.lower() in subject.name.lower() for general in general_subjects):
            return True
        
        return False
    
    def is_available(self, time_slot: TimeSlot) -> bool:
        """Check if teacher is available at given time slot"""
        return (not self.availability or time_slot in self.availability)
    
    def can_take_load(self, additional_hours: int) -> bool:
        """Check if teacher can handle additional teaching load"""
        return self.current_load + additional_hours <= self.max_credits

@dataclass
class ClassSection:
    class_id: str
    name: str
    department: str
    subjects: List[Subject] = field(default_factory=list)
    strength: int = 30  # Default class strength

@dataclass
class ScheduleEntry:
    time_slot: TimeSlot
    subject: Subject
    teacher: Teacher
    class_section: ClassSection
    room: str = "TBA"

class ScheduleConflictError(Exception):
    """Raised when there's a scheduling conflict"""
    pass

class SmartScheduler:
    """
    Intelligent timetable scheduler using constraint satisfaction approach
    """
    
    def __init__(self):
        self.time_slots: List[TimeSlot] = []
        self.teachers: Dict[str, Teacher] = {}
        self.subjects: Dict[str, Subject] = {}
        self.classes: Dict[str, ClassSection] = {}
        self.schedule: Dict[str, List[ScheduleEntry]] = {}  # class_id -> schedule entries
        self.teacher_schedule: Dict[str, Set[TimeSlot]] = defaultdict(set)  # teacher_id -> occupied slots
        
        self._initialize_time_slots()
    
    def _initialize_time_slots(self):
        """Initialize standard time slots"""
        periods = [
            ("09:00", "10:00"),
            ("10:00", "11:00"), 
            ("11:30", "12:30"),  # After break
            ("12:30", "13:30"),
            ("14:30", "15:30"),  # After lunch
            ("15:30", "16:30")
        ]
        
        for day in DayOfWeek:
            for i, (start, end) in enumerate(periods, 1):
                self.time_slots.append(TimeSlot(day, i, start, end))
    
    def load_data_from_supabase(self, user_id: str) -> bool:
        """Load scheduling data from Supabase"""
        try:
            logger.info(f"Loading data for user: {user_id}")
            
            # Load teachers
            teachers_result = supabase_admin.table("Faculty_Clg").select("*").eq("User_id", user_id).execute()
            if teachers_result.data:
                for teacher_row in teachers_result.data:
                    self._process_teachers(teacher_row.get("details", {}))
            
            # Load subjects  
            subjects_result = supabase_admin.table("Subjects_Clg").select("*").eq("User_id", user_id).execute()
            if subjects_result.data:
                for subject_row in subjects_result.data:
                    self._process_subjects(subject_row.get("details", {}))
            
            # Load classes/courses
            classes_result = supabase_admin.table("Classes_Clg").select("*").eq("User_id", user_id).execute()
            if classes_result.data:
                for class_row in classes_result.data:
                    self._process_classes(class_row.get("details", {}))
            
            logger.info(f"Loaded: {len(self.teachers)} teachers, {len(self.subjects)} subjects, {len(self.classes)} classes")
            return True
            
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            return False
    
    def _process_teachers(self, details: Dict):
        """Process teacher data from database"""
        if "teachers" not in details:
            return
            
        for teacher_data in details["teachers"]:
            teacher = Teacher(
                teacher_id=teacher_data.get("Teacher_id", str(uuid.uuid4())),
                name=teacher_data["name"],
                department=teacher_data["department"], 
                max_credits=teacher_data["max_credits"],
                primary_subject=teacher_data["primary_subject"],
                other_subjects=[teacher_data["other_subject"]] if teacher_data.get("other_subject") else []
            )
            self.teachers[teacher.teacher_id] = teacher
    
    def _process_subjects(self, details: Dict):
        """Process subject data from database"""
        if "subjects" not in details:
            return
            
        for subject_data in details["subjects"]:
            try:
                subject_type = SubjectType(subject_data["Subject_Type"])
            except ValueError:
                subject_type = SubjectType.THEORY  # Default
                
            subject = Subject(
                subject_id=subject_data.get("Subject_ID", str(uuid.uuid4())),
                name=subject_data["Subject_Name"],
                code=subject_data["Subject_Code"],
                department=subject_data["Department"],
                credits=subject_data["Credits"],
                subject_type=subject_type
            )
            self.subjects[subject.subject_id] = subject
    
    def _process_classes(self, details: Dict):
        """Process class data from database"""
        if "courses" not in details:
            return
            
        for class_data in details["courses"]:
            class_section = ClassSection(
                class_id=class_data.get("Course_ID", str(uuid.uuid4())),
                name=class_data["Course_Name"],
                department=class_data["department"]
            )
            
            # Find related subjects for this class
            for subject in self.subjects.values():
                if (subject.department == class_section.department or 
                    subject.name.lower() in class_section.name.lower()):
                    class_section.subjects.append(subject)
            
            self.classes[class_section.class_id] = class_section
    
    def find_suitable_teacher(self, subject: Subject, time_slot: TimeSlot) -> Optional[Teacher]:
        """Find the best available teacher for a subject at given time"""
        suitable_teachers = []
        
        for teacher in self.teachers.values():
            if (teacher.can_teach(subject) and 
                teacher.is_available(time_slot) and
                time_slot not in self.teacher_schedule[teacher.teacher_id] and
                teacher.can_take_load(1)):  # 1 hour per slot
                suitable_teachers.append(teacher)
        
        if not suitable_teachers:
            return None
        
        # Prefer teachers with lower current load for better distribution
        return min(suitable_teachers, key=lambda t: t.current_load)
    
    def has_conflict(self, class_id: str, time_slot: TimeSlot) -> bool:
        """Check if class already has something scheduled at this time"""
        if class_id not in self.schedule:
            return False
        
        return any(entry.time_slot == time_slot for entry in self.schedule[class_id])
    
    def schedule_subject_for_class(self, class_section: ClassSection, subject: Subject) -> List[ScheduleEntry]:
        """Schedule all required hours for a subject across the week"""
        scheduled_entries = []
        hours_needed = subject.weekly_hours
        
        # Get available time slots (shuffle for randomization)
        available_slots = self.time_slots.copy()
        random.shuffle(available_slots)
        
        for time_slot in available_slots:
            if hours_needed <= 0:
                break
                
            # Check for conflicts
            if self.has_conflict(class_section.class_id, time_slot):
                continue
            
            # Find suitable teacher
            teacher = self.find_suitable_teacher(subject, time_slot)
            if not teacher:
                continue
            
            # Create schedule entry
            entry = ScheduleEntry(
                time_slot=time_slot,
                subject=subject,
                teacher=teacher,
                class_section=class_section
            )
            
            # Update internal state
            if class_section.class_id not in self.schedule:
                self.schedule[class_section.class_id] = []
            
            self.schedule[class_section.class_id].append(entry)
            self.teacher_schedule[teacher.teacher_id].add(time_slot)
            teacher.current_load += 1
            
            scheduled_entries.append(entry)
            hours_needed -= 1
        
        if hours_needed > 0:
            logger.warning(f"Could not schedule {hours_needed} hours for {subject.name} in {class_section.name}")
        
        return scheduled_entries
    
    def generate_timetable(self, user_id: str) -> Dict:
        """Generate optimized timetable for all classes"""
        logger.info(f"Starting timetable generation for user: {user_id}")
        
        # Load data
        if not self.load_data_from_supabase(user_id):
            raise Exception("Failed to load data from database")
        
        if not self.classes:
            raise Exception("No classes found for scheduling")
        
        # Clear any existing schedule
        self.schedule.clear()
        self.teacher_schedule.clear()
        for teacher in self.teachers.values():
            teacher.current_load = 0
        
        # Schedule each class
        for class_section in self.classes.values():
            logger.info(f"Scheduling class: {class_section.name}")
            
            # If no specific subjects for class, use all available subjects
            if not class_section.subjects:
                class_section.subjects = list(self.subjects.values())
            
            # Sort subjects by priority (higher credits first)
            subjects_to_schedule = sorted(class_section.subjects, 
                                        key=lambda s: s.credits, reverse=True)
            
            for subject in subjects_to_schedule:
                self.schedule_subject_for_class(class_section, subject)
        
        # Convert to output format
        return self._format_output()
    
    def _format_output(self) -> Dict:
        """Format schedule for database storage"""
        formatted_schedule = {"classes": []}
        
        for class_id, entries in self.schedule.items():
            class_section = self.classes[class_id]
            
            class_schedule = {
                "class_name": class_section.name,
                "department": class_section.department,
                "schedule": []
            }
            
            for entry in entries:
                schedule_entry = {
                    "day": entry.time_slot.day.value,
                    "period": entry.time_slot.period,
                    "start_time": entry.time_slot.start_time,
                    "end_time": entry.time_slot.end_time,
                    "subject": entry.subject.name,
                    "subject_code": entry.subject.code,
                    "teacher": entry.teacher.name,
                    "room": entry.room,
                    "subject_type": entry.subject.subject_type.value
                }
                class_schedule["schedule"].append(schedule_entry)
            
            # Sort schedule by day and period for better readability
            class_schedule["schedule"].sort(key=lambda x: (
                list(DayOfWeek)[list(DayOfWeek.__members__.values()).index(DayOfWeek(x["day"]))].value,
                x["period"]
            ))
            
            formatted_schedule["classes"].append(class_schedule)
        
        return formatted_schedule
    
    def get_teacher_workload_report(self) -> Dict:
        """Generate teacher workload distribution report"""
        report = {}
        
        for teacher in self.teachers.values():
            utilization = (teacher.current_load / teacher.max_credits) * 100 if teacher.max_credits > 0 else 0
            report[teacher.name] = {
                "current_load": teacher.current_load,
                "max_capacity": teacher.max_credits,
                "utilization_percent": round(utilization, 2),
                "subjects_taught": len(set(entry.subject.name for entries in self.schedule.values() 
                                         for entry in entries if entry.teacher.teacher_id == teacher.teacher_id))
            }
        
        return report
    
    def validate_schedule(self) -> List[str]:
        """Validate the generated schedule for conflicts and issues"""
        issues = []
        
        # Check for teacher conflicts
        for teacher_id, occupied_slots in self.teacher_schedule.items():
            if len(occupied_slots) != len(set(occupied_slots)):
                issues.append(f"Teacher {self.teachers[teacher_id].name} has overlapping schedules")
        
        # Check for class conflicts
        for class_id, entries in self.schedule.items():
            time_slots = [entry.time_slot for entry in entries]
            if len(time_slots) != len(set(time_slots)):
                issues.append(f"Class {self.classes[class_id].name} has overlapping schedules")
        
        # Check teacher workload
        for teacher in self.teachers.values():
            if teacher.current_load > teacher.max_credits:
                issues.append(f"Teacher {teacher.name} is overloaded: {teacher.current_load}/{teacher.max_credits}")
        
        return issues

def generate_smart_timetable(user_id: str) -> Dict:
    """
    Main function to generate intelligent timetable
    
    Args:
        user_id: User identifier
        
    Returns:
        Dictionary containing generated timetable data
        
    Raises:
        Exception: If timetable generation fails
    """
    scheduler = SmartScheduler()
    
    try:
        # Generate the timetable
        result = scheduler.generate_timetable(user_id)
        
        # Validate for issues
        issues = scheduler.validate_schedule()
        if issues:
            logger.warning(f"Schedule validation issues: {issues}")
        
        # Get workload report
        workload_report = scheduler.get_teacher_workload_report()
        logger.info(f"Teacher workload report: {workload_report}")
        
        # Store in database
        timetable_row = {
            "timetable_id": str(uuid.uuid4()),
            "User_id": user_id,
            "details": result
        }
        
        # Clear existing timetables for this user
        supabase_admin.table("Timetables_Clg").delete().eq("User_id", user_id).execute()
        
        # Insert new timetable
        insert_result = supabase_admin.table("Timetables_Clg").insert(timetable_row).execute()
        
        logger.info(f"Successfully generated and stored timetable for user {user_id}")
        logger.info(f"Classes scheduled: {len(result['classes'])}")
        logger.info(f"Total schedule entries: {sum(len(cls['schedule']) for cls in result['classes'])}")
        
        return insert_result.data
        
    except Exception as e:
        logger.error(f"Error in timetable generation: {str(e)}")
        raise Exception(f"Failed to generate timetable: {str(e)}")

# Test function
if __name__ == "__main__":
    # Test with a sample user ID
    test_user_id = "088f7a98-e77c-45e0-9a65-859959a2434d"
    try:
        result = generate_smart_timetable(test_user_id)
        print("✅ Timetable generated successfully!")
        print(f"Result: {result}")
    except Exception as e:
        print(f"❌ Error: {e}")












# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import FileResponse
# from fastapi.staticfiles import StaticFiles

# from routes import users, auth
# from schemas import Faculty, Course, CourseUpload , FacultyUpload , SubjectUpload , Subject
# from database import supabase_admin  # ✅ import supabase client here
# from typing import List
# from pydantic import BaseModel
# from supabase import create_client, Client
# from solver import generate_timetable  # Import the old timetable generation function
# from scheduler import generate_smart_timetable, SmartScheduler  # Import the new smart scheduler

# import uuid
# from solver import generate_timetable
# from scheduler import generate_smart_timetable, SmartScheduler
# from scheduler import generate_smart_timetable, SmartScheduler
# import logging

# # Set up logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = FastAPI()

# # ✅ CORS setup (moved here and expanded)
# origins = [
#     "http://localhost:3000",
#     "http://localhost:5173",
#     "https://the-pheonix.vercel.app",  # Vercel frontend
#     "https://nonmeasurably-ethnogenic-kaylin.ngrok-free.dev",  # Ngrok backend URL
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,       # Testing ke liye chahe to ["*"] bhi kar sakta hai
#     allow_credentials=True,
#     allow_methods=["*"],         # GET, POST, OPTIONS, etc.
#     allow_headers=["*"],         # Content-Type, Authorization, etc.
# )

# # Request models for generator endpoints
# class GeneratorRequest(BaseModel):
#     user_id: str
#     generator_config: dict = {}

# # Routers
# app.include_router(users.router, prefix="/users", tags=["Users"])
# app.include_router(auth.router, prefix="/auth", tags=["Auth"])


# db: List[SubjectUpload] = []

# @app.get("/")
# def home():
#     return {"message": "Backend is running!"}

# @app.post("/setup_sample_data")
# async def setup_sample_data(request: dict):
#     """Set up sample data for testing the timetable generator"""
#     user_id = request.get("user_id", "088f7a98-e77c-45e0-9a65-859959a2434d")
    
#     try:
#         # Sample subjects
#         sample_subjects = [
#             {"Subject_ID": str(uuid.uuid4()), "Subject_Name": "Mathematics", "Subject_Code": "MATH101", "Department": "Science", "Credits": 4, "Subject_Type": "Theory"},
#             {"Subject_ID": str(uuid.uuid4()), "Subject_Name": "Physics", "Subject_Code": "PHY101", "Department": "Science", "Credits": 4, "Subject_Type": "Theory"},
#             {"Subject_ID": str(uuid.uuid4()), "Subject_Name": "Chemistry Lab", "Subject_Code": "CHEM101L", "Department": "Science", "Credits": 2, "Subject_Type": "Lab"},
#             {"Subject_ID": str(uuid.uuid4()), "Subject_Name": "English Literature", "Subject_Code": "ENG101", "Department": "Arts", "Credits": 3, "Subject_Type": "Theory"},
#             {"Subject_ID": str(uuid.uuid4()), "Subject_Name": "Computer Science", "Subject_Code": "CS101", "Department": "Technology", "Credits": 4, "Subject_Type": "Theory"},
#             {"Subject_ID": str(uuid.uuid4()), "Subject_Name": "Programming Lab", "Subject_Code": "CS101L", "Department": "Technology", "Credits": 2, "Subject_Type": "Lab"}
#         ]
        
#         # Sample faculty
#         sample_faculty = [
#             {"Teacher_id": str(uuid.uuid4()), "name": "Dr. John Smith", "department": "Science", "course_type": "Theory", "max_credits": 20, "primary_subject": "Mathematics", "other_subject": "Physics"},
#             {"Teacher_id": str(uuid.uuid4()), "name": "Prof. Sarah Johnson", "department": "Science", "course_type": "Lab", "max_credits": 18, "primary_subject": "Chemistry Lab", "other_subject": "Physics"},
#             {"Teacher_id": str(uuid.uuid4()), "name": "Dr. Michael Brown", "department": "Arts", "course_type": "Theory", "max_credits": 22, "primary_subject": "English Literature", "other_subject": ""},
#             {"Teacher_id": str(uuid.uuid4()), "name": "Prof. Emily Davis", "department": "Technology", "course_type": "Theory", "max_credits": 20, "primary_subject": "Computer Science", "other_subject": "Programming Lab"},
#             {"Teacher_id": str(uuid.uuid4()), "name": "Dr. Robert Wilson", "department": "Technology", "course_type": "Lab", "max_credits": 16, "primary_subject": "Programming Lab", "other_subject": "Computer Science"}
#         ]
        
#         # Sample classes
#         sample_classes = [
#             {"Course_ID": str(uuid.uuid4()), "Course_Code": "CSE-1A", "Course_Name": "Computer Science Engineering - 1st Year A", "department": "Technology", "Credits": 24, "Course_Type": "Engineering"},
#             {"Course_ID": str(uuid.uuid4()), "Course_Code": "CSE-1B", "Course_Name": "Computer Science Engineering - 1st Year B", "department": "Technology", "Credits": 24, "Course_Type": "Engineering"},
#             {"Course_ID": str(uuid.uuid4()), "Course_Code": "ENG-1A", "Course_Name": "English Literature - 1st Year", "department": "Arts", "Credits": 18, "Course_Type": "Arts"}
#         ]
        
#         # Clear existing data
#         supabase_admin.table("Subjects_Clg").delete().eq("User_id", user_id).execute()
#         supabase_admin.table("Faculty_Clg").delete().eq("User_id", user_id).execute()
#         supabase_admin.table("Classes_Clg").delete().eq("User_id", user_id).execute()
#         supabase_admin.table("Timetables_Clg").delete().eq("User_id", user_id).execute()
        
#         # Insert sample data
#         subjects_row = {
#             "subject_id": str(uuid.uuid4()),
#             "User_id": user_id,
#             "details": {"subjects": sample_subjects}
#         }
#         supabase_admin.table("Subjects_Clg").insert(subjects_row).execute()
        
#         faculty_row = {
#             "faculty_id": str(uuid.uuid4()),
#             "User_id": user_id,
#             "details": {"teachers": sample_faculty}
#         }
#         supabase_admin.table("Faculty_Clg").insert(faculty_row).execute()
        
#         classes_row = {
#             "class_id": str(uuid.uuid4()),
#             "User_id": user_id,
#             "details": {"courses": sample_classes}
#         }
#         supabase_admin.table("Classes_Clg").insert(classes_row).execute()
        
#         return {
#             "status": "success", 
#             "message": "Sample data created successfully",
#             "data": {
#                 "subjects": len(sample_subjects),
#                 "teachers": len(sample_faculty),
#                 "classes": len(sample_classes)
#             }
#         }
        
#     except Exception as e:
#         return {"status": "error", "message": f"Failed to create sample data: {str(e)}"}

# @app.get("/test")
# async def test_page():
#     return FileResponse("../test_generator.html")


# # -------------------------------
# # Upload Faculty
# # -------------------------------
# @app.post("/upload_faculty")
# async def upload_faculty(payload: FacultyUpload):
#     try:
#         teachers = []
#         for f in payload.details:   # <-- changed from payload.data
#             teachers.append({
#                 "Teacher_id": str(uuid.uuid4()),  # auto-generate
#                 "name": f.name,
#                 "department": f.department,
#                 "course_type": f.course_type,
#                 "max_credits": f.max_credits,
#                 "primary_subject": f.primary_subject,
#                 "other_subject": f.other_subject
#             })

#         # jsonb structure
#         details = {"teachers": teachers}

#         formatted = {
#             "faculty_id": str(uuid.uuid4()),  # row id
#             "User_id": payload.user_id,       # use user_id from payload
#             "details": details
#         }

#         result = supabase_admin.table("Faculty_Clg").insert(formatted).execute()

#         if not result.data:
#             raise HTTPException(status_code=400, detail="Insert failed!")

#         return {"status": "success", "inserted_teachers": len(teachers)}

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # -------------------------------
# # Upload Courses
# # -------------------------------
# @app.post("/upload_courses")
# async def upload_courses(payload: CourseUpload):
#     try:
#         courses_list = []
#         for c in payload.details:
#             courses_list.append({
#                 "Course_ID": str(uuid.uuid4()),  # auto-generated unique ID
#                 "Course_Code": c.Course_Code,
#                 "Course_Name": c.Course_Name,
#                 "department": c.department,
#                 "Credits": c.Credits,
#                 "Course_Type": c.Course_Type
#             })

#         # JSONB structure
#         formatted = {
#             "class_id": str(uuid.uuid4()),  # correct column name
#             "User_id": payload.user_id,
#             "details": {"courses": courses_list}
#         }

#         result = supabase_admin.table("Classes_Clg").insert(formatted).execute()

#         if not result.data:
#             raise HTTPException(status_code=400, detail="Insert failed!")

#         return {"status": "success", "inserted_courses": len(courses_list)}

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # -------------------------------
# # Upload Subjects
# # -------------------------------
# @app.post("/upload_subjects")
# async def upload_subjects(payload: SubjectUpload):
#     try:
#         subjects_list = []
#         for s in payload.details:
#             subjects_list.append({
#                 "Subject_ID": str(uuid.uuid4()),   # unique ID per subject
#                 "Subject_Code": s.Subject_Code,
#                 "Subject_Name": s.Subject_Name,
#                 "Department": s.Department,
#                 "Credits": s.Credits,
#                 "Subject_Type": s.Subject_Type
#             })

#         # JSONB structure (same style as courses/faculty)
#         formatted = {
#             "subject_id": str(uuid.uuid4()),  # row ID for Subjects_Clg table
#             "User_id": payload.user_id,
#             "details": {"subjects": subjects_list}
#         }

#         result = supabase_admin.table("Subjects_Clg").insert(formatted).execute()

#         if not result.data:
#             raise HTTPException(status_code=400, detail="Insert failed!")

#         return {"status": "success", "inserted_subjects": len(subjects_list)}

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    
# # --- Endpoints ---
# @app.get("/subjects")
# def get_subjects():
#     # NOTE: yaha 'supabase' variable defined hona chahiye database.py me
#     res = supabase.table("subjects").select("*").execute()
#     if res.error:
#         raise HTTPException(400, res.error.message)
#     return res.data


# @app.post("/subjects")
# def add_subject(subject: Subject):
#     res = supabase.table("subjects").insert(subject.dict(exclude_unset=True)).execute()
#     if res.error:
#         raise HTTPException(400, res.error.message)
#     return res.data[0]


# @app.delete("/subjects/{subject_id}")
# def delete_subject(subject_id: str):
#     res = supabase.table("subjects").delete().eq("id", subject_id).execute()
#     if res.error:
#         raise HTTPException(400, res.error.message)
#     return {"message": "Deleted successfully"}

# # -------------------------------
# # Generate Timetable
# # -------------------------------
# class TimetableGenerateRequest(BaseModel):
#     user_id: str

# @app.post("/generate_timetable")
# async def generate_timetable_endpoint(request: TimetableGenerateRequest):
#     try:
#         scheduler = SmartScheduler()
#         if not scheduler.load_data_from_supabase(request.user_id):
#             raise Exception("Failed to load data from database")

#         result = scheduler.generate_timetable(request.user_id)
#         return {
#             "status": "success",
#             "message": "Timetable generated successfully with smart scheduling",
#             "data": result,
#         }
#     except Exception as e:
#         error_message = str(e)
#         print(f"❌ Smart Timetable generation error: {error_message}")

#         if "No subjects found" in error_message:
#             return {"status": "error", "message": "Please upload subject data before generating timetable."}
#         elif "No courses found" in error_message:
#             return {"status": "error", "message": "Please upload course data before generating timetable."}
#         elif "No faculty found" in error_message:
#             return {"status": "error", "message": "Please upload faculty data before generating timetable."}
#         else:
#             return {"status": "error", "message": f"Error generating timetable: {error_message}"}

# # Enhanced Generator Endpoints
# class GeneratorConfig(BaseModel):
#     user_id: str
#     generation_type: str = "smart"  # "smart", "legacy", "custom"
#     preferences: dict = {}
#     constraints: dict = {}

# class CustomGenerationRequest(BaseModel):
#     user_id: str
#     selected_classes: List[str] = []
#     time_preferences: dict = {}
#     teacher_preferences: dict = {}
#     subject_priorities: dict = {}
#     avoid_conflicts: bool = True
#     max_daily_hours: int = 6
#     break_duration: int = 30
#     lunch_break: bool = True

# @app.post("/generator/config")
# async def get_generator_config(request: dict):
#     """Get available configuration options for timetable generation"""
#     user_id = request.get("user_id")
    
#     try:
#         # Get available data for configuration
#         subjects_result = supabase_admin.table("Subjects_Clg").select("*").eq("User_id", user_id).execute()
#         faculty_result = supabase_admin.table("Faculty_Clg").select("*").eq("User_id", user_id).execute()
#         classes_result = supabase_admin.table("Classes_Clg").select("*").eq("User_id", user_id).execute()
        
#         # Extract configuration options
#         config = {
#             "available_subjects": [],
#             "available_teachers": [],
#             "available_classes": [],
#             "time_slots": [
#                 {"period": 1, "time": "09:00-10:00"},
#                 {"period": 2, "time": "10:00-11:00"},
#                 {"period": 3, "time": "11:30-12:30"},
#                 {"period": 4, "time": "12:30-13:30"},
#                 {"period": 5, "time": "14:30-15:30"},
#                 {"period": 6, "time": "15:30-16:30"}
#             ],
#             "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
#         }
        
#         # Process subjects
#         if subjects_result.data:
#             for subject_row in subjects_result.data:
#                 if "subjects" in subject_row.get("details", {}):
#                     for subject in subject_row["details"]["subjects"]:
#                         config["available_subjects"].append({
#                             "id": subject.get("Subject_ID"),
#                             "name": subject.get("Subject_Name"),
#                             "code": subject.get("Subject_Code"),
#                             "credits": subject.get("Credits"),
#                             "type": subject.get("Subject_Type"),
#                             "department": subject.get("Department")
#                         })
        
#         # Process faculty
#         if faculty_result.data:
#             for faculty_row in faculty_result.data:
#                 if "teachers" in faculty_row.get("details", {}):
#                     for teacher in faculty_row["details"]["teachers"]:
#                         config["available_teachers"].append({
#                             "id": teacher.get("Teacher_id"),
#                             "name": teacher.get("name"),
#                             "department": teacher.get("department"),
#                             "max_credits": teacher.get("max_credits"),
#                             "primary_subject": teacher.get("primary_subject"),
#                             "other_subject": teacher.get("other_subject")
#                         })
        
#         # Process classes
#         if classes_result.data:
#             for class_row in classes_result.data:
#                 if "courses" in class_row.get("details", {}):
#                     for course in class_row["details"]["courses"]:
#                         config["available_classes"].append({
#                             "id": course.get("Course_ID"),
#                             "name": course.get("Course_Name"),
#                             "code": course.get("Course_Code"),
#                             "department": course.get("department"),
#                             "credits": course.get("Credits")
#                         })
        
#         return {"status": "success", "config": config}
        
#     except Exception as e:
#         return {"status": "error", "message": str(e)}

# @app.post("/generator/custom")
# async def generate_custom_timetable(request: CustomGenerationRequest):
#     """Generate timetable with custom preferences and constraints"""
#     try:
#         # For now, use the smart scheduler with custom preferences
#         # In the future, this could be extended to handle more granular customization
        
#         # Load the scheduler with custom constraints
#         from scheduler import SmartScheduler
#         scheduler = SmartScheduler()
        
#         # Load data from database
#         if not scheduler.load_data_from_supabase(request.user_id):
#             raise Exception("Failed to load data from database")
        
#         # Apply custom preferences (basic implementation)
#         if request.selected_classes:
#             # Filter classes based on selection
#             filtered_classes = {k: v for k, v in scheduler.classes.items() 
#                               if v.name in request.selected_classes or v.class_id in request.selected_classes}
#             scheduler.classes = filtered_classes
        
#         # Generate timetable
#         result = scheduler.generate_timetable(request.user_id)
        
#         # Store in database with custom metadata
#         timetable_row = {
#             "timetable_id": str(uuid.uuid4()),
#             "User_id": request.user_id,
#             "details": result
#         }
        
#         # Clear existing and insert new
#         supabase_admin.table("Timetables_Clg").delete().eq("User_id", request.user_id).execute()
#         insert_result = supabase_admin.table("Timetables_Clg").insert(timetable_row).execute()
        
#         return {"status": "success", "message": "Custom timetable generated successfully", "data": insert_result.data}
        
#     except Exception as e:
#         return {"status": "error", "message": f"Error generating custom timetable: {str(e)}"}

# @app.post("/generator/batch")
# async def generate_batch_timetables(request: dict):
#     """Generate multiple timetable variations for comparison"""
#     user_id = request.get("user_id")
#     variations = request.get("variations", 3)
    
#     try:
#         timetables = []
        
#         for i in range(variations):
#             # Generate with slight randomization
#             from scheduler import SmartScheduler
#             scheduler = SmartScheduler()
            
#             if not scheduler.load_data_from_supabase(user_id):
#                 continue
                
#             result = scheduler.generate_timetable(user_id)
#             workload_report = scheduler.get_teacher_workload_report()
            
#             timetables.append({
#                 "variation": i + 1,
#                 "timetable": result,
#                 "teacher_workload": workload_report,
#                 "score": sum(report["utilization_percent"] for report in workload_report.values()) / len(workload_report)
#             })
        
#         # Sort by score (best utilization)
#         timetables.sort(key=lambda x: abs(x["score"] - 75))  # Target 75% utilization
        
#         return {"status": "success", "variations": timetables}
        
#     except Exception as e:
#         return {"status": "error", "message": str(e)}

# @app.get("/get_timetable/{user_id}")
# async def get_timetable(user_id: str):
#     try:
#         result = supabase_admin.table("Timetables_Clg").select("*").eq("User_id", user_id).execute()
        
#         if not result.data:
#             return {"status": "no_data", "message": "No timetable found for this user", "data": []}
        
#         # Get the most recent timetable
#         timetable_record = result.data[0]
#         timetable_details = timetable_record.get("details", {})
        
#         # Convert the new JSONB structure to the format expected by frontend
#         converted_data = []
#         if "classes" in timetable_details:
#             for class_info in timetable_details["classes"]:
#                 for schedule_entry in class_info.get("schedule", []):
#                     converted_data.append({
#                         "class": class_info["class_name"],
#                         "day": schedule_entry["day"],
#                         "period": schedule_entry["period"],
#                         "subject": schedule_entry["subject"],
#                         "teacher": schedule_entry["teacher"]
#                     })
        
#         return {"status": "success", "data": converted_data}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error fetching timetable: {str(e)}")

# # -------------------------------
# # Enhanced Scheduler Analytics
# # -------------------------------
# @app.get("/scheduler/analytics/{user_id}")
# async def get_scheduler_analytics(user_id: str):
#     """Get detailed analytics about the generated schedule"""
#     try:
#         result = supabase_admin.table("Timetimetables_Clg").select("*").eq("User_id", user_id).execute()
        
#         if not result.data:
#             return {"status": "no_data", "message": "No timetable found for this user"}
        
#         timetable_record = result.data[0]
#         metadata = timetable_record.get("metadata", {})
        
#         analytics = {
#             "generation_method": metadata.get("generation_method", "unknown"),
#             "teacher_workload": metadata.get("teacher_workload", {}),
#             "validation_issues": metadata.get("validation_issues", []),
#             "schedule_stats": {},
#             "efficiency_metrics": {}
#         }
        
#         # Calculate basic schedule statistics
#         timetable_details = timetable_record.get("details", {})
#         if "classes" in timetable_details:
#             total_periods = 0
#             total_subjects = set()
#             total_teachers = set()
            
#             for class_info in timetable_details["classes"]:
#                 schedule = class_info.get("schedule", [])
#                 total_periods += len(schedule)
                
#                 for entry in schedule:
#                     total_subjects.add(entry.get("subject", ""))
#                     total_teachers.add(entry.get("teacher", ""))
            
#             analytics["schedule_stats"] = {
#                 "total_classes": len(timetable_details["classes"]),
#                 "total_periods_scheduled": total_periods,
#                 "unique_subjects": len(total_subjects),
#                 "unique_teachers": len(total_teachers),
#                 "average_periods_per_class": round(total_periods / len(timetable_details["classes"]), 2) if timetable_details["classes"] else 0
#             }
        
#         return {"status": "success", "data": analytics}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error fetching analytics: {str(e)}")

# @app.post("/scheduler/optimize/{user_id}")
# async def optimize_existing_schedule(user_id: str):
#     """Re-optimize an existing schedule to improve efficiency"""
#     try:
#         from scheduler import SmartScheduler
        
#         # Create new scheduler instance
#         scheduler = SmartScheduler()
        
#         # Load data and regenerate with optimization
#         result = scheduler.generate_timetable(user_id)
        
#         return {"status": "success", "message": "Schedule optimized successfully", "data": result}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error optimizing schedule: {str(e)}")

# @app.get("/scheduler/conflicts/{user_id}")
# async def check_schedule_conflicts(user_id: str):
#     """Check for conflicts in the current schedule"""
#     try:
#         from scheduler import SmartScheduler
        
#         scheduler = SmartScheduler()
#         if scheduler.load_data_from_supabase(user_id):
            
#             # Load existing schedule
#             result = supabase_admin.table("Timetables_Clg").select("*").eq("User_id", user_id).execute()
#             if result.data:
#                 # Parse existing schedule and validate
#                 conflicts = scheduler.validate_schedule()
#                 return {"status": "success", "conflicts": conflicts, "has_conflicts": len(conflicts) > 0}
#             else:
#                 return {"status": "no_data", "message": "No schedule found to check"}
#         else:
#             return {"status": "error", "message": "Could not load scheduling data"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error checking conflicts: {str(e)}")

# @app.get("/scheduler/teacher-workload/{user_id}")
# async def get_teacher_workload_report(user_id: str):
#     """Get detailed teacher workload distribution report"""
#     try:
#         result = supabase_admin.table("Timetables_Clg").select("*").eq("User_id", user_id).execute()
        
#         if not result.data:
#             return {"status": "no_data", "message": "No timetable found for this user"}
        
#         timetable_record = result.data[0]
#         metadata = timetable_record.get("metadata", {})
#         workload_report = metadata.get("teacher_workload", {})
        
#         # Enhanced workload analysis
#         enhanced_report = {}
#         for teacher_name, stats in workload_report.items():
#             enhanced_report[teacher_name] = {
#                 **stats,
#                 "workload_status": "overloaded" if stats.get("utilization_percent", 0) > 100 else \
#                                    "optimal" if 80 <= stats.get("utilization_percent", 0) <= 100 else \
#                                    "underutilized" if stats.get("utilization_percent", 0) < 50 else "good"
#             }
        
#         return {"status": "success", "data": enhanced_report}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error fetching workload report: {str(e)}")

# @app.post("/debug/teacher-subject-mapping")
# async def debug_teacher_subject_mapping(request: GeneratorRequest):
#     """Debug endpoint to check teacher-subject compatibility"""
#     try:
#         scheduler = SmartScheduler()
#         if not scheduler.load_data_from_supabase(request.user_id):
#             raise HTTPException(status_code=500, detail="Failed to load data")
        
#         mapping_info = {
#             "total_teachers": len(scheduler.teachers),
#             "total_subjects": len(scheduler.subjects),
#             "teacher_subject_compatibility": {}
#         }
        
#         # Check each teacher's compatibility with each subject
#         for teacher_id, teacher in scheduler.teachers.items():
#             compatible_subjects = []
#             for subject_id, subject in scheduler.subjects.items():
#                 if teacher.can_teach(subject):
#                     compatible_subjects.append({
#                         "subject_name": subject.name,
#                         "subject_department": subject.department,
#                         "reason": "primary" if subject.name == teacher.primary_subject 
#                                 else "secondary" if subject.name in teacher.other_subjects 
#                                 else "department_match"
#                     })
            
#             mapping_info["teacher_subject_compatibility"][teacher.name] = {
#                 "teacher_id": teacher_id,
#                 "primary_subject": teacher.primary_subject,
#                 "other_subjects": teacher.other_subjects,
#                 "department": teacher.department,
#                 "compatible_subjects": compatible_subjects,
#                 "can_teach_count": len(compatible_subjects)
#             }
        
#         # Check subjects that have no compatible teachers
#         orphaned_subjects = []
#         for subject_id, subject in scheduler.subjects.items():
#             has_teacher = any(teacher.can_teach(subject) for teacher in scheduler.teachers.values())
#             if not has_teacher:
#                 orphaned_subjects.append({
#                     "subject_name": subject.name,
#                     "department": subject.department,
#                     "subject_code": subject.code
#                 })
        
#         mapping_info["orphaned_subjects"] = orphaned_subjects
        
#         return mapping_info
        
#     except Exception as e:
#         logger.error(f"Error in debug mapping: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/clear_user_data")
# async def clear_user_data(request: dict):
#     """Clear all user uploaded data (Faculty, Subjects, Classes, Timetables)"""
#     try:
#         user_id = request.get("user_id")
#         if not user_id:
#             raise HTTPException(status_code=400, detail="User ID is required")
        
#         logger.info(f"Clearing all data for user: {user_id}")
        
#         # Clear all user data from all tables
#         tables_to_clear = ["Faculty_Clg", "Subjects_Clg", "Classes_Clg", "Timetables_Clg"]
#         cleared_counts = {}
        
#         for table in tables_to_clear:
#             try:
#                 # Get count before deletion
#                 count_result = supabase_admin.table(table).select("*", count="exact").eq("User_id", user_id).execute()
#                 before_count = count_result.count or 0
                
#                 # Delete all records for this user
#                 delete_result = supabase_admin.table(table).delete().eq("User_id", user_id).execute()
                
#                 cleared_counts[table] = before_count
#                 logger.info(f"Cleared {before_count} records from {table}")
                
#             except Exception as table_error:
#                 logger.error(f"Error clearing {table}: {str(table_error)}")
#                 cleared_counts[table] = f"Error: {str(table_error)}"
        
#         return {
#             "status": "success", 
#             "message": "User data cleared successfully",
#             "cleared_counts": cleared_counts
#         }
        
#     except Exception as e:
#         logger.error(f"Error clearing user data: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))
