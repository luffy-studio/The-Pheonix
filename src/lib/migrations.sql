-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Default blue color
    teacher VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timetables table
CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timetable_slots table
CREATE TABLE IF NOT EXISTS timetable_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    day VARCHAR(20) NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    period INTEGER NOT NULL CHECK (period >= 1 AND period <= 10),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(timetable_id, day, period)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subjects_department ON subjects(department);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher ON subjects(teacher);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_timetable_id ON timetable_slots(timetable_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_subject_id ON timetable_slots(subject_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_day_period ON timetable_slots(day, period);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timetables_updated_at BEFORE UPDATE ON timetables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timetable_slots_updated_at BEFORE UPDATE ON timetable_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO subjects (name, code, color, teacher, department) VALUES
    ('Mathematics', 'MATH101', '#EF4444', 'Dr. Smith', 'Mathematics'),
    ('Physics', 'PHYS101', '#3B82F6', 'Prof. Johnson', 'Science'),
    ('Chemistry', 'CHEM101', '#10B981', 'Dr. Brown', 'Science'),
    ('English Literature', 'ENG101', '#F59E0B', 'Ms. Davis', 'English'),
    ('History', 'HIST101', '#8B5CF6', 'Mr. Wilson', 'Social Studies'),
    ('Computer Science', 'CS101', '#06B6D4', 'Dr. Taylor', 'Technology'),
    ('Biology', 'BIO101', '#84CC16', 'Prof. Anderson', 'Science'),
    ('Art', 'ART101', '#EC4899', 'Ms. Martinez', 'Arts')
ON CONFLICT (code) DO NOTHING;

-- Insert sample timetable
INSERT INTO timetables (name, description) VALUES
    ('Class 10A - Spring 2024', 'Main timetable for Class 10A students')
ON CONFLICT DO NOTHING;

-- Get the timetable ID for sample slots (this will work if the above insert succeeded)
DO $$
DECLARE
    sample_timetable_id UUID;
    math_subject_id UUID;
    physics_subject_id UUID;
    chemistry_subject_id UUID;
    english_subject_id UUID;
    history_subject_id UUID;
    cs_subject_id UUID;
BEGIN
    -- Get the sample timetable ID
    SELECT id INTO sample_timetable_id FROM timetables WHERE name = 'Class 10A - Spring 2024' LIMIT 1;
    
    -- Get subject IDs
    SELECT id INTO math_subject_id FROM subjects WHERE code = 'MATH101' LIMIT 1;
    SELECT id INTO physics_subject_id FROM subjects WHERE code = 'PHYS101' LIMIT 1;
    SELECT id INTO chemistry_subject_id FROM subjects WHERE code = 'CHEM101' LIMIT 1;
    SELECT id INTO english_subject_id FROM subjects WHERE code = 'ENG101' LIMIT 1;
    SELECT id INTO history_subject_id FROM subjects WHERE code = 'HIST101' LIMIT 1;
    SELECT id INTO cs_subject_id FROM subjects WHERE code = 'CS101' LIMIT 1;
    
    -- Insert sample timetable slots if timetable exists
    IF sample_timetable_id IS NOT NULL THEN
        INSERT INTO timetable_slots (timetable_id, subject_id, day, period, start_time, end_time) VALUES
            (sample_timetable_id, math_subject_id, 'Monday', 1, '09:00', '09:45'),
            (sample_timetable_id, physics_subject_id, 'Monday', 2, '09:45', '10:30'),
            (sample_timetable_id, chemistry_subject_id, 'Monday', 3, '10:45', '11:30'),
            (sample_timetable_id, english_subject_id, 'Monday', 4, '11:30', '12:15'),
            
            (sample_timetable_id, english_subject_id, 'Tuesday', 1, '09:00', '09:45'),
            (sample_timetable_id, math_subject_id, 'Tuesday', 2, '09:45', '10:30'),
            (sample_timetable_id, history_subject_id, 'Tuesday', 3, '10:45', '11:30'),
            (sample_timetable_id, cs_subject_id, 'Tuesday', 4, '11:30', '12:15'),
            
            (sample_timetable_id, physics_subject_id, 'Wednesday', 1, '09:00', '09:45'),
            (sample_timetable_id, chemistry_subject_id, 'Wednesday', 2, '09:45', '10:30'),
            (sample_timetable_id, math_subject_id, 'Wednesday', 3, '10:45', '11:30'),
            (sample_timetable_id, english_subject_id, 'Wednesday', 4, '11:30', '12:15')
        ON CONFLICT (timetable_id, day, period) DO NOTHING;
    END IF;
END $$;

-- Enable Row Level Security (RLS) - Optional, for future authentication
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for now (you can restrict these later)
CREATE POLICY "Allow all operations on subjects" ON subjects FOR ALL USING (true);
CREATE POLICY "Allow all operations on timetables" ON timetables FOR ALL USING (true);
CREATE POLICY "Allow all operations on timetable_slots" ON timetable_slots FOR ALL USING (true);

-- Users table for auth (used by handleRegister and handleLogin)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(150) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- For now, permit all operations (tighten later)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);