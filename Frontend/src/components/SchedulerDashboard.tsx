import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Clock,
  BookOpen,
  Calendar,
  Zap,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "@/lib/context/AuthContext";
import { getBackendUrl, getAuthHeaders } from "@/lib/backendApi";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

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

const SchedulerDashboard: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<ScheduleAnalytics | null>(null);
  const [teacherWorkload, setTeacherWorkload] = useState<Record<string, TeacherWorkload>>({});
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "workload" | "optimization">("overview");

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
      if (!userId) return;

      const backend = getBackendUrl();
      const headers = getAuthHeaders();

      const [analyticsResponse, workloadResponse, conflictsResponse] = await Promise.allSettled([
        axios.get(`${backend}/scheduler/analytics/${userId}`, { headers }),
        axios.get(`${backend}/scheduler/teacher-workload/${userId}`, { headers }),
        axios.get(`${backend}/scheduler/conflicts/${userId}`, { headers }),
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadAnalytics();
    }
  }, [isLoggedIn, loadAnalytics]);

  const optimizeSchedule = async () => {
    try {
      setIsOptimizing(true);
      const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
      if (!userId) {
        toast({
          title: "Session Expired",
          description: "Please sign in to optimize schedule.",
          variant: "destructive",
        });
        return;
      }

      const backend = getBackendUrl();
      const headers = getAuthHeaders();

      const response = await axios.post(`${backend}/scheduler/optimize/${userId}`, {}, { headers });
      if (response.data.status === "success") {
        toast({
          title: "Schedule Optimized",
          description: "Workload rebalanced successfully.",
        });
        loadAnalytics();
      } else {
        throw new Error(response.data.message || "Failed to optimize schedule");
      }
    } catch (error: any) {
      toast({
        title: "Optimization Notice",
        description: error.response?.data?.detail || error.message || "Error optimizing schedule.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="p-8 rounded-xl border border-[#23252E] bg-[#14151A] space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-100">Sign In Required</h3>
          <p className="text-xs text-zinc-400">Please log in to view schedule analytics.</p>
        </div>
      </div>
    );
  }

  if (loading && !analytics) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="p-8 rounded-xl border border-[#23252E] bg-[#14151A] space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin text-zinc-400 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-200">Loading Analytics</h3>
          <p className="text-xs text-zinc-500">Evaluating timetable statistics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="p-8 rounded-xl border border-[#23252E] bg-[#14151A] space-y-3">
          <BookOpen className="w-8 h-8 text-zinc-500 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-100">No Analytics Found</h3>
          <p className="text-xs text-zinc-400">
            Generate a timetable first to review metrics and workload distribution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[#23252E] gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Schedule Analytics
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Overview of timetable efficiency, teacher workloads, and optimization status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={optimizeSchedule}
            disabled={isOptimizing}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? "animate-spin" : ""}`} />
            <span>{isOptimizing ? "Optimizing..." : "Re-Optimize Schedule"}</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-[#23252E] bg-[#14151A] flex items-center gap-3">
          <Calendar className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <div>
            <div className="text-lg font-bold font-mono text-zinc-100">
              {analytics.schedule_stats?.total_classes || 0}
            </div>
            <div className="text-[11px] text-zinc-500">Total Classes</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#23252E] bg-[#14151A] flex items-center gap-3">
          <Clock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <div>
            <div className="text-lg font-bold font-mono text-zinc-100">
              {analytics.schedule_stats?.total_periods_scheduled || 0}
            </div>
            <div className="text-[11px] text-zinc-500">Periods Scheduled</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#23252E] bg-[#14151A] flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <div>
            <div className="text-lg font-bold font-mono text-zinc-100">
              {analytics.schedule_stats?.unique_subjects || 0}
            </div>
            <div className="text-[11px] text-zinc-500">Unique Subjects</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#23252E] bg-[#14151A] flex items-center gap-3">
          <Users className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <div>
            <div className="text-lg font-bold font-mono text-zinc-100">
              {analytics.schedule_stats?.unique_teachers || 0}
            </div>
            <div className="text-[11px] text-zinc-500">Faculty Members</div>
          </div>
        </div>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="p-3.5 rounded-lg bg-[#24171A] border border-[#44232B] text-xs flex items-start gap-2.5">
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

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#14151A] border border-[#23252E] max-w-sm">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "workload", label: "Faculty Workload", icon: Users },
          { id: "optimization", label: "Recommendations", icon: Zap },
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

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-[#23252E] bg-[#14151A] space-y-4">
            <h3 className="text-xs font-semibold text-zinc-200">Efficiency Metrics</h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono text-zinc-400">
                  <span>Periods per Class</span>
                  <span className="text-zinc-100 font-semibold">
                    {analytics.schedule_stats?.average_periods_per_class || 0}
                  </span>
                </div>
                <Progress
                  value={(analytics.schedule_stats?.average_periods_per_class || 0) * 12}
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
            <h3 className="font-semibold text-zinc-200">Quality Summary</h3>
            <div className="space-y-2 font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-[#181920] border border-[#23252E]">
                <span className="text-zinc-400">Conflicts Detected</span>
                <span className={conflicts.length === 0 ? "text-emerald-400" : "text-rose-400"}>
                  {conflicts.length === 0 ? "0 Issues" : `${conflicts.length} Issues`}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#181920] border border-[#23252E]">
                <span className="text-zinc-400">Scheduling Method</span>
                <span className="text-zinc-300">
                  {analytics.generation_method === "smart_scheduler" ? "Smart Engine" : "Standard"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Workload */}
      {activeTab === "workload" && (
        <div className="rounded-xl border border-[#23252E] bg-[#14151A] p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#23252E] pb-3 text-xs">
            <h3 className="font-semibold text-zinc-200">Teacher Assignments</h3>
            <span className="text-zinc-500 font-mono">
              {Object.keys(teacherWorkload).length} teachers
            </span>
          </div>

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
                      ({workload.subjects_taught} subjects assigned)
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

      {/* Tab: Recommendations */}
      {activeTab === "optimization" && (
        <div className="rounded-xl border border-[#23252E] bg-[#14151A] p-5 space-y-3 text-xs">
          <h3 className="font-semibold text-zinc-200 border-b border-[#23252E] pb-3">
            Schedule Insights
          </h3>

          <div className="space-y-2">
            {conflicts.length > 0 && (
              <div className="p-3 rounded-lg bg-[#24171A] border border-[#44232B] text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Resolve {conflicts.length} conflicts to achieve zero overlaps.</span>
              </div>
            )}

            {Object.values(teacherWorkload).some((t) => t.workload_status === "overloaded") && (
              <div className="p-3 rounded-lg bg-[#24171A] border border-[#44232B] text-rose-300 flex items-center gap-2">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>Some faculty members are assigned above their max credit capacity.</span>
              </div>
            )}

            {conflicts.length === 0 &&
              !Object.values(teacherWorkload).some((t) => t.workload_status === "overloaded") && (
                <div className="p-3 rounded-lg bg-[#14261F] border border-[#203D32] text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Your schedule is balanced and conflict-free.</span>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulerDashboard;
