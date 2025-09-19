from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from routes import users, auth
from schemas import Faculty, Course, CourseUpload , FacultyUpload , SubjectUpload , Subject
from database import supabase_admin  # ✅ import supabase client here
from typing import List
from pydantic import BaseModel
from supabase import create_client, Client
from solver import generate_timetable  # Import the old timetable generation function
from scheduler import generate_smart_timetable, SmartScheduler  # Import the new smart scheduler

import uuid
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Request models for generator endpoints
class GeneratorRequest(BaseModel):
    user_id: str
    generator_config: dict = {}

# Routers
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])


db: List[SubjectUpload] = []

@app.get("/")
def home():
    return {"message": "Backend is running!"}

@app.post("/setup_sample_data")
async def setup_sample_data(request: dict):
    """Set up sample data for testing the timetable generator"""
    user_id = request.get("user_id", "088f7a98-e77c-45e0-9a65-859959a2434d")
    
    try:
        # Sample subjects
        sample_subjects = [
            {"Subject_ID": str(uuid.uuid4()), "Subject_Name": "Mathematics", "Subject_Code": "MATH101", "Department": "Science", "Credits": 4, "Subject_Type": "Theory"},
            {"Subject_ID": str(uuid.uuid4()), "Subject_Name": "Physics", "Subject_Code": "PHY101", "Department": "Science", "Credits": 4, "Subject_Type": "Theory"},
            {"Subject_ID": str(uuid.uuid4()), "Subject_Name": "Chemistry Lab", "Subject_Code": "CHEM101L", "Department": "Science", "Credits": 2, "Subject_Type": "Lab"},
            {"Subject_ID": str(uuid.uuid4()), "Subject_Name": "English Literature", "Subject_Code": "ENG101", "Department": "Arts", "Credits": 3, "Subject_Type": "Theory"},
            {"Subject_ID": str(uuid.uuid4()), "Subject_Name": "Computer Science", "Subject_Code": "CS101", "Department": "Technology", "Credits": 4, "Subject_Type": "Theory"},
            {"Subject_ID": str(uuid.uuid4()), "Subject_Name": "Programming Lab", "Subject_Code": "CS101L", "Department": "Technology", "Credits": 2, "Subject_Type": "Lab"}
        ]
        
        # Sample faculty
        sample_faculty = [
            {"Teacher_id": str(uuid.uuid4()), "name": "Dr. John Smith", "department": "Science", "course_type": "Theory", "max_credits": 20, "primary_subject": "Mathematics", "other_subject": "Physics"},
            {"Teacher_id": str(uuid.uuid4()), "name": "Prof. Sarah Johnson", "department": "Science", "course_type": "Lab", "max_credits": 18, "primary_subject": "Chemistry Lab", "other_subject": "Physics"},
            {"Teacher_id": str(uuid.uuid4()), "name": "Dr. Michael Brown", "department": "Arts", "course_type": "Theory", "max_credits": 22, "primary_subject": "English Literature", "other_subject": ""},
            {"Teacher_id": str(uuid.uuid4()), "name": "Prof. Emily Davis", "department": "Technology", "course_type": "Theory", "max_credits": 20, "primary_subject": "Computer Science", "other_subject": "Programming Lab"},
            {"Teacher_id": str(uuid.uuid4()), "name": "Dr. Robert Wilson", "department": "Technology", "course_type": "Lab", "max_credits": 16, "primary_subject": "Programming Lab", "other_subject": "Computer Science"}
        ]
        
        # Sample classes
        sample_classes = [
            {"Course_ID": str(uuid.uuid4()), "Course_Code": "CSE-1A", "Course_Name": "Computer Science Engineering - 1st Year A", "department": "Technology", "Credits": 24, "Course_Type": "Engineering"},
            {"Course_ID": str(uuid.uuid4()), "Course_Code": "CSE-1B", "Course_Name": "Computer Science Engineering - 1st Year B", "department": "Technology", "Credits": 24, "Course_Type": "Engineering"},
            {"Course_ID": str(uuid.uuid4()), "Course_Code": "ENG-1A", "Course_Name": "English Literature - 1st Year", "department": "Arts", "Credits": 18, "Course_Type": "Arts"}
        ]
        
        # Clear existing data
        supabase_admin.table("Subjects_Clg").delete().eq("User_id", user_id).execute()
        supabase_admin.table("Faculty_Clg").delete().eq("User_id", user_id).execute()
        supabase_admin.table("Classes_Clg").delete().eq("User_id", user_id).execute()
        supabase_admin.table("Timetables_Clg").delete().eq("User_id", user_id).execute()
        
        # Insert sample data
        subjects_row = {
            "subject_id": str(uuid.uuid4()),
            "User_id": user_id,
            "details": {"subjects": sample_subjects}
        }
        supabase_admin.table("Subjects_Clg").insert(subjects_row).execute()
        
        faculty_row = {
            "faculty_id": str(uuid.uuid4()),
            "User_id": user_id,
            "details": {"teachers": sample_faculty}
        }
        supabase_admin.table("Faculty_Clg").insert(faculty_row).execute()
        
        classes_row = {
            "class_id": str(uuid.uuid4()),
            "User_id": user_id,
            "details": {"courses": sample_classes}
        }
        supabase_admin.table("Classes_Clg").insert(classes_row).execute()
        
        return {
            "status": "success", 
            "message": "Sample data created successfully",
            "data": {
                "subjects": len(sample_subjects),
                "teachers": len(sample_faculty),
                "classes": len(sample_classes)
            }
        }
        
    except Exception as e:
        return {"status": "error", "message": f"Failed to create sample data: {str(e)}"}

@app.get("/test")
async def test_page():
    return FileResponse("../test_generator.html")

# CORS setup
origins = ["http://localhost:3000"]  
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -------------------------------
# Upload Faculty
# -------------------------------
@app.post("/upload_faculty")
async def upload_faculty(payload: FacultyUpload):
    try:
        teachers = []
        for f in payload.details:   # <-- changed from payload.data
            teachers.append({
                "Teacher_id": str(uuid.uuid4()),  # auto-generate
                "name": f.name,
                "department": f.department,
                "course_type": f.course_type,
                "max_credits": f.max_credits,
                "primary_subject": f.primary_subject,
                "other_subject": f.other_subject
            })

        # jsonb structure
        details = {"teachers": teachers}

        formatted = {
            "faculty_id": str(uuid.uuid4()),  # row id
            "User_id": payload.user_id,       # use user_id from payload
            "details": details
        }

        result = supabase_admin.table("Faculty_Clg").insert(formatted).execute()

        if not result.data:
            raise HTTPException(status_code=400, detail="Insert failed!")

        return {"status": "success", "inserted_teachers": len(teachers)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------------
# Upload Courses
# -------------------------------
@app.post("/upload_courses")
async def upload_courses(payload: CourseUpload):
    try:
        courses_list = []
        for c in payload.details:
            courses_list.append({
                "Course_ID": str(uuid.uuid4()),  # auto-generated unique ID
                "Course_Code": c.Course_Code,
                "Course_Name": c.Course_Name,
                "department": c.department,
                "Credits": c.Credits,
                "Course_Type": c.Course_Type
            })

        # JSONB structure
        formatted = {
            "class_id": str(uuid.uuid4()),  # correct column name
            "User_id": payload.user_id,
            "details": {"courses": courses_list}
        }

        result = supabase_admin.table("Classes_Clg").insert(formatted).execute()

        if not result.data:
            raise HTTPException(status_code=400, detail="Insert failed!")

        return {"status": "success", "inserted_courses": len(courses_list)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------------
# Upload Subjects
# -------------------------------
@app.post("/upload_subjects")
async def upload_subjects(payload: SubjectUpload):
    try:
        subjects_list = []
        for s in payload.details:
            subjects_list.append({
                "Subject_ID": str(uuid.uuid4()),   # unique ID per subject
                "Subject_Code": s.Subject_Code,
                "Subject_Name": s.Subject_Name,
                "Department": s.Department,
                "Credits": s.Credits,
                "Subject_Type": s.Subject_Type
            })

        # JSONB structure (same style as courses/faculty)
        formatted = {
            "subject_id": str(uuid.uuid4()),  # row ID for Subjects_Clg table
            "User_id": payload.user_id,
            "details": {"subjects": subjects_list}
        }

        result = supabase_admin.table("Subjects_Clg").insert(formatted).execute()

        if not result.data:
            raise HTTPException(status_code=400, detail="Insert failed!")

        return {"status": "success", "inserted_subjects": len(subjects_list)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
 # --- Endpoints ---
@app.get("/subjects")
def get_subjects():
    res = supabase.table("subjects").select("*").execute()
    if res.error:
        raise HTTPException(400, res.error.message)
    return res.data


@app.post("/subjects")
def add_subject(subject: Subject):
    res = supabase.table("subjects").insert(subject.dict(exclude_unset=True)).execute()
    if res.error:
        raise HTTPException(400, res.error.message)
    return res.data[0]


@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: str):
    res = supabase.table("subjects").delete().eq("id", subject_id).execute()
    if res.error:
        raise HTTPException(400, res.error.message)
    return {"message": "Deleted successfully"}

# -------------------------------
# Generate Timetable
# -------------------------------
class TimetableGenerateRequest(BaseModel):
    user_id: str

@app.post("/generate_timetable")
async def generate_timetable_endpoint(request: TimetableGenerateRequest):
    try:
        # Call the new smart scheduler function
        result = generate_smart_timetable(request.user_id)
        return {"status": "success", "message": "Timetable generated successfully with smart scheduling", "data": result}
    except Exception as e:
        error_message = str(e)
        print(f"❌ Smart Timetable generation error: {error_message}")
        
        # Provide more specific error messages
        if "No subjects found" in error_message:
            return {"status": "error", "message": "Please upload subject data before generating timetable."}
        elif "No courses found" in error_message:
            return {"status": "error", "message": "Please upload course data before generating timetable."}
        elif "No faculty found" in error_message:
            return {"status": "error", "message": "Please upload faculty data before generating timetable."}
        else:
            return {"status": "error", "message": f"Error generating timetable: {error_message}"}

@app.post("/generate_timetable_legacy")
async def generate_timetable_legacy_endpoint(request: TimetableGenerateRequest):
    """Legacy timetable generation endpoint for fallback"""
    try:
        # Call the old solver function
        result = generate_timetable(request.user_id)
        return {"status": "success", "message": "Timetable generated successfully (legacy method)", "data": result}
    except Exception as e:
        error_message = str(e)
        print(f"❌ Legacy Timetable generation error: {error_message}")
        
        # Provide more specific error messages
        if "No subjects found" in error_message:
            return {"status": "error", "message": "Please upload subject data before generating timetable."}
        elif "No courses found" in error_message:
            return {"status": "error", "message": "Please upload course data before generating timetable."}
        elif "No faculty found" in error_message:
            return {"status": "error", "message": "Please upload faculty data before generating timetable."}
        else:
            return {"status": "error", "message": f"Error generating timetable: {error_message}"}

# Enhanced Generator Endpoints
class GeneratorConfig(BaseModel):
    user_id: str
    generation_type: str = "smart"  # "smart", "legacy", "custom"
    preferences: dict = {}
    constraints: dict = {}

class CustomGenerationRequest(BaseModel):
    user_id: str
    selected_classes: List[str] = []
    time_preferences: dict = {}
    teacher_preferences: dict = {}
    subject_priorities: dict = {}
    avoid_conflicts: bool = True
    max_daily_hours: int = 6
    break_duration: int = 30
    lunch_break: bool = True

@app.post("/generator/config")
async def get_generator_config(request: dict):
    """Get available configuration options for timetable generation"""
    user_id = request.get("user_id")
    
    try:
        # Get available data for configuration
        subjects_result = supabase_admin.table("Subjects_Clg").select("*").eq("User_id", user_id).execute()
        faculty_result = supabase_admin.table("Faculty_Clg").select("*").eq("User_id", user_id).execute()
        classes_result = supabase_admin.table("Classes_Clg").select("*").eq("User_id", user_id).execute()
        
        # Extract configuration options
        config = {
            "available_subjects": [],
            "available_teachers": [],
            "available_classes": [],
            "time_slots": [
                {"period": 1, "time": "09:00-10:00"},
                {"period": 2, "time": "10:00-11:00"},
                {"period": 3, "time": "11:30-12:30"},
                {"period": 4, "time": "12:30-13:30"},
                {"period": 5, "time": "14:30-15:30"},
                {"period": 6, "time": "15:30-16:30"}
            ],
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        }
        
        # Process subjects
        if subjects_result.data:
            for subject_row in subjects_result.data:
                if "subjects" in subject_row.get("details", {}):
                    for subject in subject_row["details"]["subjects"]:
                        config["available_subjects"].append({
                            "id": subject.get("Subject_ID"),
                            "name": subject.get("Subject_Name"),
                            "code": subject.get("Subject_Code"),
                            "credits": subject.get("Credits"),
                            "type": subject.get("Subject_Type"),
                            "department": subject.get("Department")
                        })
        
        # Process faculty
        if faculty_result.data:
            for faculty_row in faculty_result.data:
                if "teachers" in faculty_row.get("details", {}):
                    for teacher in faculty_row["details"]["teachers"]:
                        config["available_teachers"].append({
                            "id": teacher.get("Teacher_id"),
                            "name": teacher.get("name"),
                            "department": teacher.get("department"),
                            "max_credits": teacher.get("max_credits"),
                            "primary_subject": teacher.get("primary_subject"),
                            "other_subject": teacher.get("other_subject")
                        })
        
        # Process classes
        if classes_result.data:
            for class_row in classes_result.data:
                if "courses" in class_row.get("details", {}):
                    for course in class_row["details"]["courses"]:
                        config["available_classes"].append({
                            "id": course.get("Course_ID"),
                            "name": course.get("Course_Name"),
                            "code": course.get("Course_Code"),
                            "department": course.get("department"),
                            "credits": course.get("Credits")
                        })
        
        return {"status": "success", "config": config}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/generator/custom")
async def generate_custom_timetable(request: CustomGenerationRequest):
    """Generate timetable with custom preferences and constraints"""
    try:
        # For now, use the smart scheduler with custom preferences
        # In the future, this could be extended to handle more granular customization
        
        # Load the scheduler with custom constraints
        from scheduler import SmartScheduler
        scheduler = SmartScheduler()
        
        # Load data from database
        if not scheduler.load_data_from_supabase(request.user_id):
            raise Exception("Failed to load data from database")
        
        # Apply custom preferences (basic implementation)
        if request.selected_classes:
            # Filter classes based on selection
            filtered_classes = {k: v for k, v in scheduler.classes.items() 
                              if v.name in request.selected_classes or v.class_id in request.selected_classes}
            scheduler.classes = filtered_classes
        
        # Generate timetable
        result = scheduler.generate_timetable(request.user_id)
        
        # Store in database with custom metadata
        timetable_row = {
            "timetable_id": str(uuid.uuid4()),
            "User_id": request.user_id,
            "details": result
        }
        
        # Clear existing and insert new
        supabase_admin.table("Timetables_Clg").delete().eq("User_id", request.user_id).execute()
        insert_result = supabase_admin.table("Timetables_Clg").insert(timetable_row).execute()
        
        return {"status": "success", "message": "Custom timetable generated successfully", "data": insert_result.data}
        
    except Exception as e:
        return {"status": "error", "message": f"Error generating custom timetable: {str(e)}"}

@app.post("/generator/batch")
async def generate_batch_timetables(request: dict):
    """Generate multiple timetable variations for comparison"""
    user_id = request.get("user_id")
    variations = request.get("variations", 3)
    
    try:
        timetables = []
        
        for i in range(variations):
            # Generate with slight randomization
            from scheduler import SmartScheduler
            scheduler = SmartScheduler()
            
            if not scheduler.load_data_from_supabase(user_id):
                continue
                
            result = scheduler.generate_timetable(user_id)
            workload_report = scheduler.get_teacher_workload_report()
            
            timetables.append({
                "variation": i + 1,
                "timetable": result,
                "teacher_workload": workload_report,
                "score": sum(report["utilization_percent"] for report in workload_report.values()) / len(workload_report)
            })
        
        # Sort by score (best utilization)
        timetables.sort(key=lambda x: abs(x["score"] - 75))  # Target 75% utilization
        
        return {"status": "success", "variations": timetables}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/get_timetable/{user_id}")
async def get_timetable(user_id: str):
    try:
        result = supabase_admin.table("Timetables_Clg").select("*").eq("User_id", user_id).execute()
        
        if not result.data:
            return {"status": "no_data", "message": "No timetable found for this user", "data": []}
        
        # Get the most recent timetable
        timetable_record = result.data[0]
        timetable_details = timetable_record.get("details", {})
        
        # Convert the new JSONB structure to the format expected by frontend
        converted_data = []
        if "classes" in timetable_details:
            for class_info in timetable_details["classes"]:
                for schedule_entry in class_info.get("schedule", []):
                    converted_data.append({
                        "class": class_info["class_name"],
                        "day": schedule_entry["day"],
                        "period": schedule_entry["period"],
                        "subject": schedule_entry["subject"],
                        "teacher": schedule_entry["teacher"]
                    })
        
        return {"status": "success", "data": converted_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching timetable: {str(e)}")

# -------------------------------
# Enhanced Scheduler Analytics
# -------------------------------
@app.get("/scheduler/analytics/{user_id}")
async def get_scheduler_analytics(user_id: str):
    """Get detailed analytics about the generated schedule"""
    try:
        result = supabase_admin.table("Timetables_Clg").select("*").eq("User_id", user_id).execute()
        
        if not result.data:
            return {"status": "no_data", "message": "No timetable found for this user"}
        
        timetable_record = result.data[0]
        metadata = timetable_record.get("metadata", {})
        
        analytics = {
            "generation_method": metadata.get("generation_method", "unknown"),
            "teacher_workload": metadata.get("teacher_workload", {}),
            "validation_issues": metadata.get("validation_issues", []),
            "schedule_stats": {},
            "efficiency_metrics": {}
        }
        
        # Calculate basic schedule statistics
        timetable_details = timetable_record.get("details", {})
        if "classes" in timetable_details:
            total_periods = 0
            total_subjects = set()
            total_teachers = set()
            
            for class_info in timetable_details["classes"]:
                schedule = class_info.get("schedule", [])
                total_periods += len(schedule)
                
                for entry in schedule:
                    total_subjects.add(entry.get("subject", ""))
                    total_teachers.add(entry.get("teacher", ""))
            
            analytics["schedule_stats"] = {
                "total_classes": len(timetable_details["classes"]),
                "total_periods_scheduled": total_periods,
                "unique_subjects": len(total_subjects),
                "unique_teachers": len(total_teachers),
                "average_periods_per_class": round(total_periods / len(timetable_details["classes"]), 2) if timetable_details["classes"] else 0
            }
        
        return {"status": "success", "data": analytics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analytics: {str(e)}")

@app.post("/scheduler/optimize/{user_id}")
async def optimize_existing_schedule(user_id: str):
    """Re-optimize an existing schedule to improve efficiency"""
    try:
        from scheduler import SmartScheduler
        
        # Create new scheduler instance
        scheduler = SmartScheduler()
        
        # Load data and regenerate with optimization
        result = scheduler.generate_timetable(user_id)
        
        return {"status": "success", "message": "Schedule optimized successfully", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error optimizing schedule: {str(e)}")

@app.get("/scheduler/conflicts/{user_id}")
async def check_schedule_conflicts(user_id: str):
    """Check for conflicts in the current schedule"""
    try:
        from scheduler import SmartScheduler
        
        scheduler = SmartScheduler()
        if scheduler.load_data_from_supabase(user_id):
            
            # Load existing schedule
            result = supabase_admin.table("Timetables_Clg").select("*").eq("User_id", user_id).execute()
            if result.data:
                # Parse existing schedule and validate
                conflicts = scheduler.validate_schedule()
                return {"status": "success", "conflicts": conflicts, "has_conflicts": len(conflicts) > 0}
            else:
                return {"status": "no_data", "message": "No schedule found to check"}
        else:
            return {"status": "error", "message": "Could not load scheduling data"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking conflicts: {str(e)}")

@app.get("/scheduler/teacher-workload/{user_id}")
async def get_teacher_workload_report(user_id: str):
    """Get detailed teacher workload distribution report"""
    try:
        result = supabase_admin.table("Timetables_Clg").select("*").eq("User_id", user_id).execute()
        
        if not result.data:
            return {"status": "no_data", "message": "No timetable found for this user"}
        
        timetable_record = result.data[0]
        metadata = timetable_record.get("metadata", {})
        workload_report = metadata.get("teacher_workload", {})
        
        # Enhanced workload analysis
        enhanced_report = {}
        for teacher_name, stats in workload_report.items():
            enhanced_report[teacher_name] = {
                **stats,
                "workload_status": "overloaded" if stats.get("utilization_percent", 0) > 100 else
                                "optimal" if 80 <= stats.get("utilization_percent", 0) <= 100 else
                                "underutilized" if stats.get("utilization_percent", 0) < 50 else "good"
            }
        
        return {"status": "success", "data": enhanced_report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching workload report: {str(e)}")

@app.post("/debug/teacher-subject-mapping")
async def debug_teacher_subject_mapping(request: GeneratorRequest):
    """Debug endpoint to check teacher-subject compatibility"""
    try:
        scheduler = SmartScheduler()
        if not scheduler.load_data_from_supabase(request.user_id):
            raise HTTPException(status_code=500, detail="Failed to load data")
        
        mapping_info = {
            "total_teachers": len(scheduler.teachers),
            "total_subjects": len(scheduler.subjects),
            "teacher_subject_compatibility": {}
        }
        
        # Check each teacher's compatibility with each subject
        for teacher_id, teacher in scheduler.teachers.items():
            compatible_subjects = []
            for subject_id, subject in scheduler.subjects.items():
                if teacher.can_teach(subject):
                    compatible_subjects.append({
                        "subject_name": subject.name,
                        "subject_department": subject.department,
                        "reason": "primary" if subject.name == teacher.primary_subject 
                                else "secondary" if subject.name in teacher.other_subjects 
                                else "department_match"
                    })
            
            mapping_info["teacher_subject_compatibility"][teacher.name] = {
                "teacher_id": teacher_id,
                "primary_subject": teacher.primary_subject,
                "other_subjects": teacher.other_subjects,
                "department": teacher.department,
                "compatible_subjects": compatible_subjects,
                "can_teach_count": len(compatible_subjects)
            }
        
        # Check subjects that have no compatible teachers
        orphaned_subjects = []
        for subject_id, subject in scheduler.subjects.items():
            has_teacher = any(teacher.can_teach(subject) for teacher in scheduler.teachers.values())
            if not has_teacher:
                orphaned_subjects.append({
                    "subject_name": subject.name,
                    "department": subject.department,
                    "subject_code": subject.code
                })
        
        mapping_info["orphaned_subjects"] = orphaned_subjects
        
        return mapping_info
        
    except Exception as e:
        logger.error(f"Error in debug mapping: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clear_user_data")
async def clear_user_data(request: dict):
    """Clear all user uploaded data (Faculty, Subjects, Classes, Timetables)"""
    try:
        user_id = request.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        logger.info(f"Clearing all data for user: {user_id}")
        
        # Clear all user data from all tables
        tables_to_clear = ["Faculty_Clg", "Subjects_Clg", "Classes_Clg", "Timetables_Clg"]
        cleared_counts = {}
        
        for table in tables_to_clear:
            try:
                # Get count before deletion
                count_result = supabase_admin.table(table).select("*", count="exact").eq("User_id", user_id).execute()
                before_count = count_result.count or 0
                
                # Delete all records for this user
                delete_result = supabase_admin.table(table).delete().eq("User_id", user_id).execute()
                
                cleared_counts[table] = before_count
                logger.info(f"Cleared {before_count} records from {table}")
                
            except Exception as table_error:
                logger.error(f"Error clearing {table}: {str(table_error)}")
                cleared_counts[table] = f"Error: {str(table_error)}"
        
        return {
            "status": "success", 
            "message": "User data cleared successfully",
            "cleared_counts": cleared_counts
        }
        
    except Exception as e:
        logger.error(f"Error clearing user data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))