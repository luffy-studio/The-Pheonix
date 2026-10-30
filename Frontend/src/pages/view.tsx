import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AppNavbar from "@/components/AppNavbar";
import PreviewCard from "@/components/PreviewCard";
import {
  Calendar,
  Download,
  Edit,
  RefreshCw,
  Clock,
  Users,
  BookOpen,
  Share2,
  BarChart3,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/context/AuthContext";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import { getBackendUrl, getAuthHeaders } from "@/lib/backendApi";

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
  workload_status?: "overloaded" | "optimal" | "underutilized" | "good";
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
  const [activeTab, setActiveTab] = useState<"timetable" | "analytics" | "teachers">("timetable");

  const fetchAnalyticsData = useCallback(async (userId: string) => {
    try {
      const backendUrl = getBackendUrl();
      const headers = getAuthHeaders();

      const [analyticsResponse, workloadResponse, conflictsResponse] = await Promise.allSettled([
        axios.get(`${backendUrl}/scheduler/analytics/${userId}`, { headers }),
        axios.get(`${backendUrl}/scheduler/teacher-workload/${userId}`, { headers }),
        axios.get(`${backendUrl}/scheduler/conflicts/${userId}`, { headers }),
      ]);

      if (analyticsResponse.status === "fulfilled" && analyticsResponse.value.data?.status === "success") {
        setAnalytics(analyticsResponse.value.data.data);
      }
      if (workloadResponse.status === "fulfilled" && workloadResponse.value.data?.status === "success") {
        setTeacherWorkload(workloadResponse.value.data.data);
      }
      if (conflictsResponse.status === "fulfilled" && conflictsResponse.value.data?.status === "success") {
        setConflicts(conflictsResponse.value.data.conflicts || []);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  }, []);

  const fetchTimetableFromSupabase = useCallback(
    async (userId: string) => {
      try {
        const { data: supabaseData, error } = await supabase
          .from("Timetables_Clg")
          .select("details")
          .eq("User_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error || !supabaseData || supabaseData.length === 0 || !supabaseData[0]?.details) {
          setStoredData(null);
          return;
        }

        const timetableEntries = supabaseData[0].details;
        let entriesArray: any[] = [];

        if (Array.isArray(timetableEntries)) {
          entriesArray = timetableEntries;
        } else if (timetableEntries && typeof timetableEntries === "object") {
          if (timetableEntries.classes && Array.isArray(timetableEntries.classes)) {
            entriesArray = timetableEntries.classes;
          } else if (timetableEntries.entries && Array.isArray(timetableEntries.entries)) {
            entriesArray = timetableEntries.entries;
          } else if (timetableEntries.timetable && Array.isArray(timetableEntries.timetable)) {
            entriesArray = timetableEntries.timetable;
          } else {
            try {
              entriesArray = Object.values(timetableEntries)
                .flat()
                .filter((item) => item && typeof item === "object");
            } catch {
              entriesArray = [];
            }
          }
        }

        if (!Array.isArray(entriesArray) || entriesArray.length === 0) {
          setStoredData(null);
          return;
        }

        const classSet = new Set<string>();
        entriesArray.forEach((entry: any) => {
          if (entry && entry.class_name && typeof entry.class_name === "string") {
            classSet.add(entry.class_name);
          }
        });

        const classes = Array.from(classSet);
        setAvailableClasses(classes);

        const targetClass = selectedClass || classes[0] || "";
        if (!selectedClass && classes.length > 0) {
          setSelectedClass(classes[0]);
        }

        const currentClassEntries = entriesArray.filter((entry: any) => entry?.class_name === targetClass);

        const formattedTimetableData: { [key: string]: TimetableEntry } = {};
        const uniqueSubjects = new Map<string, Subject>();

        const colors = [
          "bg-blue-500",
          "bg-indigo-500",
          "bg-violet-500",
          "bg-emerald-500",
          "bg-teal-500",
          "bg-amber-500",
        ];

        if (currentClassEntries.length > 0) {
          const selectedClassData = currentClassEntries[0];
          const schedule = selectedClassData.schedule || [];

          schedule.forEach((scheduleEntry: any) => {
            if (
              scheduleEntry &&
              scheduleEntry.subject &&
              scheduleEntry.day &&
              scheduleEntry.period !== undefined
            ) {
              const key = `${scheduleEntry.day}-${scheduleEntry.period}`;
              const subject: Subject = {
                id: scheduleEntry.subject,
                name: scheduleEntry.subject,
                code:
                  scheduleEntry.subject.length > 4
                    ? scheduleEntry.subject.substring(0, 4).toUpperCase()
                    : scheduleEntry.subject.toUpperCase(),
                color:
                  colors[
                    Math.abs(
                      scheduleEntry.subject.split("").reduce((a: number, b: string) => a + b.charCodeAt(0), 0)
                    ) % colors.length
                  ],
                teacher: scheduleEntry.teacher || "TBA",
                department: "General",
              };

              uniqueSubjects.set(scheduleEntry.subject, subject);

              formattedTimetableData[key] = {
                subject,
                timeSlot:
                  scheduleEntry.start_time && scheduleEntry.end_time
                    ? `${scheduleEntry.start_time} - ${scheduleEntry.end_time}`
                    : `0${8 + scheduleEntry.period}:00 - 0${9 + scheduleEntry.period}:00`,
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
        console.error("Error fetching timetable data:", err?.message || err);
        setStoredData(null);
      }
    },
    [selectedClass]
  );

  useEffect(() => {
    const fetchTimetableData = async () => {
      setLoading(true);
      try {
        const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
        if (!userId) {
          setStoredData(null);
          setLoading(false);
          return;
        }

        await Promise.all([fetchTimetableFromSupabase(userId), fetchAnalyticsData(userId)]);
      } catch (err: any) {
        console.error("Error fetching data:", err?.message || err);
        setStoredData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetableData();
  }, [fetchTimetableFromSupabase, fetchAnalyticsData]);

  const exportTimetable = () => {
    if (!storedData || !storedData.timetableData) return;

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
      const teacherName = entry?.subject?.teacher ?? "";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0F12] text-zinc-200 flex items-center justify-center">
        <div className="p-6 rounded-xl border border-[#23252E] bg-[#14151A] text-center max-w-xs space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin text-zinc-400 mx-auto" />
          <h2 className="text-sm font-semibold text-zinc-200">Loading Schedule</h2>
          <p className="text-xs text-zinc-500">Querying active timetable records...</p>
        </div>
      </div>
    );
  }

  if (!storedData) {
    return (
      <div className="min-h-screen bg-[#0E0F12] text-zinc-200">
        <AppNavbar />
        <div className="max-w-md mx-auto px-4 py-32 text-center">
          <div className="p-8 rounded-xl border border-[#23252E] bg-[#14151A] space-y-3">
            <Calendar className="w-8 h-8 text-zinc-500 mx-auto" />
            <h2 className="text-base font-bold text-zinc-100">No Timetable Generated</h2>
            <p className="text-xs text-zinc-400">
              Upload your faculty and course structure, then generate your first schedule.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => router.push("/create")}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833]"
              >
                Setup Data
              </button>
              <button
                onClick={() => router.push("/generate")}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>View Timetables — The Phoenix</title>
        <meta
          name="description"
          content="Review active schedules, conflict validations, and faculty assignments."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-[#0E0F12] text-zinc-200">
        <AppNavbar />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-6 border-b border-[#23252E] gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                Academic Timetable
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Viewing schedule for cohort{" "}
                <span className="text-zinc-200 font-semibold">{selectedClass || "Class"}</span> •
                Generated on {new Date(storedData.generatedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {availableClasses.length > 0 && (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#14151A] border border-[#23252E] text-zinc-200 text-xs font-medium focus:outline-none"
                >
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      Cohort: {cls}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => router.push("/create")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5 text-zinc-400" />
                <span>Edit Data</span>
              </button>

              <button
                type="button"
                onClick={exportTimetable}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Conflict Alert */}
          {conflicts.length > 0 && (
            <div className="mb-6 p-3.5 rounded-lg bg-[#24171A] border border-[#44232B] text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-rose-300">Schedule Conflicts Detected</h4>
                <ul className="mt-1 space-y-0.5 text-rose-200/90 font-mono text-[11px]">
                  {conflicts.slice(0, 3).map((conflict, i) => (
                    <li key={i}>• {conflict}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#14151A] border border-[#23252E] mb-6 max-w-sm">
            {[
              { id: "timetable", label: "Timetable Grid", icon: Calendar },
              { id: "analytics", label: "Quality Audit", icon: BarChart3 },
              { id: "teachers", label: "Faculty Load", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    isActive
                      ? "bg-[#20222B] text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Timetable */}
          {activeTab === "timetable" && (
            <PreviewCard
              title={`${selectedClass} Schedule`}
              timetableData={storedData.timetableData}
              onExport={exportTimetable}
              onShare={shareTimetable}
            />
          )}

          {/* Tab 2: Analytics */}
          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-[#23252E] bg-[#14151A] space-y-4">
                <h3 className="text-xs font-semibold text-zinc-200">Schedule Efficiency</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-mono text-zinc-400">
                      <span>Average Periods / Class</span>
                      <span className="text-zinc-100 font-semibold">
                        {analytics?.schedule_stats?.average_periods_per_class || 0}
                      </span>
                    </div>
                    <Progress
                      value={(analytics?.schedule_stats?.average_periods_per_class || 0) * 12}
                      className="h-1.5 bg-[#23252E]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-mono text-zinc-400">
                      <span>Faculty Utilization</span>
                      <span className="text-zinc-100 font-semibold">
                        {Object.values(teacherWorkload).length > 0
                          ? Math.round(
                              Object.values(teacherWorkload).reduce(
                                (acc, teacher) => acc + teacher.utilization_percent,
                                0
                              ) / Object.values(teacherWorkload).length
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        Object.values(teacherWorkload).length > 0
                          ? Object.values(teacherWorkload).reduce(
                              (acc, teacher) => acc + teacher.utilization_percent,
                              0
                            ) / Object.values(teacherWorkload).length
                          : 0
                      }
                      className="h-1.5 bg-[#23252E]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-[#23252E] bg-[#14151A] space-y-3 text-xs">
                <h3 className="font-semibold text-zinc-200">Validation Checks</h3>
                <div className="space-y-2 font-mono">
                  <div className="flex items-center justify-between p-2 rounded bg-[#181920] border border-[#23252E]">
                    <span className="text-zinc-400">Conflict Count</span>
                    <span className={conflicts.length === 0 ? "text-emerald-400" : "text-rose-400"}>
                      {conflicts.length === 0 ? "0 (Clean)" : `${conflicts.length} Issues`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#181920] border border-[#23252E]">
                    <span className="text-zinc-400">Method</span>
                    <span className="text-zinc-300">
                      {analytics?.generation_method === "smart_scheduler" ? "Smart Engine" : "Standard"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Teachers */}
          {activeTab === "teachers" && (
            <div className="rounded-xl border border-[#23252E] bg-[#14151A] p-5 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-200">Faculty Workload Allocation</h3>
              <div className="grid gap-2">
                {Object.entries(teacherWorkload).map(([teacherName, workload]) => (
                  <div
                    key={teacherName}
                    className="p-3 rounded-lg bg-[#181920] border border-[#23252E] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-zinc-200">{teacherName}</span>
                        <span className="text-[11px] text-zinc-500 ml-2">
                          ({workload.subjects_taught} subjects)
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {workload.current_load} / {workload.max_capacity} hrs ({workload.utilization_percent}%)
                      </span>
                    </div>
                    <Progress value={workload.utilization_percent} className="h-1 bg-[#23252E]" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
