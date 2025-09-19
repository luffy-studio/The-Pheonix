import uuid
from supabase import create_client, Client
import random

# -------------------------
# Supabase Setup
# -------------------------
SUPABASE_URL = "https://gsabsxqojtybzglwdgov.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYWJzeHFvanR5YnpnbHdkZ292Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE1MjI2NywiZXhwIjoyMDcyNzI4MjY3fQ.vbUdtB5B_88TuvKCAy4cvUYzmzOky6gDP9KvuD3A3Mc"   # service_role key use karna
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
PERIODS = 6   # har din 6 periods

# -------------------------
# Fetch Data from Supabase
# -------------------------
def fetch_data(user_id: str):
    print(f"🔍 Fetching data for user: {user_id}")
    
    teachers_result = supabase.table("Faculty_Clg").select("*").eq("User_id", user_id).execute().data
    subjects_result = supabase.table("Subjects_Clg").select("*").eq("User_id", user_id).execute().data
    classes_result  = supabase.table("Classes_Clg").select("*").eq("User_id", user_id).execute().data
    
    print(f"📊 Raw database results:")
    print(f"   - Faculty records: {len(teachers_result) if teachers_result else 0}")
    print(f"   - Subject records: {len(subjects_result) if subjects_result else 0}")
    print(f"   - Class records: {len(classes_result) if classes_result else 0}")
    
    teacher_map = {}
    subject_list = []
    course_list = []

    # Process teachers
    if teachers_result:
        for teacher_row in teachers_result:
            if "details" in teacher_row and "teachers" in teacher_row["details"]:
                for t in teacher_row["details"]["teachers"]:
                    teacher_map[t["primary_subject"]] = t["name"]
                    if t.get("other_subject"):
                        teacher_map[t["other_subject"]] = t["name"]
                print(f"✅ Processed {len(teacher_row['details']['teachers'])} teachers from database")

    # Process subjects
    if subjects_result:
        for subject_row in subjects_result:
            if "details" in subject_row and "subjects" in subject_row["details"]:
                subject_list.extend(subject_row["details"]["subjects"])
                print(f"✅ Processed {len(subject_row['details']['subjects'])} subjects from database")

    # Process courses/classes
    if classes_result:
        for class_row in classes_result:
            if "details" in class_row and "courses" in class_row["details"]:
                course_list.extend(class_row["details"]["courses"])
                print(f"✅ Processed {len(class_row['details']['courses'])} courses from database")

    print(f"📋 Final processed data:")
    print(f"   - Teacher mappings: {len(teacher_map)}")
    print(f"   - Available subjects: {len(subject_list)}")
    print(f"   - Available courses: {len(course_list)}")
    
    if subject_list:
        print(f"   - Subject names: {[s.get('Subject_Name', 'Unknown') for s in subject_list[:5]]}{'...' if len(subject_list) > 5 else ''}")
    if course_list:
        print(f"   - Course names: {[c.get('Course_Name', 'Unknown') for c in course_list[:3]]}{'...' if len(course_list) > 3 else ''}")

    return teacher_map, subject_list, course_list

# -------------------------
# Generate Timetable
# -------------------------
def generate_timetable(user_id: str):
    teacher_map, subject_list, course_list = fetch_data(user_id)

    # First clear any existing timetable for this user
    supabase.table("Timetables_Clg").delete().eq("User_id", user_id).execute()

    # Validate that we have the required data
    if not course_list:
        raise Exception("No courses found! Please upload course data first.")
    
    if not teacher_map:
        raise Exception("No faculty found! Please upload faculty data first.")

    # If no subjects uploaded separately, derive them from courses
    if not subject_list:
        print("📚 No separate subjects found, deriving from courses...")
        subject_list = []
        for course in course_list:
            # Create subject from course data
            subject = {
                "Subject_Name": course["Course_Name"],
                "Subject_Code": course.get("Course_Code", course["Course_Name"][:3].upper()),
                "Department": course.get("department", "General"),
                "Credits": course.get("Credits", 3),
                "Subject_Type": course.get("Course_Type", "Theory")
            }
            subject_list.append(subject)

    print(f"📊 Using uploaded data:")
    print(f"   - Subjects: {len(subject_list)}")
    print(f"   - Courses: {len(course_list)}")
    print(f"   - Teachers: {len(teacher_map)}")

    timetable_details = {"classes": []}

    for cls in course_list:
        cls_name = cls["Course_Name"]
        print(f"\n📘 Generating timetable for {cls_name}")

        class_schedule = {
            "class_name": cls_name,
            "schedule": []
        }

        for d in DAYS:
            for p in range(1, PERIODS+1):
                # Use actual uploaded subjects (or derived from courses)
                subject = random.choice(subject_list)
                subject_name = subject["Subject_Name"]
                
                # Use actual uploaded teachers
                teacher = teacher_map.get(subject_name)
                if not teacher:
                    # If no specific teacher for this subject, pick any available teacher
                    teacher = list(teacher_map.values())[0] if teacher_map else "TBD"

                schedule_entry = {
                    "day": d,
                    "period": p,
                    "subject": subject_name,
                    "teacher": teacher,
                    "start_time": f"{8 + p}:00",
                    "end_time": f"{9 + p}:00"
                }
                class_schedule["schedule"].append(schedule_entry)

        timetable_details["classes"].append(class_schedule)

    # Create single row with all timetable data in details JSONB column
    timetable_row = {
        "timetable_id": str(uuid.uuid4()),
        "User_id": user_id,
        "details": timetable_details
    }

    # Insert into Supabase
    try:
        result = supabase.table("Timetables_Clg").insert(timetable_row).execute()
        print("✅ Timetable inserted into Timetables_Clg with structure:")
        print(f"   - Classes: {len(timetable_details['classes'])}")
        print(f"   - Total schedule entries: {sum(len(cls['schedule']) for cls in timetable_details['classes'])}")
        return result.data
    except Exception as e:
        print(f"❌ Error inserting timetable: {str(e)}")
        raise e

# -------------------------
# Run
# -------------------------
if __name__ == "__main__":
    USER_ID = "088f7a98-e77c-45e0-9a65-859959a2434d"
    generate_timetable(USER_ID)