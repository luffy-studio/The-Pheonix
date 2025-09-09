import React, { useState, useEffect } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import AppleNavbar from "@/components/AppleNavbar";
import PreviewCard from "@/components/PreviewCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Edit, RefreshCw, Clock, Users, BookOpen, Share2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  teacher: string;
  department: string;
}

interface TimetableEntry {
  subject: Subject;
  timeSlot: string;
}

interface StoredTimetableData {
  subjects: Subject[];
  timetableData: { [key: string]: TimetableEntry };
  generatedAt: string;
}

export default function ViewTimetable() {
  const router = useRouter();
  const [storedData, setStoredData] = useState<StoredTimetableData | null>(null);
  const [selectedClass, setSelectedClass] = useState("Class 10A");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetableData = async () => {
      setLoading(true);
      try {
        // Find the most recent timetable whose name matches the selected class
        const { data: timetables, error: timetableError } = await supabase
          .from('timetables')
          .select('*')
          .ilike('name', `%${selectedClass}%`)
          .order('created_at', { ascending: false });

        if (timetableError) {
          throw timetableError;
        }

        const timetable = timetables?.[0];
        if (!timetable) {
          setStoredData(null);
          setLoading(false);
          return;
        }

        // Load all subjects and map by id
        const { data: subjects, error: subjectsError } = await supabase
          .from('subjects')
          .select('*');
        if (subjectsError) {
          throw subjectsError;
        }
        const subjectById = new Map(subjects.map((s: any) => [s.id, s]));

        // Load slots for the timetable
        const { data: slots, error: slotsError } = await supabase
          .from('timetable_slots')
          .select('*')
          .eq('timetable_id', timetable.id);
        if (slotsError) {
          throw slotsError;
        }

        const timetableData: { [key: string]: TimetableEntry } = {};
        for (const slot of slots || []) {
          const subject = subjectById.get(slot.subject_id);
          if (!subject) continue;
          const key = `${slot.day}-${slot.period}`;
          timetableData[key] = {
            subject: {
              id: subject.id,
              name: subject.name,
              code: subject.code,
              color: subject.color,
              teacher: subject.teacher,
              department: subject.department,
            },
            timeSlot: `${slot.start_time}-${slot.end_time}`,
          };
        }

        const formattedData: StoredTimetableData = {
          subjects: subjects.map((subject: any) => ({
            id: subject.id,
            name: subject.name,
            code: subject.code,
            color: subject.color,
            teacher: subject.teacher,
            department: subject.department,
          })),
          timetableData,
          generatedAt: timetable.created_at,
        };

        setStoredData(formattedData);
      } catch (err: any) {
        console.error('Error fetching timetable data:', err?.message || err);
        setStoredData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetableData();
  }, [selectedClass]);

  const exportTimetable = () => {
    if (!storedData) return;
    
    let csvContent = "Day,Period,Time,Subject,Teacher\n";
    Object.entries(storedData.timetableData).forEach(([key, entry]) => {
      const [day, period] = key.split('-');
      csvContent += `${day},${period},${entry.timeSlot},${entry.subject.name},${entry.subject.teacher}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-${selectedClass}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const shareTimetable = () => {
    if (navigator.share && storedData) {
      navigator.share({
        title: `${selectedClass} Timetable`,
        text: `Check out the timetable for ${selectedClass}`,
        url: window.location.href,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh-bg flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <RefreshCw className="h-6 w-6 text-white" />
          </motion.div>
          <p className="text-gray-600">Loading your beautiful timetable...</p>
        </div>
      </div>
    );
  }

  if (!storedData) {
    return (
      <div className="min-h-screen gradient-mesh-bg">
        <AppleNavbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-hero mb-4">No Timetable Found</h1>
            <p className="text-xl text-gray-600 mb-8">
              Create your first timetable to get started with beautiful scheduling.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/create')}
              className="interactive-button px-8 py-4 text-white font-semibold text-lg rounded-2xl"
            >
              Create Timetable
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>View Timetable - EduSchedule</title>
        <meta name="description" content="View your beautiful school timetable with Apple-inspired design" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen gradient-mesh-bg">
        <AppleNavbar />

        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-72 h-72 gradient-secondary opacity-10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 gradient-primary opacity-15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Header */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
          >
            <div>
              <h1 className="text-hero mb-4">
                Your Perfect
                <span className="block text-display">Schedule</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl">
                Generated on {new Date(storedData.generatedAt).toLocaleDateString()} • 
                Beautiful, organized, and ready to use.
              </p>
            </div>

            <div className="flex items-center space-x-4 mt-6 lg:mt-0">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="glass-card w-48 border-0">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Class 10A">Class 10A</SelectItem>
                  <SelectItem value="Class 10B">Class 10B</SelectItem>
                  <SelectItem value="Class 11A">Class 11A</SelectItem>
                  <SelectItem value="Class 11B">Class 11B</SelectItem>
                </SelectContent>
              </Select>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/create')}
                className="glass-card px-6 py-3 rounded-2xl font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Edit className="w-5 h-5 mr-2 inline" />
                Edit
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportTimetable}
                className="interactive-button px-6 py-3 text-white font-semibold rounded-2xl"
              >
                <Download className="w-5 h-5 mr-2 inline" />
                Export
              </motion.button>
            </div>
          </motion.div>

          {/* Timetable Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PreviewCard
              title={`${selectedClass} Weekly Schedule`}
              timetableData={storedData.timetableData}
              onExport={exportTimetable}
              onShare={shareTimetable}
            />
          </motion.div>
        </div>
      </div>
    </>
  );
}