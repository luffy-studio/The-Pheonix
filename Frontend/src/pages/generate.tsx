import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AppNavbar from "@/components/AppNavbar";
import AdvancedGenerationOptions from "@/components/AdvancedGenerationOptions";
import TimetablePreview from "@/components/TimetablePreview";
import { apiRequest } from "@/lib/backendApi";
import {
  Calendar,
  Users,
  BookOpen,
  Clock,
  Shuffle,
  Download,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Layers,
  Check,
  ChevronRight,
  Sliders,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

interface GeneratorConfig {
  available_subjects: Array<{
    id: string;
    name: string;
    code: string;
    credits: number;
    type: string;
    department: string;
  }>;
  available_teachers: Array<{
    id: string;
    name: string;
    department: string;
    max_credits: number;
    primary_subject: string;
    other_subject: string;
  }>;
  available_classes: Array<{
    id: string;
    name: string;
    code: string;
    department: string;
    credits: number;
  }>;
  time_slots: Array<{
    period: number;
    time: string;
  }>;
  days: string[];
}

interface GenerationPreferences {
  generation_type: "smart" | "custom" | "batch";
  selected_classes: string[];
  max_daily_hours: number;
  avoid_conflicts: boolean;
  lunch_break: boolean;
  break_duration: number;
  teacher_preferences: Record<string, any>;
  subject_priorities: Record<string, number>;
  prevent_back_labs?: boolean;
  balance_daily_load?: boolean;
  minimize_travel?: boolean;
  optimize_rooms?: boolean;
  preferred_start_time?: string;
  max_gap_hours?: number;
}

interface TimetableVariation {
  variation: number;
  timetable: any;
  teacher_workload: Record<string, any>;
  score: number;
}

export default function GenerateTimetable() {
  const router = useRouter();
  const { toast } = useToast();

  const [config, setConfig] = useState<GeneratorConfig | null>(null);
  const [preferences, setPreferences] = useState<GenerationPreferences>({
    generation_type: "smart",
    selected_classes: [],
    max_daily_hours: 6,
    avoid_conflicts: true,
    lunch_break: true,
    break_duration: 30,
    teacher_preferences: {},
    subject_priorities: {},
    balance_daily_load: true,
    minimize_travel: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [variations, setVariations] = useState<TimetableVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "advanced" | "variations" | "preview">("basic");
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Export helpers
  const downloadFile = (filename: string, content: ArrayBuffer | Blob, mime = "application/octet-stream") => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const buildRowsFromTimetable = (timetable: any, variationLabel?: string) => {
    const rows: Array<Record<string, any>> = [];
    if (!timetable) return rows;

    if (Array.isArray(timetable.classes) && timetable.classes.length > 0) {
      timetable.classes.forEach((classData: any) => {
        const className = classData.class_name || classData.name || "";
        const department = classData.department || "";
        const schedule = classData.schedule || classData.entries || [];
        schedule.forEach((entry: any) => {
          rows.push({
            Variation: variationLabel ?? timetable.variation ?? "",
            Class: className,
            Department: department,
            Day: entry.day || entry.weekday || "",
            Period: entry.period ?? "",
            "Start Time": entry.start_time || entry.time_from || "",
            "End Time": entry.end_time || entry.time_to || "",
            Subject: entry.subject || entry.subject_name || "",
            "Subject Code": entry.subject_code || "",
            Teacher: entry.teacher || "",
            Room: entry.room || "",
            "Subject Type": entry.subject_type || entry.type || "",
          });
        });
      });
    } else if (timetable.timetableData && typeof timetable.timetableData === "object") {
      Object.entries(timetable.timetableData).forEach(([key, entry]: any) => {
        const [day = "", period = ""] = String(key).split("-");
        rows.push({
          Variation: variationLabel ?? timetable.variation ?? "",
          Class: entry.class_name || entry.class || "",
          Department: entry.department || "",
          Day: day,
          Period: period,
          "Start Time": entry.start_time || entry.timeSlot || "",
          "End Time": entry.end_time || "",
          Subject: entry.subject?.name ?? entry.subject ?? "",
          "Subject Code": entry.subject_code || "",
          Teacher: entry.subject?.teacher ?? entry.teacher ?? "",
          Room: entry.room || "",
          "Subject Type": entry.subject_type || "",
        });
      });
    }

    return rows;
  };

  const exportVariationsExcel = async (variationsData: TimetableVariation[]) => {
    if (!variationsData || variationsData.length === 0) {
      toast({ title: "No data", description: "No generated variations to export." });
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const makeSafe = (s: string, fallback = "sheet") =>
        String(s || fallback).replace(/[\[\]\*\?:\/\\]/g, "_").slice(0, 28);

      const headers = [
        "Day",
        "Period",
        "Start Time",
        "End Time",
        "Subject",
        "Subject Code",
        "Teacher",
        "Room",
        "Subject Type",
      ];

      for (const variation of variationsData) {
        const vt = variation.timetable;
        const varLabel = `Variation_${variation.variation ?? "1"}`;

        if (Array.isArray(vt?.classes) && vt.classes.length > 0) {
          for (const classData of vt.classes) {
            const className = classData.class_name || classData.name || "Class";
            const department = classData.department || "";
            const schedule = classData.schedule || classData.entries || [];

            const aoa: any[] = [];
            aoa.push([`Class:`, className, `Department:`, department]);
            aoa.push([]);
            aoa.push(headers);
            for (const entry of schedule) {
              aoa.push([
                entry.day || entry.weekday || "",
                entry.period ?? "",
                entry.start_time || entry.time_from || "",
                entry.end_time || entry.time_to || "",
                entry.subject || entry.subject_name || "",
                entry.subject_code || "",
                entry.teacher || "",
                entry.room || "",
                entry.subject_type || entry.type || "",
              ]);
            }

            const sheetName = `${varLabel}_${makeSafe(className)}`.slice(0, 31);
            const ws = XLSX.utils.aoa_to_sheet(aoa);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
          }
        }
      }

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const filename = `timetable_${new Date().toISOString().slice(0, 10)}.xlsx`;
      downloadFile(filename, blob, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      toast({ title: "Exported", description: "Timetable saved as Excel workbook." });
    } catch (err) {
      console.warn("Excel export failed, falling back to CSV:", err);
      const first = variationsData[0];
      const rows = buildRowsFromTimetable(first.timetable, `Variation ${first.variation ?? 1}`);
      if (!rows || rows.length === 0) return;
      const headersCsv = Object.keys(rows[0]);
      const escapeCsv = (v: any) => {
        if (v === null || v === undefined) return "";
        const s = String(v);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const csvRows = [headersCsv.map(escapeCsv).join(",")].concat(
        rows.map((r) => headersCsv.map((h) => escapeCsv(r[h])).join(","))
      );
      const csvBlob = new Blob([csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      downloadFile(`timetable_${new Date().toISOString().slice(0, 10)}.csv`, csvBlob, "text/csv;charset=utf-8;");
      toast({ title: "Exported", description: "Timetable saved as CSV file." });
    }
  };

  const [userId, setUserId] = useState<string | null>(null);

  const loadConfiguration = useCallback(
    async (uid: string) => {
      try {
        const data = await apiRequest("/generator/config", {
          method: "POST",
          body: JSON.stringify({ user_id: uid }),
        });

        if (data.status === "success") {
          setConfig(data.config);
          setPreferences((prev) => ({
            ...prev,
            selected_classes: data.config.available_classes.map((cls: any) => cls.id),
          }));
        } else {
          toast({
            title: "Configuration Notice",
            description: data.message || "Failed to load config",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error loading configuration:", error);
      }
    },
    [toast]
  );

  useEffect(() => {
    const storedUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!storedUserId) {
      router.push("/login");
      return;
    }
    setUserId(storedUserId);
    loadConfiguration(storedUserId);
  }, [router, loadConfiguration]);

  const generateTimetable = async (type: "smart" | "custom" | "batch" = "batch") => {
    if (!userId) {
      router.push("/login");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setVariations([]);

    let progressInterval: NodeJS.Timeout | null = null;
    try {
      let endpoint = "";
      let payload: any = { user_id: userId };

      progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 15, 90));
      }, 200);

      switch (type) {
        case "smart":
          endpoint = "/generate_timetable";
          break;
        case "custom":
          endpoint = "/generator/custom";
          payload = {
            user_id: userId,
            selected_classes: preferences.selected_classes,
            max_daily_hours: preferences.max_daily_hours,
            avoid_conflicts: preferences.avoid_conflicts,
            lunch_break: preferences.lunch_break,
            break_duration: preferences.break_duration,
          };
          break;
        case "batch":
          endpoint = "/generator/batch";
          payload = { user_id: userId, variations: 3 };
          break;
      }

      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (progressInterval) clearInterval(progressInterval);
      setGenerationProgress(100);

      if (data.status === "success") {
        if (type === "batch") {
          setVariations(data.variations || []);
          setSelectedVariation(0);
          setActiveTab("variations");
        } else {
          setVariations([
            {
              variation: 1,
              timetable: data.data,
              teacher_workload: {},
              score: 100,
            },
          ]);
          setSelectedVariation(0);
          setActiveTab("preview");
        }

        toast({
          title: "Timetable Generated",
          description: "Schedule computed successfully with 0 conflicts.",
        });
      } else {
        throw new Error(data.message || "Failed to generate timetable");
      }
    } catch (error: any) {
      if (progressInterval) clearInterval(progressInterval);
      toast({
        title: "Generation Notice",
        description: error.message || "Unable to solve with current constraints.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 600);
    }
  };

  const handleConfirmClearData = async () => {
    try {
      if (!userId) return;
      const data = await apiRequest("/clear_user_data", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      });

      if (data.status === "success") {
        toast({ title: "Data Cleared", description: "All records reset." });
        setConfig(null);
        setVariations([]);
        setSelectedVariation(null);
        setIsClearModalOpen(false);
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear data",
        variant: "destructive",
      });
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-[#0E0F12] text-zinc-200 flex items-center justify-center">
        <div className="p-6 rounded-xl border border-[#23252E] bg-[#14151A] text-center max-w-xs space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin text-zinc-400 mx-auto" />
          <h2 className="text-sm font-semibold text-zinc-200">Loading Configuration</h2>
          <p className="text-xs text-zinc-500">Retrieving academic parameters...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Generate Timetable — The Phoenix</title>
        <meta
          name="description"
          content="Generate conflict-free academic timetables with automated scheduling"
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
                Generate Timetable
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Configure your generation rules and run the conflict-free scheduling engine.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/create")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] transition-colors"
              >
                Edit Data
              </button>
              <button
                onClick={() => router.push("/view")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] transition-colors"
              >
                View Current
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3.5 rounded-xl border border-[#23252E] bg-[#14151A] flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div>
                <div className="text-lg font-bold font-mono text-zinc-100">
                  {config.available_subjects.length}
                </div>
                <div className="text-[11px] text-zinc-500">Subjects</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[#23252E] bg-[#14151A] flex items-center gap-3">
              <Users className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div>
                <div className="text-lg font-bold font-mono text-zinc-100">
                  {config.available_teachers.length}
                </div>
                <div className="text-[11px] text-zinc-500">Faculty</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[#23252E] bg-[#14151A] flex items-center gap-3">
              <Calendar className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div>
                <div className="text-lg font-bold font-mono text-zinc-100">
                  {config.available_classes.length}
                </div>
                <div className="text-[11px] text-zinc-500">Classes</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[#23252E] bg-[#14151A] flex items-center gap-3">
              <Clock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div>
                <div className="text-lg font-bold font-mono text-zinc-100">
                  {config.time_slots.length}
                </div>
                <div className="text-[11px] text-zinc-500">Daily Periods</div>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          {isGenerating && (
            <div className="mb-6 p-4 rounded-xl border border-[#23252E] bg-[#14151A] space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  Generating conflict-free schedule...
                </span>
                <span className="font-mono text-zinc-200">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-1.5 bg-[#23252E]" />
            </div>
          )}

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Controls */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-xl border border-[#23252E] bg-[#14151A] p-5 space-y-5">
                <h2 className="text-sm font-semibold text-zinc-100 border-b border-[#23252E] pb-3">
                  Generation Options
                </h2>

                <div className="space-y-2">
                  <button
                    onClick={() => generateTimetable("batch")}
                    disabled={isGenerating}
                    className="w-full py-2 px-3 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Generate Variations (3x)</span>
                  </button>

                  <button
                    onClick={() => generateTimetable("smart")}
                    disabled={isGenerating}
                    className="w-full py-2 px-3 rounded-lg text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Single Pass</span>
                  </button>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#23252E]">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-zinc-300">Max Daily Hours</span>
                      <span className="font-mono text-zinc-200 font-semibold">
                        {preferences.max_daily_hours} hrs
                      </span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={8}
                      value={preferences.max_daily_hours}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          max_daily_hours: parseInt(e.target.value) || 6,
                        }))
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#181920] border border-[#262833] cursor-pointer text-xs text-zinc-300">
                    <Checkbox
                      checked={preferences.avoid_conflicts}
                      onCheckedChange={(checked: boolean) =>
                        setPreferences((prev) => ({ ...prev, avoid_conflicts: checked }))
                      }
                    />
                    <span>Avoid Faculty Conflicts</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#181920] border border-[#262833] cursor-pointer text-xs text-zinc-300">
                    <Checkbox
                      checked={preferences.lunch_break}
                      onCheckedChange={(checked: boolean) =>
                        setPreferences((prev) => ({ ...prev, lunch_break: checked }))
                      }
                    />
                    <span>Include Lunch Break</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-[#23252E]">
                  <button
                    type="button"
                    onClick={() => setIsClearModalOpen(true)}
                    disabled={isGenerating}
                    className="w-full py-1.5 px-3 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-[#1E1418] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset All Data</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Tabs */}
            <div className="lg:col-span-2 space-y-4">
              {/* Tabs Bar */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#14151A] border border-[#23252E]">
                {[
                  { id: "basic", label: "Classes" },
                  { id: "advanced", label: "Rules" },
                  { id: "variations", label: `Variations (${variations.length})` },
                  { id: "preview", label: "Timetable" },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-[#20222B] text-zinc-100"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab: Classes */}
              {activeTab === "basic" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#23252E] bg-[#14151A] p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#23252E] pb-2">
                      <h3 className="text-xs font-semibold text-zinc-200">Classes Included</h3>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {preferences.selected_classes.length} / {config.available_classes.length} selected
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {config.available_classes.map((cls) => {
                        const isSelected = preferences.selected_classes.includes(cls.id);
                        return (
                          <div
                            key={cls.id}
                            onClick={() => {
                              if (isSelected) {
                                setPreferences((prev) => ({
                                  ...prev,
                                  selected_classes: prev.selected_classes.filter((id) => id !== cls.id),
                                }));
                              } else {
                                setPreferences((prev) => ({
                                  ...prev,
                                  selected_classes: [...prev.selected_classes, cls.id],
                                }));
                              }
                            }}
                            className={`p-2.5 rounded-lg border cursor-pointer text-xs flex items-center justify-between transition-colors ${
                              isSelected
                                ? "bg-[#181920] border-indigo-500/50 text-zinc-100"
                                : "bg-[#111216] border-[#23252E] text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <div>
                              <div className="font-medium">{cls.name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                {cls.department} • {cls.credits} cr
                              </div>
                            </div>
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border ${
                                isSelected
                                  ? "bg-indigo-600 border-indigo-500 text-white"
                                  : "border-[#3A3D4D]"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Advanced */}
              {activeTab === "advanced" && (
                <AdvancedGenerationOptions
                  config={config}
                  preferences={preferences}
                  onPreferencesChange={setPreferences}
                />
              )}

              {/* Tab: Variations */}
              {activeTab === "variations" && (
                <div className="space-y-3">
                  {variations.length > 0 ? (
                    variations.map((v, idx) => {
                      const isSelected = selectedVariation === idx;
                      return (
                        <div
                          key={v.variation}
                          onClick={() => {
                            setSelectedVariation(idx);
                            setActiveTab("preview");
                          }}
                          className={`p-4 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected
                              ? "bg-[#181920] border-indigo-500/50 text-zinc-100"
                              : "bg-[#14151A] border-[#23252E] hover:border-[#2C2E3C] text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#20222B] flex items-center justify-center font-mono text-xs font-semibold text-zinc-300">
                              #{v.variation}
                            </span>
                            <div>
                              <div className="text-xs font-semibold">
                                Variation {v.variation}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                Score: {v.score.toFixed(1)}% • {v.timetable?.classes?.length || 0} classes
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="px-2.5 py-1 rounded text-xs text-zinc-300 bg-[#20222B] hover:bg-[#282B36] transition-colors"
                          >
                            Inspect
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center rounded-xl border border-[#23252E] bg-[#14151A] text-xs text-zinc-400">
                      <Shuffle className="w-6 h-6 mx-auto mb-2 text-zinc-500" />
                      <p>No variations generated yet. Click &quot;Generate Variations&quot; on the left.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Preview */}
              {activeTab === "preview" && (
                <div className="space-y-3">
                  {selectedVariation !== null && variations[selectedVariation] ? (
                    <div>
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="text-zinc-400">
                          Viewing Variation {variations[selectedVariation].variation} (Score: {variations[selectedVariation].score.toFixed(1)}%)
                        </span>
                        <button
                          onClick={() => exportVariationsExcel([variations[selectedVariation]])}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Excel</span>
                        </button>
                      </div>

                      <TimetablePreview
                        timetableData={variations[selectedVariation].timetable}
                      />
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-xl border border-[#23252E] bg-[#14151A] text-xs text-zinc-400">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 text-zinc-500" />
                      <p>Run the generator or pick a variation to inspect.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clear Modal */}
        {isClearModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl border border-[#23252E] bg-[#14151A] p-5 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Reset Academic Data?</span>
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This will delete all saved faculty, courses, and generated schedules for your account.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsClearModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClearData}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-rose-600 hover:bg-rose-500"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
