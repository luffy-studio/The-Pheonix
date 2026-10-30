import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AppNavbar from "@/components/AppNavbar";
import TimetableGrid from "@/components/TimetableGrid";
import SubjectSelector from "@/components/SubjectSelector";
import { Settings, Zap, Eye, Layers } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  teacher: string;
  department: string;
}

export default function CreateTimetable() {
  const router = useRouter();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string>("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("userId") || "";
      setUserId(storedId);

      if (storedId) {
        const fetchSubjects = async () => {
          const { data, error } = await supabase
            .from("Subjects_Clg")
            .select("*")
            .eq("User_id", storedId);

          if (!error && data) {
            const allSubjects = data
              .flatMap((row) => row.details?.subjects || [])
              .map((subject: any) => ({
                id: subject.Subject_ID || subject.Subject_Code,
                name: subject.Subject_Name,
                code: subject.Subject_Code,
                department: subject.Department,
                color: subject.color || "#4F46E5",
                teacher: subject.teacher || "",
              }));
            setSubjects(allSubjects);
          }
        };

        fetchSubjects();
      }
    }
  }, []);

  return (
    <>
      <Head>
        <title>Setup Faculty & Courses — The Phoenix</title>
        <meta
          name="description"
          content="Upload faculty allocations, class structures, and manage subject catalogs before generating schedules."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-[#0E0F12] text-zinc-200">
        <AppNavbar />

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-6 border-b border-[#23252E] gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                Setup Academic Data
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Upload your faculty roster, course catalog, and subjects before running the scheduler.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] transition-colors flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>{isSidebarOpen ? "Hide Subjects" : "Subjects"}</span>
              </button>

              <button
                onClick={() => router.push("/view")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                <span>View Timetables</span>
              </button>

              <button
                onClick={() => router.push("/generate")}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Generate</span>
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Faculty & Courses Management */}
            <div className="lg:col-span-2 space-y-6">
              <TimetableGrid />
            </div>

            {/* Subject Selector Sidebar */}
            <div className={`lg:block ${isSidebarOpen ? "block" : "hidden lg:block"}`}>
              <div className="sticky top-20">
                <SubjectSelector
                  isOpen={isSidebarOpen}
                  onToggle={() => setIsSidebarOpen(false)}
                  userId={userId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
