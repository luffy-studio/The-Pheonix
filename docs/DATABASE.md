# Database Schema Documentation

## Overview

The Phoenix uses Supabase (PostgreSQL) as its database. The schema consists of four main tables that handle faculty, subjects, classes, and generated timetables.

## Tables

### 1. Faculty_Clg

Stores information about teachers and faculty members.

**Columns:**
- `faculty_id` (UUID, Primary Key) - Unique identifier for the faculty entry
- `User_id` (UUID, Foreign Key) - References the user who created this data
- `details` (JSONB) - Contains array of teacher objects

**JSONB Structure:**
```json
{
  "teachers": [
    {
      "Teacher_id": "uuid",
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

**Indexes:**
- Primary key on `faculty_id`
- Index on `User_id` for faster user-specific queries

---

### 2. Subjects_Clg

Stores the catalog of subjects offered.

**Columns:**
- `subject_id` (UUID, Primary Key) - Unique identifier for the subject entry
- `User_id` (UUID, Foreign Key) - References the user who created this data
- `details` (JSONB) - Contains array of subject objects

**JSONB Structure:**
```json
{
  "subjects": [
    {
      "Subject_ID": "uuid",
      "Subject_Name": "Database Management Systems",
      "Subject_Code": "CS301",
      "Department": "Computer Science",
      "Credits": 4,
      "Subject_Type": "Theory"
    }
  ]
}
```

**Subject Types:**
- Theory
- Lab
- Practical
- Field Work

**Indexes:**
- Primary key on `subject_id`
- Index on `User_id`

---

### 3. Classes_Clg

Stores information about classes/courses/sections.

**Columns:**
- `class_id` (UUID, Primary Key) - Unique identifier for the class entry
- `User_id` (UUID, Foreign Key) - References the user who created this data
- `details` (JSONB) - Contains array of course objects

**JSONB Structure:**
```json
{
  "courses": [
    {
      "Course_ID": "uuid",
      "Course_Code": "CSE-3A",
      "Course_Name": "Computer Science Engineering - 3rd Year A",
      "department": "Computer Science",
      "Credits": 24,
      "Course_Type": "Engineering"
    }
  ]
}
```

**Indexes:**
- Primary key on `class_id`
- Index on `User_id`

---

### 4. Timetables_Clg

Stores generated timetables.

**Columns:**
- `timetable_id` (UUID, Primary Key) - Unique identifier for the timetable
- `User_id` (UUID, Foreign Key) - References the user who generated this timetable
- `details` (JSONB) - Contains the complete timetable data
- `created_at` (TIMESTAMP) - When the timetable was generated

**JSONB Structure:**
```json
{
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
```

**Days of Week:**
- Monday
- Tuesday
- Wednesday
- Thursday
- Friday
- Saturday

**Periods:**
- Period 1: 09:00-10:00
- Period 2: 10:00-11:00
- Period 3: 11:30-12:30 (after break)
- Period 4: 12:30-13:30
- Period 5: 14:30-15:30 (after lunch)
- Period 6: 15:30-16:30

**Indexes:**
- Primary key on `timetable_id`
- Index on `User_id`
- Index on `created_at` for temporal queries

---

## Relationships

```
Users (Supabase Auth)
  |
  ├── Faculty_Clg (User_id)
  ├── Subjects_Clg (User_id)
  ├── Classes_Clg (User_id)
  └── Timetables_Clg (User_id)
```

## Security

### Row Level Security (RLS) Policies

All tables should have RLS policies enabled:

```sql
-- Enable RLS
ALTER TABLE Faculty_Clg ENABLE ROW LEVEL SECURITY;
ALTER TABLE Subjects_Clg ENABLE ROW LEVEL SECURITY;
ALTER TABLE Classes_Clg ENABLE ROW LEVEL SECURITY;
ALTER TABLE Timetables_Clg ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data
CREATE POLICY "Users can view own data" ON Faculty_Clg
  FOR SELECT USING (auth.uid() = User_id);

CREATE POLICY "Users can insert own data" ON Faculty_Clg
  FOR INSERT WITH CHECK (auth.uid() = User_id);

CREATE POLICY "Users can update own data" ON Faculty_Clg
  FOR UPDATE USING (auth.uid() = User_id);

CREATE POLICY "Users can delete own data" ON Faculty_Clg
  FOR DELETE USING (auth.uid() = User_id);

-- Repeat for other tables...
```

## Migrations

### Initial Setup

```sql
-- Create Faculty_Clg table
CREATE TABLE Faculty_Clg (
  faculty_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  User_id UUID NOT NULL REFERENCES auth.users(id),
  details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Subjects_Clg table
CREATE TABLE Subjects_Clg (
  subject_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  User_id UUID NOT NULL REFERENCES auth.users(id),
  details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Classes_Clg table
CREATE TABLE Classes_Clg (
  class_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  User_id UUID NOT NULL REFERENCES auth.users(id),
  details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Timetables_Clg table
CREATE TABLE Timetables_Clg (
  timetable_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  User_id UUID NOT NULL REFERENCES auth.users(id),
  details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_faculty_user ON Faculty_Clg(User_id);
CREATE INDEX idx_subjects_user ON Subjects_Clg(User_id);
CREATE INDEX idx_classes_user ON Classes_Clg(User_id);
CREATE INDEX idx_timetables_user ON Timetables_Clg(User_id);
CREATE INDEX idx_timetables_created ON Timetables_Clg(created_at);
```

## Query Examples

### Get all faculty for a user
```sql
SELECT * FROM Faculty_Clg WHERE User_id = '...';
```

### Get timetable with teacher workload
```sql
SELECT 
  t.timetable_id,
  t.details,
  COUNT(DISTINCT jsonb_array_elements(t.details->'classes')) as class_count
FROM Timetables_Clg t
WHERE t.User_id = '...'
GROUP BY t.timetable_id, t.details;
```

### Search subjects by department
```sql
SELECT * FROM Subjects_Clg
WHERE details @> '{"subjects": [{"Department": "Computer Science"}]}';
```

## Backup and Restore

### Backup
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore
```bash
psql $DATABASE_URL < backup.sql
```

## Performance Considerations

1. **JSONB Indexing**: Consider adding GIN indexes on JSONB columns for faster queries
   ```sql
   CREATE INDEX idx_faculty_details ON Faculty_Clg USING GIN (details);
   ```

2. **Partitioning**: For large datasets, consider partitioning Timetables_Clg by created_at

3. **Connection Pooling**: Use pgBouncer (included in Supabase) for connection pooling

4. **Caching**: Implement Redis caching for frequently accessed timetables

## Notes

- All UUIDs are generated server-side
- JSONB allows for flexible schema evolution
- Use service role key for admin operations only
- Always validate data before insertion
- Keep .env files secure and never commit them
