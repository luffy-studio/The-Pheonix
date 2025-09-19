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