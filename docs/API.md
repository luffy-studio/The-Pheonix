# API Documentation

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://your-backend-url.com`

## Authentication

The Phoenix uses Supabase Authentication. Most endpoints require authentication via JWT token.

```javascript
// Include token in headers
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## Endpoints

### Health Check

#### `GET /`

Check if the backend is running.

**Response:**
```json
{
  "message": "Backend is running!"
}
```

---

## Faculty Management

### Upload Faculty

#### `POST /upload_faculty`

Upload faculty/teacher data.

**Request Body:**
```json
{
  "user_id": "uuid",
  "details": [
    {
      "name": "Dr. John Smith",
      "department": "Computer Science",
      "course_type": "Theory",
      "max_credits": 20,
      "primary_subject": "Database Systems",
      "other_subject": "Data Structures"
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "inserted_teachers": 1
}
```

**Error Response:**
```json
{
  "status": "error",
  "detail": "Error message"
}
```

---

## Subject Management

### Upload Subjects

#### `POST /upload_subjects`

Upload subject data.

**Request Body:**
```json
{
  "user_id": "uuid",
  "details": [
    {
      "Subject_Code": "CS301",
      "Subject_Name": "Database Management Systems",
      "Department": "Computer Science",
      "Credits": 4,
      "Subject_Type": "Theory"
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "inserted_subjects": 1
}
```

---

## Class/Course Management

### Upload Courses

#### `POST /upload_courses`

Upload class/course data.

**Request Body:**
```json
{
  "user_id": "uuid",
  "details": [
    {
      "Course_Code": "CSE-3A",
      "Course_Name": "Computer Science Engineering - 3rd Year A",
      "department": "Computer Science",
      "Credits": 24,
      "Course_Type": "Engineering"
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "inserted_courses": 1
}
```

---

## Timetable Generation

### Smart Generate

#### `POST /generate_timetable`

Generate timetable using smart AI scheduling algorithm.

**Request Body:**
```json
{
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Timetable generated successfully with smart scheduling",
  "data": {
    "classes": [
      {
        "class_name": "CSE-3A",
        "department": "Computer Science",
        "schedule": [
          {
            "day": "Monday",
            "period": 1,
            "start_time": "09:00",
            "end_time": "10:00",
            "subject": "Database Management Systems",
            "subject_code": "CS301",
            "teacher": "Dr. John Smith",
            "room": "TBA",
            "subject_type": "Theory"
          }
        ]
      }
    ]
  }
}
```

**Error Responses:**
```json
{
  "status": "error",
  "message": "Please upload subject data before generating timetable."
}
```

### Legacy Generate

#### `POST /generate_timetable_legacy`

Generate timetable using legacy algorithm (fallback).

**Request/Response:** Same as smart generate

---

### Custom Generate

#### `POST /generator/custom`

Generate timetable with custom preferences.

**Request Body:**
```json
{
  "user_id": "uuid",
  "selected_classes": ["class_id_1", "class_id_2"],
  "time_preferences": {},
  "teacher_preferences": {},
  "subject_priorities": {},
  "avoid_conflicts": true,
  "max_daily_hours": 6,
  "break_duration": 30,
  "lunch_break": true
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Custom timetable generated successfully",
  "data": { /* timetable data */ }
}
```

---

### Batch Generate

#### `POST /generator/batch`

Generate multiple timetable variations for comparison.

**Request Body:**
```json
{
  "user_id": "uuid",
  "variations": 3
}
```

**Response:**
```json
{
  "status": "success",
  "variations": [
    {
      "variation": 1,
      "timetable": { /* timetable data */ },
      "teacher_workload": { /* workload data */ },
      "score": 75.5
    }
  ]
}
```

---

### Get Configuration

#### `POST /generator/config`

Get available configuration options for timetable generation.

**Request Body:**
```json
{
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "status": "success",
  "config": {
    "available_subjects": [
      {
        "id": "uuid",
        "name": "Database Systems",
        "code": "CS301",
        "credits": 4,
        "type": "Theory",
        "department": "Computer Science"
      }
    ],
    "available_teachers": [ /* teacher data */ ],
    "available_classes": [ /* class data */ ],
    "time_slots": [
      {"period": 1, "time": "09:00-10:00"}
    ],
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  }
}
```

---

## Timetable Retrieval

### Get Timetable

#### `GET /get_timetable/{user_id}`

Retrieve the generated timetable for a user.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "class": "CSE-3A",
      "day": "Monday",
      "period": 1,
      "subject": "Database Systems",
      "teacher": "Dr. John Smith"
    }
  ]
}
```

**No Data Response:**
```json
{
  "status": "no_data",
  "message": "No timetable found for this user",
  "data": []
}
```

---

## Analytics

### Get Analytics

#### `GET /scheduler/analytics/{user_id}`

Get detailed analytics about the generated schedule.

**Response:**
```json
{
  "status": "success",
  "data": {
    "generation_method": "smart",
    "teacher_workload": { /* workload data */ },
    "validation_issues": [],
    "schedule_stats": {
      "total_classes": 3,
      "total_periods_scheduled": 120,
      "unique_subjects": 15,
      "unique_teachers": 20,
      "average_periods_per_class": 40
    },
    "efficiency_metrics": {}
  }
}
```

---

### Teacher Workload Report

#### `GET /scheduler/teacher-workload/{user_id}`

Get detailed teacher workload distribution report.

**Response:**
```json
{
  "status": "success",
  "data": {
    "Dr. John Smith": {
      "current_load": 18,
      "max_capacity": 20,
      "utilization_percent": 90.0,
      "subjects_taught": 3,
      "workload_status": "optimal"
    }
  }
}
```

**Workload Status:**
- `overloaded` - Utilization > 100%
- `optimal` - Utilization 80-100%
- `good` - Utilization 50-80%
- `underutilized` - Utilization < 50%

---

### Check Conflicts

#### `GET /scheduler/conflicts/{user_id}`

Check for conflicts in the current schedule.

**Response:**
```json
{
  "status": "success",
  "conflicts": [
    "Teacher Dr. Smith has overlapping schedules"
  ],
  "has_conflicts": true
}
```

---

### Optimize Schedule

#### `POST /scheduler/optimize/{user_id}`

Re-optimize an existing schedule to improve efficiency.

**Response:**
```json
{
  "status": "success",
  "message": "Schedule optimized successfully",
  "data": { /* optimized timetable */ }
}
```

---

## Data Management

### Setup Sample Data

#### `POST /setup_sample_data`

Create sample data for testing.

**Request Body:**
```json
{
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Sample data created successfully",
  "data": {
    "subjects": 6,
    "teachers": 5,
    "classes": 3
  }
}
```

---

### Clear User Data

#### `POST /clear_user_data`

Clear all user uploaded data.

**Request Body:**
```json
{
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User data cleared successfully",
  "cleared_counts": {
    "Faculty_Clg": 1,
    "Subjects_Clg": 1,
    "Classes_Clg": 1,
    "Timetables_Clg": 1
  }
}
```

---

## Debug Endpoints

### Teacher-Subject Mapping

#### `POST /debug/teacher-subject-mapping`

Debug endpoint to check teacher-subject compatibility.

**Request Body:**
```json
{
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "total_teachers": 20,
  "total_subjects": 15,
  "teacher_subject_compatibility": {
    "Dr. John Smith": {
      "teacher_id": "uuid",
      "primary_subject": "Database Systems",
      "other_subjects": ["Data Structures"],
      "department": "Computer Science",
      "compatible_subjects": [
        {
          "subject_name": "Database Systems",
          "subject_department": "Computer Science",
          "reason": "primary"
        }
      ],
      "can_teach_count": 5
    }
  },
  "orphaned_subjects": []
}
```

---

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

No rate limiting is currently implemented. For production, consider adding rate limiting middleware.

---

## Examples

### JavaScript/TypeScript

```typescript
// Generate timetable
const response = await fetch('http://localhost:8000/generate_timetable', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    user_id: 'your-user-id'
  })
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

# Upload faculty
response = requests.post(
    'http://localhost:8000/upload_faculty',
    json={
        'user_id': 'your-user-id',
        'details': [
            {
                'name': 'Dr. John Smith',
                'department': 'Computer Science',
                'course_type': 'Theory',
                'max_credits': 20,
                'primary_subject': 'Database Systems',
                'other_subject': 'Data Structures'
            }
        ]
    },
    headers={'Authorization': f'Bearer {token}'}
)

print(response.json())
```

### cURL

```bash
# Get timetable
curl -X GET "http://localhost:8000/get_timetable/your-user-id" \
  -H "Authorization: Bearer your-token"

# Generate timetable
curl -X POST "http://localhost:8000/generate_timetable" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"user_id": "your-user-id"}'
```

---

## Interactive API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

These provide interactive API documentation with the ability to test endpoints directly from the browser.
