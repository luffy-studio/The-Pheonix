-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Scheduled_timetable (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  time timestamp without time zone,
  Day date,
  CONSTRAINT Scheduled_timetable_pkey PRIMARY KEY (id)
);
CREATE TABLE public.faculty (
  name character varying NOT NULL,
  department character varying,
  course_type character varying CHECK (course_type::text = ANY (ARRAY['Theory'::character varying, 'Practical'::character varying, 'Field Work'::character varying, 'Lab'::character varying]::text[])),
  max_credits integer,
  availability character varying,
  expertise character varying,
  Faculity_Iid uuid NOT NULL UNIQUE,
  CONSTRAINT faculty_pkey PRIMARY KEY (Faculity_Iid),
  CONSTRAINT faculty_Faculity_Iid_fkey FOREIGN KEY (Faculity_Iid) REFERENCES public.users(id)
);
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  code character varying,
  color character varying,
  teacher character varying,
  department character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subjects_pkey PRIMARY KEY (id)
);
CREATE TABLE public.timetable_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  timetable_id uuid,
  subject_id uuid,
  day character varying NOT NULL,
  period integer NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT timetable_slots_pkey PRIMARY KEY (id),
  CONSTRAINT timetable_slots_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT timetable_slots_timetable_id_fkey FOREIGN KEY (timetable_id) REFERENCES public.timetables(id)
);
CREATE TABLE public.timetables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  class text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT timetables_pkey PRIMARY KEY (id),
  CONSTRAINT timetables_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);