from pydantic import BaseModel
from typing import List, Optional


# -------------------------------
# Faculty Schema
# -------------------------------
class Faculty(BaseModel):
    Teacher_id: Optional[str] = None  # auto-generated
    User_id: Optional[str] = None     # taken from payload.user_id
    name: str
    department: str
    course_type: str
    max_credits: int
    primary_subject: Optional[str] = None
    other_subject: Optional[str] = None

class FacultyUpload(BaseModel):
    user_id: str
    details: List[Faculty]
    
# -------------------------------
# Course Schema
# -------------------------------
class Course(BaseModel):
    Course_Code: str
    Course_Name: str
    department: str
    Credits: int
    Course_Type: str  # e.g., Theory, Practical, Lab, Field Work

class CourseUpload(BaseModel):
    user_id: str
    details: List[Course]
# -------------------------------
# ClassType Schema
# -------------------------------
# Subject schema
class Subject(BaseModel):
    Subject_Code: str
    Subject_Name: str
    Department: str
    Credits: int
    Subject_Type: str

class SubjectUpload(BaseModel):
    user_id: str
    details: List[Subject]
    
    
