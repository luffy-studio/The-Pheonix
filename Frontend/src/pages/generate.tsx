import React, { useState, useEffect } from "react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import AppleNavbar from "@/components/AppleNavbar";
import AdvancedGenerationOptions from "@/components/AdvancedGenerationOptions";
import TimetablePreview from "@/components/TimetablePreview";
import { 
  Settings, 
  Calendar, 
  Users, 
  BookOpen, 
  Clock, 
  Shuffle,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Cog
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
    subject_priorities: {}
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [variations, setVariations] = useState<TimetableVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  // --- Export helpers (XLSX with fallback to CSV) ---
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

    // If timetable.classes exists, flatten that structure
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
            "Subject Type": entry.subject_type || entry.type || ""
          });
        });
      });
    } else if (timetable.timetableData && typeof timetable.timetableData === "object") {
      // Fallback flatten timetableData map
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
          "Subject Type": entry.subject_type || ""
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

        // If timetable contains per-class array (matches preview), create one sheet per class
        if (Array.isArray(vt?.classes) && vt.classes.length > 0) {
          for (const classData of vt.classes) {
            const className = classData.class_name || classData.name || "Class";
            const department = classData.department || "";
            const schedule = classData.schedule || classData.entries || [];

            // Build AOa: title rows + header + data rows (mirrors preview)
            const aoa: any[] = [];
            aoa.push([`Class:`, className, `Department:`, department]);
            aoa.push([]); // empty row
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
        } else if (vt?.timetableData && typeof vt.timetableData === "object") {
          // Fallback: single sheet flattening timetableData map (keeps preview fallback layout)
          const aoa: any[] = [];
          aoa.push([`Variation:`, variation.variation ?? "1"]);
          aoa.push([]);
          aoa.push(["Class", "Department", ...headers]);
          Object.entries(vt.timetableData).forEach(([key, entry]: any) => {
            const [day = "", period = ""] = String(key).split("-");
            const className = entry.class_name || entry.class || "";
            const department = entry.department || "";
            aoa.push([
              className,
              department,
              day,
              period,
              entry.start_time || entry.timeSlot || "",
              entry.end_time || "",
              entry.subject?.name ?? entry.subject ?? "",
              entry.subject_code || "",
              entry.subject?.teacher ?? entry.teacher ?? "",
              entry.room || "",
              entry.subject_type || "",
            ]);
          });
          const sheetName = `${varLabel}_Flatten`.slice(0, 31);
          const ws = XLSX.utils.aoa_to_sheet(aoa);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        } else {
          // No structured data: create a minimal sheet with variation label
          const aoa = [
            [`Variation`, variation.variation ?? "1"],
            [],
            ["Note", "No class schedules available for this variation"],
          ];
          const sheetName = `${varLabel}_Empty`.slice(0, 31);
          const ws = XLSX.utils.aoa_to_sheet(aoa);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
      }

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const filename = `timetable_variations_${new Date().toISOString().slice(0,10)}.xlsx`;
      downloadFile(filename, blob, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      toast({ title: "Exported", description: "Variations exported as Excel file (matches preview layout)." });
    } catch (err) {
      console.warn("XLSX export failed, falling back to CSV:", err);
      // Fallback: previous CSV fallback behavior (export first variation as CSV)
      const first = variationsData[0];
      const rows = buildRowsFromTimetable(first.timetable, `Variation ${first.variation ?? 1}`);
      if (!rows || rows.length === 0) {
        toast({ title: "Export Failed", description: "No rows available to export." });
        return;
      }
      const headersCsv = Object.keys(rows[0]);
      const escapeCsv = (v: any) => {
        if (v === null || v === undefined) return "";
        const s = String(v);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const csvRows = [headersCsv.map(escapeCsv).join(",")].concat(
        rows.map(r => headersCsv.map(h => escapeCsv(r[h])).join(","))
      );
      const csvBlob = new Blob([csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      downloadFile(`timetable_variation_fallback_${new Date().toISOString().slice(0,10)}.csv`, csvBlob, "text/csv;charset=utf-8;");
      toast({ title: "Exported (CSV)", description: "Fallback CSV exported." });
    }
  };

  const exportSelectedOrAll = async () => {
    if (!variations || variations.length === 0) {
      toast({ title: "No Variations", description: "Generate variations first." });
      return;
    }
    if (selectedVariation !== null && variations[selectedVariation]) {
      await exportVariationsExcel([variations[selectedVariation]]);
    } else {
      await exportVariationsExcel(variations);
    }
  };
  // --- end export helpers ---

  // Mock user ID - in real app, get from auth context
  const userId = "088f7a98-e77c-45e0-9a65-859959a2434d";

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch(`http://localhost:8000/generator/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();
      if (data.status === "success") {
        setConfig(data.config);
        
        // Initialize all classes as selected by default
        setPreferences(prev => ({
          ...prev,
          selected_classes: data.config.available_classes.map((cls: any) => cls.id)
        }));
      } else {
        toast({
          title: "Configuration Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
      toast({
        title: "Error",
        description: "Failed to load generator configuration",
        variant: "destructive",
      });
    }
  };

  const generateTimetable = async (type: "smart" | "custom" | "batch" = "smart") => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setVariations([]);

    try {
      let endpoint = "";
      let payload: any = { user_id: userId };

      // Progress simulation
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
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
            break_duration: preferences.break_duration
          };
          break;
        case "batch":
          endpoint = "/generator/batch";
          payload = { user_id: userId, variations: 3 };
          break;
      }

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (data.status === "success") {
        if (type === "batch") {
          setVariations(data.variations);
          setActiveTab("variations");
        } else {
          // Single timetable generated
          setVariations([{
            variation: 1,
            timetable: data.data,
            teacher_workload: {},
            score: 100
          }]);
          setSelectedVariation(0);
        }

        toast({
          title: "Success!",
          description: `Timetable generated successfully using ${type} method`,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate timetable",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  };

  const clearUserData = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete ALL your uploaded data including:\n" +
      "• Faculty/Teachers\n" +
      "• Subjects\n" +
      "• Classes/Courses\n" +
      "• Generated Timetables\n\n" +
      "This action cannot be undone. Are you sure you want to continue?"
    );

    if (!confirmed) return;

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("http://localhost:8000/clear_user_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();

      if (data.status === "success") {
        toast({
          title: "Success!",
          description: "All data cleared successfully. Page will refresh to load clean state.",
        });
        
        // Clear local state
        setConfig(null);
        setVariations([]);
        setSelectedVariation(null);
        
        // Refresh page after short delay
        setTimeout(() => window.location.reload(), 2000);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Clear Failed",
        description: error.message || "Failed to clear data",
        variant: "destructive",
      });
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen gradient-mesh-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 rounded-3xl text-center"
        >
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <h2 className="text-2xl font-bold mb-2">Loading Configuration</h2>
          <p className="text-gray-600">Preparing timetable generator...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Generate Timetable - EduSchedule</title>
        <meta name="description" content="Generate optimized timetables with AI-powered scheduling" />
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-purple-600 mr-3" />
              <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                AI Timetable Generator
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create intelligent, conflict-free timetables with advanced AI scheduling algorithms. 
              Optimize teacher workloads, maximize resource utilization, and ensure academic excellence.
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="glass-card border-0">
              <CardContent className="p-4 text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{config.available_subjects.length}</div>
                <div className="text-sm text-gray-600">Subjects</div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-0">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{config.available_teachers.length}</div>
                <div className="text-sm text-gray-600">Teachers</div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-0">
              <CardContent className="p-4 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold">{config.available_classes.length}</div>
                <div className="text-sm text-gray-600">Classes</div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-0">
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold">{config.time_slots.length}</div>
                <div className="text-sm text-gray-600">Time Slots</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Generation Progress */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <Card className="glass-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <RefreshCw className="w-5 h-5 mr-2 text-blue-600 animate-spin" />
                        <span className="font-semibold">Generating Timetable...</span>
                      </div>
                      <span className="text-sm text-gray-600">{generationProgress}%</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Generation Controls */}
            <div className="lg:col-span-1">
              <Card className="glass-card border-0 sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Generator Settings
                  </CardTitle>
                  <CardDescription>
                    Configure your timetable generation preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Quick Generation Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => generateTimetable("batch")}
                      disabled={isGenerating}
                      className="w-full interactive-button text-white"
                      size="lg"
                    >
                      <Shuffle className="w-5 h-5 mr-2" />
                      Generate Variations
                    </Button>
                  </div>

                  {/* Clear Data Button */}
                  <div className="border-t pt-4">
                    <Button
                      onClick={clearUserData}
                      disabled={isGenerating}
                      variant="destructive"
                      className="w-full"
                      size="sm"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Clear All Data
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Remove all uploaded faculty, subjects, courses, and generated timetables
                    </p>
                  </div>

                  {/* Basic Settings */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Max Daily Hours</Label>
                      <Input
                        type="number"
                        min={4}
                        max={8}
                        value={preferences.max_daily_hours}
                        onChange={(e) => setPreferences(prev => ({ ...prev, max_daily_hours: parseInt(e.target.value) || 6 }))}
                        className="mt-2"
                      />
                      <div className="text-sm text-gray-600 mt-1">{preferences.max_daily_hours} hours</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="avoid-conflicts"
                        checked={preferences.avoid_conflicts}
                        onCheckedChange={(checked: boolean) => setPreferences(prev => ({ ...prev, avoid_conflicts: checked }))}
                      />
                      <Label htmlFor="avoid-conflicts" className="text-sm font-medium">Avoid Conflicts</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lunch-break"
                        checked={preferences.lunch_break}
                        onCheckedChange={(checked: boolean) => setPreferences(prev => ({ ...prev, lunch_break: checked }))}
                      />
                      <Label htmlFor="lunch-break" className="text-sm font-medium">Lunch Break</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Area */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 glass-card border-0">
                  <TabsTrigger value="basic">Configuration</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="variations">Variations</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                {/* Configuration Tab */}
                <TabsContent value="basic" className="space-y-6">
                  <Card className="glass-card border-0">
                    <CardHeader>
                      <CardTitle>Class Selection</CardTitle>
                      <CardDescription>Choose which classes to include in generation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {config.available_classes.map((cls) => (
                          <div key={cls.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200">
                            <Checkbox
                              checked={preferences.selected_classes.includes(cls.id)}
                              onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                  setPreferences(prev => ({
                                    ...prev,
                                    selected_classes: [...prev.selected_classes, cls.id]
                                  }));
                                } else {
                                  setPreferences(prev => ({
                                    ...prev,
                                    selected_classes: prev.selected_classes.filter(id => id !== cls.id)
                                  }));
                                }
                              }}
                            />
                            <div>
                              <div className="font-medium">{cls.name}</div>
                              <div className="text-sm text-gray-600">{cls.department} • {cls.credits} credits</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-0">
                    <CardHeader>
                      <CardTitle>Available Resources</CardTitle>
                      <CardDescription>Overview of subjects and teachers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Subjects ({config.available_subjects.length})</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {config.available_subjects.map((subject) => (
                              <div key={subject.id} className="flex items-center justify-between p-2 rounded border border-gray-100">
                                <div>
                                  <div className="font-medium text-sm">{subject.name}</div>
                                  <div className="text-xs text-gray-600">{subject.code}</div>
                                </div>
                                <Badge variant="secondary">{subject.credits} cr</Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Teachers ({config.available_teachers.length})</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {config.available_teachers.map((teacher) => (
                              <div key={teacher.id} className="flex items-center justify-between p-2 rounded border border-gray-100">
                                <div>
                                  <div className="font-medium text-sm">{teacher.name}</div>
                                  <div className="text-xs text-gray-600">{teacher.department}</div>
                                </div>
                                <Badge variant="outline">{teacher.max_credits} hrs</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Advanced Options Tab */}
                <TabsContent value="advanced" className="space-y-6">
                  <Card className="glass-card border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Cog className="w-5 h-5 mr-2" />
                        Advanced Generation Options
                      </CardTitle>
                      <CardDescription>
                        Fine-tune your timetable generation with advanced preferences and constraints
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AdvancedGenerationOptions
                        config={config}
                        preferences={preferences}
                        onPreferencesChange={setPreferences}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Variations Tab */}
                <TabsContent value="variations" className="space-y-6">
                  {variations.length > 0 ? (
                    <div className="grid gap-4">
                      {variations.map((variation, index) => (
                        <Card 
                          key={variation.variation} 
                          className={`glass-card border-0 cursor-pointer transition-all ${
                            selectedVariation === index ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => setSelectedVariation(index)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {selectedVariation === index ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                )}
                                <div>
                                  <h3 className="font-semibold">Variation {variation.variation}</h3>
                                  <p className="text-sm text-gray-600">
                                    Optimization Score: {variation.score.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary">
                                  {variation.timetable?.classes?.length || 0} classes
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="glass-card border-0">
                      <CardContent className="p-8 text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold mb-2">No Variations Generated</h3>
                        <p className="text-gray-600 mb-4">
                          Generate batch variations to compare different timetable options
                        </p>
                        <Button onClick={() => generateTimetable("batch")} disabled={isGenerating}>
                          <Shuffle className="w-4 h-4 mr-2" />
                          Generate Variations
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Preview Tab */}
                <TabsContent value="preview" className="space-y-6">
                  {selectedVariation !== null && variations[selectedVariation] ? (
                    <div className="space-y-6">
                      <Card className="glass-card border-0">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>
                                Timetable Preview - Variation {variations[selectedVariation].variation}
                              </CardTitle>
                              <CardDescription>
                                Generated with score: {variations[selectedVariation].score.toFixed(1)}%
                              </CardDescription>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                className="glass-card border-0"
                                onClick={() => exportSelectedOrAll()}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <TimetablePreview 
                            timetableData={variations[selectedVariation].timetable}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card className="glass-card border-0">
                      <CardContent className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold mb-2">No Timetable Selected</h3>
                        <p className="text-gray-600">
                          Generate a timetable or select a variation to preview
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}