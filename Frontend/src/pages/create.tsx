import React, { useState, useEffect } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import AppleNavbar from "@/components/AppNavbar";
import TimetableGrid from "@/components/TimetableGrid";
import SubjectSelector from "@/components/SubjectSelector";
import { Settings, Save, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface TimetableGridProps {
  subjects: Subject[];
  timetableData: { [key: string]: TimetableEntry };
  onUpdateTimetable: (key: string, entry: TimetableEntry | null) => void;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  teacher: string;
  department: string;
}

interface SubjectSelectorProps {
  subjects: Subject[];
  onAddSubject: (newSubject: Omit<Subject, 'id'>) => Promise<void>;
  onRemoveSubject: (id: string) => Promise<void>;
  onUpdateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
}

interface TimetableEntry {
  subject: Subject;
  timeSlot: string;
}

export default function CreateTimetable() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetableData, setTimetableData] = useState<{ [key: string]: TimetableEntry }>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase
        .from('Subjects_Clg')
        .select('*')
        .eq('User_id', localStorage.getItem('userId'));

      if (error) {
        toast({
          title: "Error loading subjects",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Extract subjects from the details field
        const allSubjects = data?.flatMap(row => 
          row.details?.subjects || []
        ).map(subject => ({
          id: subject.Subject_ID,
          name: subject.Subject_Name,
          code: subject.Subject_Code,
          department: subject.Department,
          color: subject.color || '#3B82F6',
          teacher: subject.teacher || ''
        })) || [];
        setSubjects(allSubjects);
      }
    };

    fetchSubjects();
  }, []);

  const handleAddSubject = async (newSubject: Omit<Subject, 'id'>) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    const subjectData = {
      Subject_ID: crypto.randomUUID(),
      Subject_Name: newSubject.name,
      Subject_Code: newSubject.code,
      Department: newSubject.department,
      Credits: 3, // Default value
      Subject_Type: "Theory", // Default value
      color: newSubject.color,
      teacher: newSubject.teacher
    };

    // Check if user already has subjects data
    const { data: existingData } = await supabase
      .from('Subjects_Clg')
      .select('*')
      .eq('User_id', userId)
      .single();

    if (existingData) {
      // Update existing record
      const currentSubjects = existingData.details?.subjects || [];
      const updatedSubjects = [...currentSubjects, subjectData];
      
      const { error } = await supabase
        .from('Subjects_Clg')
        .update({
          details: { subjects: updatedSubjects }
        })
        .eq('User_id', userId);

      if (error) {
        toast({
          title: "Error adding subject",
          description: error.message,
          variant: "destructive",
        });
      } else {
        const subject: Subject = {
          id: subjectData.Subject_ID,
          name: subjectData.Subject_Name,
          code: subjectData.Subject_Code,
          department: subjectData.Department,
          color: subjectData.color,
          teacher: subjectData.teacher
        };
        setSubjects([...subjects, subject]);
        toast({
          title: "Subject Added",
          description: `${subject.name} has been added successfully.`,
        });
      }
    } else {
      // Create new record
      const { error } = await supabase
        .from('Subjects_Clg')
        .insert([{
          User_id: userId,
          details: { subjects: [subjectData] }
        }]);

      if (error) {
        toast({
          title: "Error adding subject",
          description: error.message,
          variant: "destructive",
        });
      } else {
        const subject: Subject = {
          id: subjectData.Subject_ID,
          name: subjectData.Subject_Name,
          code: subjectData.Subject_Code,
          department: subjectData.Department,
          color: subjectData.color,
          teacher: subjectData.teacher
        };
        setSubjects([...subjects, subject]);
        toast({
          title: "Subject Added",
          description: `${subject.name} has been added successfully.`,
        });
      }
    }
  };

  const handleRemoveSubject = async (id: string) => {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error removing subject",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSubjects(subjects.filter(s => s.id !== id));
      // Remove from timetable as well
      const newTimetableData = { ...timetableData };
      Object.keys(newTimetableData).forEach(key => {
        if (newTimetableData[key].subject.id === id) {
          delete newTimetableData[key];
        }
      });
      setTimetableData(newTimetableData);
    }
  };

  const handleUpdateSubject = async (id: string, updates: Partial<Subject>) => {
    const { error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        title: "Error updating subject",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSubjects(subjects.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const handleUpdateTimetable = (key: string, entry: TimetableEntry | null) => {
    if (entry) {
      setTimetableData({ ...timetableData, [key]: entry });
    } else {
      const newData = { ...timetableData };
      delete newData[key];
      setTimetableData(newData);
    }
  };

  const handleSaveTimetable = () => {
    const timetableToSave = {
      subjects,
      timetableData,
      generatedAt: new Date().toISOString()
    };
    localStorage.setItem('timetableData', JSON.stringify(timetableToSave));
    
    toast({
      title: "Timetable Saved!",
      description: "Your timetable has been saved successfully.",
    });
  };

  const handlePreviewTimetable = () => {
    const timetableToSave = {
      subjects,
      timetableData,
      generatedAt: new Date().toISOString()
    };
    localStorage.setItem('timetableData', JSON.stringify(timetableToSave));
    router.push('/view');
  };

  return (
    <>
      <Head>
        <title>Create Timetable - EduSchedule</title>
        <meta name="description" content="Create beautiful school timetables with our interactive builder" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen gradient-mesh-bg">
        <AppleNavbar />

        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 gradient-tertiary opacity-10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 gradient-quaternary opacity-15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
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
                Build Your
                <span className="block text-display">Perfect Schedule</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl">
                Create beautiful, conflict-free timetables with our intuitive drag-and-drop interface.
              </p>
            </div>

            <div className="flex items-center space-x-4 mt-6 lg:mt-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(true)}
                className="glass-card px-6 py-3 rounded-2xl font-semibold text-gray-700 hover:text-gray-900 transition-colors lg:hidden"
              >
                <Settings className="w-5 h-5 mr-2 inline" />
                Manage Subjects
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveTimetable}
                className="glass-card px-6 py-3 rounded-2xl font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Save className="w-5 h-5 mr-2 inline" />
                Save
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePreviewTimetable}
                className="interactive-button px-6 py-3 text-white font-semibold rounded-2xl"
              >
                <Eye className="w-5 h-5 mr-2 inline" />
                Preview
              </motion.button>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex gap-8">
            {/* Timetable Grid */}
            <div className="flex-1">
              <TimetableGrid
                subjects={subjects}
                timetableData={timetableData}
                onUpdateTimetable={handleUpdateTimetable}
              />
            </div>

            {/* Subject Selector Sidebar - Desktop */}
            <div className="hidden lg:block">
              <SubjectSelector
                isOpen={true}
                onToggle={() => {}}
                userId={localStorage.getItem('userId') || ''}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}