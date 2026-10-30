-- ============================================================================
-- The Phoenix: Database Schema Reference
-- Canonical migration is maintained at /migrations/001_initial_schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."Faculty_Clg" (
    faculty_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "User_id" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    details JSONB NOT NULL DEFAULT '{"teachers": []}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."Subjects_Clg" (
    subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "User_id" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    details JSONB NOT NULL DEFAULT '{"subjects": []}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."Classes_Clg" (
    class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "User_id" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    details JSONB NOT NULL DEFAULT '{"courses": []}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."Timetables_Clg" (
    timetable_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "User_id" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    details JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_faculty_user_id ON public."Faculty_Clg"("User_id");
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public."Subjects_Clg"("User_id");
CREATE INDEX IF NOT EXISTS idx_classes_user_id ON public."Classes_Clg"("User_id");
CREATE INDEX IF NOT EXISTS idx_timetables_user_id ON public."Timetables_Clg"("User_id");
CREATE INDEX IF NOT EXISTS idx_timetables_created_at ON public."Timetables_Clg"(created_at DESC);
