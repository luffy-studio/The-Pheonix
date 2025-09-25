import React, { useState, useEffect } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import AppleNavbar from "@/components/AppNavbar";
import PreviewCard from "@/components/PreviewCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Edit, RefreshCw, Clock, Users, BookOpen, Share2, BarChart3, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";

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

interface ScheduleAnalytics {
  generation_method: string;
  teacher_workload: Record<string, TeacherWorkload>;
  validation_issues: string[];
  schedule_stats: {
    total_classes: number;
    total_periods_scheduled: number;
    unique_subjects: number;
    unique_teachers: number;
    average_periods_per_class: number;
  };
  efficiency_metrics: Record<string, any>;
}

interface TeacherWorkload {
  current_load: number;
  max_capacity: number;
  utilization_percent: number;
  subjects_taught: number;
  workload_status?: 'overloaded' | 'optimal' | 'underutilized' | 'good';
}

export default function ViewTimetable() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [storedData, setStoredData] = useState<StoredTimetableData | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ScheduleAnalytics | null>(null);
  const [teacherWorkload, setTeacherWorkload] = useState<Record<string, TeacherWorkload>>({});
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('timetable');

  useEffect(() => {
    const fetchTimetableData = async () => {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userId = localStorage.getItem("userId");
        console.log("User ID from localStorage:", userId);
        
        if (!userId) {
          console.log("No userId found in localStorage");
          setStoredData(null);
          setLoading(false);
          return;
        }

        // Fetch timetable data and analytics in parallel
        await Promise.all([
          fetchTimetableFromSupabase(userId),
          fetchAnalyticsData(userId)
        ]);

      } catch (err: any) {
        console.error('Error fetching data:', err?.message || err);
        setStoredData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetableData();
  }, [isLoggedIn, selectedClass]);

  const fetchAnalyticsData = async (userId: string) => {
    try {
      // Load analytics
      const analyticsResponse = await axios.get(`http://localhost:8000/scheduler/analytics/${userId}`);
      if (analyticsResponse.data.status === 'success') {
        setAnalytics(analyticsResponse.data.data);
      }

      // Load teacher workload
      const workloadResponse = await axios.get(`http://localhost:8000/scheduler/teacher-workload/${userId}`);
      if (workloadResponse.data.status === 'success') {
        setTeacherWorkload(workloadResponse.data.data);
      }

      // Load conflicts
      const conflictsResponse = await axios.get(`http://localhost:8000/scheduler/conflicts/${userId}`);
      if (conflictsResponse.data.status === 'success') {
        setConflicts(conflictsResponse.data.conflicts || []);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const fetchTimetableFromSupabase = async (userId: string) => {
    try {
      // Fetch timetable data directly from Supabase
      const { data: supabaseData, error } = await supabase
        .from('Timetables_Clg')
        .select('details')
        .eq('User_id', userId)
        .order('timetable_id', { ascending: false })
        .limit(1);
      
      console.log("Supabase query result:", { supabaseData, error, userId });
      
      if (error) {
        console.error('Error fetching timetable data:', error);
        setStoredData(null);
        return;
      }

      if (!supabaseData || supabaseData.length === 0) {
        console.log("No timetable data found - empty result");
        setStoredData(null);
        return;
      }

      if (!supabaseData[0] || !supabaseData[0].details) {
        console.log("No details found in first record");
        setStoredData(null);
        return;
      }

      // Extract timetable entries from the details JSONB column
      const timetableEntries = supabaseData[0].details;
      
      console.log("Raw timetable data structure type:", typeof timetableEntries);
      
      // Handle different possible data structures
      let entriesArray = [];
      if (Array.isArray(timetableEntries)) {
        entriesArray = timetableEntries;
      } else if (timetableEntries && typeof timetableEntries === 'object') {
        // Check for 'classes' property (as seen in the console log)
        if (timetableEntries.classes && Array.isArray(timetableEntries.classes)) {
          entriesArray = timetableEntries.classes;
        } else if (timetableEntries.entries && Array.isArray(timetableEntries.entries)) {
          entriesArray = timetableEntries.entries;
        } else if (timetableEntries.timetable && Array.isArray(timetableEntries.timetable)) {
          entriesArray = timetableEntries.timetable;
        } else {
          // If it's a flat object with class keys, convert to array
          try {
            const values = Object.values(timetableEntries);
            entriesArray = values.flat().filter(item => item && typeof item === 'object');
          } catch (e) {
            console.error("Error processing timetable object:", e);
            entriesArray = [];
          }
        }
      }
      
      console.log("Processed entries array length:", entriesArray ? entriesArray.length : 'undefined');
      
      // Safety check for entriesArray
      if (!Array.isArray(entriesArray) || entriesArray.length === 0) {
        console.log("No valid entries found in timetable data");
        setStoredData(null);
        return;
      }
      
      // Get all available classes
      const classSet = new Set<string>();
      
      entriesArray.forEach((entry: any, index: number) => {
        if (entry && entry.class_name && typeof entry.class_name === 'string') {
          classSet.add(entry.class_name);
        }
      });
      
      const classes = Array.from(classSet);
      console.log("Available classes found:", classes);
      setAvailableClasses(classes);
      
      // Set first class as default if no class is selected
      if (!selectedClass && classes.length > 0) {
        setSelectedClass(classes[0]);
      }

      // Filter entries for selected class
      const targetClass = selectedClass || classes[0];
      console.log("Filtering for class:", targetClass);
      
      const currentClassEntries = entriesArray.filter((entry: any) => {
        return entry && entry.class_name === targetClass;
      });
      
      console.log("Filtered entries for current class:", currentClassEntries.length, "entries");
      
      // Convert backend data to frontend format
      const formattedTimetableData: { [key: string]: TimetableEntry } = {};
      const uniqueSubjects = new Map<string, Subject>();

      // Color palette for subjects
      const colors = [
        'bg-gradient-to-r from-blue-500 to-purple-500',
        'bg-gradient-to-r from-green-500 to-blue-500',
        'bg-gradient-to-r from-purple-500 to-pink-500',
        'bg-gradient-to-r from-orange-500 to-red-500',
        'bg-gradient-to-r from-indigo-500 to-purple-500',
        'bg-gradient-to-r from-teal-500 to-green-500',
        'bg-gradient-to-r from-pink-500 to-rose-500',
        'bg-gradient-to-r from-cyan-500 to-blue-500'
      ];

      // Process the schedule for the selected class
      if (currentClassEntries.length > 0) {
        const selectedClassData = currentClassEntries[0]; // Get the first matching class
        const schedule = selectedClassData.schedule || [];
        
        console.log("Processing schedule for class:", selectedClassData.class_name, schedule);
        
        schedule.forEach((scheduleEntry: any, index: number) => {
          // Only log the first few entries to avoid spam
          if (index < 3) {
            console.log(`Schedule entry ${index} detailed:`, scheduleEntry);
          }
          
          if (scheduleEntry && scheduleEntry.subject && scheduleEntry.day && scheduleEntry.period !== undefined) {
            const key = `${scheduleEntry.day}-${scheduleEntry.period}`;
            const subject: Subject = {
              id: scheduleEntry.subject,
              name: scheduleEntry.subject,
              code: scheduleEntry.subject.length > 3 ? scheduleEntry.subject.substring(0, 3).toUpperCase() : scheduleEntry.subject.toUpperCase(),
              color: colors[Math.abs(scheduleEntry.subject.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % colors.length],
              teacher: scheduleEntry.teacher || 'TBA',
              department: "General"
            };

            uniqueSubjects.set(scheduleEntry.subject, subject);
            
            formattedTimetableData[key] = {
              subject,
              timeSlot: scheduleEntry.start_time && scheduleEntry.end_time 
                ? `${scheduleEntry.start_time}-${scheduleEntry.end_time}`
                : `${8 + scheduleEntry.period}:00-${9 + scheduleEntry.period}:00`
            };
          }
        });
      }

      const formattedData: StoredTimetableData = {
        subjects: Array.from(uniqueSubjects.values()) as Subject[],
        timetableData: formattedTimetableData,
        generatedAt: new Date().toISOString(),
      };

      setStoredData(formattedData);
    } catch (err: any) {
      console.error('Error fetching timetable data:', err?.message || err);
      setStoredData(null);
    }
  };

  const exportTimetable = () => {
    if (!storedData || !storedData.timetableData) {
      console.warn("No timetable available for export");
      return;
    }

    // CSV value escaper
    const escapeCsv = (v: any) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows: string[] = [];
    rows.push(["Day", "Period", "Time", "Subject", "Teacher"].map(escapeCsv).join(","));

    Object.entries(storedData.timetableData).forEach(([key, entry]) => {
      const [day = "", period = ""] = String(key).split("-");
      const time = entry?.timeSlot ?? "";
      const subjectName = entry?.subject?.name ?? entry?.subject ?? "";
      const teacherName = entry?.subject?.teacher ?? entry?.subject?.teacher ?? "";
      rows.push([day, period, time, subjectName, teacherName].map(escapeCsv).join(","));
    });

    const csv = rows.join("\r\n");
    const base = selectedClass || availableClasses[0] || "timetable";
    const safeBase = base.replace(/[^\w\-]+/g, "_");
    const filename = `timetable-${safeBase}.csv`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
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

  const getWorkloadStatusColor = (status?: string) => {
    switch (status) {
      case 'overloaded': return 'destructive';
      case 'optimal': return 'default';
      case 'good': return 'secondary';
      case 'underutilized': return 'outline';
      default: return 'secondary';
    }
  };

  const getWorkloadStatusIcon = (status?: string) => {
    switch (status) {
      case 'overloaded': return <AlertTriangle className="w-4 h-4" />;
      case 'optimal': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <TrendingUp className="w-4 h-4" />;
      case 'underutilized': return <Clock className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  if (!isLoggedIn) {
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
            <h1 className="text-hero mb-4">Please Log In</h1>
            <p className="text-xl text-gray-600 mb-8">
              You need to be logged in to view your timetable.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/login')}
              className="interactive-button px-8 py-4 text-white font-semibold text-lg rounded-2xl"
            >
              Log In
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

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
              Generate your first timetable to get started with beautiful scheduling.
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
                  {availableClasses.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
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

          {/* Validation Issues Alert */}
          {conflicts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-red-800 font-semibold">Schedule Conflicts Detected</h4>
                    <ul className="mt-2 text-red-700 text-sm space-y-1">
                      {conflicts.slice(0, 3).map((conflict, index) => (
                        <li key={index}>• {conflict}</li>
                      ))}
                      {conflicts.length > 3 && (
                        <li className="text-red-600">...and {conflicts.length - 3} more issues</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Analytics Summary */}
          {analytics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Classes</p>
                        <p className="text-2xl font-bold">{analytics.schedule_stats?.total_classes || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Clock className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Periods</p>
                        <p className="text-2xl font-bold">{analytics.schedule_stats?.total_periods_scheduled || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Subjects</p>
                        <p className="text-2xl font-bold">{analytics.schedule_stats?.unique_subjects || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Users className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Teachers</p>
                        <p className="text-2xl font-bold">{analytics.schedule_stats?.unique_teachers || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Tabs for Timetable and Analytics */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 glass-card border-0">
              <TabsTrigger value="timetable" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Timetable</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="teachers" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Teachers</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timetable" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <PreviewCard
                  title={`${selectedClass} Weekly Schedule`}
                  timetableData={storedData.timetableData}
                  onExport={exportTimetable}
                  onShare={shareTimetable}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              {analytics ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  {/* Schedule Efficiency */}
                  <Card className="glass-card border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5" />
                        <span>Schedule Efficiency</span>
                      </CardTitle>
                      <CardDescription>
                        Overview of your timetable efficiency metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Periods per Class</span>
                            <span>{analytics.schedule_stats?.average_periods_per_class || 0}</span>
                          </div>
                          <Progress 
                            value={(analytics.schedule_stats?.average_periods_per_class || 0) * 10} 
                            className="h-2"
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Teacher Utilization</span>
                            <span>
                              {Object.values(teacherWorkload).length > 0 
                                ? Math.round(Object.values(teacherWorkload).reduce((acc, teacher) => acc + teacher.utilization_percent, 0) / Object.values(teacherWorkload).length)
                                : 0}%
                            </span>
                          </div>
                          <Progress 
                            value={Object.values(teacherWorkload).length > 0 
                              ? Object.values(teacherWorkload).reduce((acc, teacher) => acc + teacher.utilization_percent, 0) / Object.values(teacherWorkload).length
                              : 0} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Schedule Quality */}
                  <Card className="glass-card border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Schedule Quality</span>
                      </CardTitle>
                      <CardDescription>
                        Quality metrics and validation status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Conflicts Detected</span>
                          <Badge variant={conflicts.length > 0 ? "destructive" : "default"}>
                            {conflicts.length} issues
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Schedule Method</span>
                          <Badge variant="outline">
                            {analytics.generation_method === 'smart_scheduler' ? 'Smart' : 'Legacy'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Overall Quality</span>
                          <Badge variant={conflicts.length === 0 ? "default" : "secondary"}>
                            {conflicts.length === 0 ? 'Excellent' : 'Needs Review'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <Card className="glass-card border-0">
                  <CardContent className="p-8 text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No analytics data available.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="teachers" className="mt-6">
              {Object.keys(teacherWorkload).length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Card className="glass-card border-0">
                    <CardHeader>
                      <CardTitle>Teacher Workload Distribution</CardTitle>
                      <CardDescription>
                        Detailed breakdown of teaching assignments and capacity utilization
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(teacherWorkload).map(([teacherName, workload]) => (
                          <div key={teacherName} className="border rounded-lg p-4 bg-white/50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                  {teacherName.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-semibold">{teacherName}</h4>
                                  <p className="text-sm text-gray-600">
                                    {workload.subjects_taught} subjects assigned
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getWorkloadStatusIcon(workload.workload_status)}
                                <Badge variant={getWorkloadStatusColor(workload.workload_status)}>
                                  {workload.workload_status || 'unknown'}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Workload: {workload.current_load}/{workload.max_capacity} hours</span>
                                <span>{workload.utilization_percent}%</span>
                              </div>
                              <Progress 
                                value={workload.utilization_percent} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <Card className="glass-card border-0">
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No teacher workload data available.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}