import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Upload, 
  Trash2, 
  AlertCircle, 
  Download, 
  ArrowRight, 
  Users, 
  GraduationCap, 
  RefreshCw,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getBackendUrl, getAuthHeaders } from '@/lib/backendApi';

interface Faculty {
  Faculty_ID: string;
  Name: string;
  Department: string;
  Course_Type: 'Theory' | 'Lab' | 'Project';
  Max_Credits: number;
  primary_subject: string;
  other_subject: string;
}

interface Course {
  Course_Code: string;
  Course_Name: string;
  department: string;
  Credits: number;
  Course_Type: 'Theory' | 'Lab' | 'Project';
}

const defaultFacultyData: Faculty[] = [
  {
    Faculty_ID: 'F001',
    Name: 'Dr. Alan Turing',
    Department: 'CSE',
    Course_Type: 'Theory',
    Max_Credits: 18,
    primary_subject: 'Data Structures',
    other_subject: 'Algorithms',
  },
  {
    Faculty_ID: 'F002',
    Name: 'Prof. Ada Lovelace',
    Department: 'CSE',
    Course_Type: 'Lab',
    Max_Credits: 16,
    primary_subject: 'Operating Systems',
    other_subject: 'Computer Architecture',
  },
];

const defaultCourseData: Course[] = [
  {
    Course_Code: 'CS201',
    Course_Name: 'Data Structures & Algorithms',
    department: 'CSE',
    Credits: 4,
    Course_Type: 'Theory',
  },
  {
    Course_Code: 'CS301',
    Course_Name: 'Operating Systems Lab',
    department: 'CSE',
    Credits: 3,
    Course_Type: 'Lab',
  },
];

const TimetableGrid: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [facultyData, setFacultyData] = useState<Faculty[]>(defaultFacultyData);
  const [courseData, setCourseData] = useState<Course[]>(defaultCourseData);

  const [facultyVerified, setFacultyVerified] = useState(false);
  const [courseVerified, setCourseVerified] = useState(false);
  const [isSubmittingFaculty, setIsSubmittingFaculty] = useState(false);
  const [isSubmittingCourses, setIsSubmittingCourses] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Download Templates
  const handleDownloadFaculty = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(facultyData),
      'Faculty_Data'
    );
    XLSX.writeFile(wb, 'Faculty_Template.xlsx');
  };

  const handleDownloadCourses = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(courseData),
      'Course_Data'
    );
    XLSX.writeFile(wb, 'Course_Template.xlsx');
  };

  // Upload Faculty File
  const handleUploadFaculty = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload faculty data.",
        variant: "destructive"
      });
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const wsFaculty = workbook.Sheets['Faculty_Data'];

        if (!wsFaculty) {
          toast({
            title: "Invalid Sheet Format",
            description: 'Excel file must contain a "Faculty_Data" sheet.',
            variant: "destructive"
          });
          setFacultyVerified(false);
          return;
        }

        const facultyJson = XLSX.utils.sheet_to_json<Faculty>(wsFaculty);
        if (facultyJson.length === 0) {
          toast({
            title: "Empty Sheet",
            description: "No faculty records found in file.",
            variant: "destructive"
          });
          return;
        }
        setFacultyData(facultyJson);
        setFacultyVerified(true);
        toast({
          title: "Faculty Loaded",
          description: `Loaded ${facultyJson.length} faculty entries. Click "Save" to persist.`,
        });
      } catch (err: any) {
        toast({
          title: "File Parse Error",
          description: err.message || "Failed to parse Excel file",
          variant: "destructive"
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Upload Courses File
  const handleUploadCourses = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload course data.",
        variant: "destructive"
      });
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const wsCourse = workbook.Sheets['Course_Data'];

        if (!wsCourse) {
          toast({
            title: "Invalid Sheet Format",
            description: 'Excel file must contain a "Course_Data" sheet.',
            variant: "destructive"
          });
          setCourseVerified(false);
          return;
        }

        const courseJson = XLSX.utils.sheet_to_json<Course>(wsCourse);
        if (courseJson.length === 0) {
          toast({
            title: "Empty Sheet",
            description: "No course records found in file.",
            variant: "destructive"
          });
          return;
        }
        setCourseData(courseJson);
        setCourseVerified(true);
        toast({
          title: "Courses Loaded",
          description: `Loaded ${courseJson.length} courses. Click "Save" to persist.`,
        });
      } catch (err: any) {
        toast({
          title: "File Parse Error",
          description: err.message || "Failed to parse Excel file",
          variant: "destructive"
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Submit to backend
  const handleSubmitFaculty = async () => {
    if (!isLoggedIn) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (!facultyVerified) {
      toast({ title: "Verification required", description: "Upload or verify faculty file first.", variant: "destructive" });
      return;
    }

    setIsSubmittingFaculty(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User session expired. Please sign in again.");

      const payload = {
        user_id: userId,
        details: facultyData.map((f) => ({
          Teacher_id: f.Faculty_ID || undefined,
          name: f.Name,
          department: f.Department,
          course_type: f.Course_Type,
          max_credits: Number(f.Max_Credits),
          primary_subject: f.primary_subject,
          other_subject: f.other_subject || "",
        })),
      };

      const backend = getBackendUrl();
      const response = await axios.post(
        `${backend}/upload_teachers`,
        payload,
        { headers: getAuthHeaders() }
      );

      if (response.data.status === 'success') {
        toast({
          title: "Faculty Saved",
          description: `Successfully saved ${payload.details.length} faculty records.`,
        });
      } else {
        throw new Error(response.data.message || "Failed to save faculty");
      }
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.response?.data?.detail || err.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmittingFaculty(false);
    }
  };

  const handleSubmitCourses = async () => {
    if (!isLoggedIn) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (!courseVerified) {
      toast({ title: "Verification required", description: "Upload or verify courses file first.", variant: "destructive" });
      return;
    }

    setIsSubmittingCourses(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User session expired. Please sign in again.");

      const payload = {
        user_id: userId,
        details: courseData.map((c) => ({
          Class_ID: c.Course_Code,
          name: c.Course_Name,
          department: c.department,
          credits: Number(c.Credits),
          course_type: c.Course_Type,
        })),
      };

      const backend = getBackendUrl();
      const response = await axios.post(
        `${backend}/upload_classes`,
        payload,
        { headers: getAuthHeaders() }
      );

      if (response.data.status === 'success') {
        toast({
          title: "Courses Saved",
          description: `Successfully saved ${payload.details.length} course records.`,
        });
      } else {
        throw new Error(response.data.message || "Failed to save courses");
      }
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.response?.data?.detail || err.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmittingCourses(false);
    }
  };

  const handleClearAllData = async () => {
    try {
      setIsClearing(true);
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User not found");

      const backend = getBackendUrl();
      const response = await axios.post(
        `${backend}/clear_user_data`,
        { user_id: userId },
        { headers: getAuthHeaders() }
      );

      if (response.data.status === 'success') {
        toast({
          title: "Data Reset",
          description: "All academic records have been cleared.",
        });
        setFacultyData([]);
        setCourseData([]);
        setFacultyVerified(false);
        setCourseVerified(false);
        setIsClearModalOpen(false);
      }
    } catch (err: any) {
      toast({
        title: "Clear Failed",
        description: err.response?.data?.detail || err.message,
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleGenerateTimeTable = async () => {
    if (!isLoggedIn) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User not found");

      const backend = getBackendUrl();
      const response = await axios.post(
        `${backend}/generate_timetable`,
        { user_id: userId },
        { headers: getAuthHeaders() }
      );

      if (response.data.status === "success") {
        toast({
          title: "Timetable Generated",
          description: "Schedule created successfully. Redirecting...",
        });
        window.location.href = "/view";
      } else {
        throw new Error(response.data.message || "Failed to generate timetable");
      }
    } catch (error: any) {
      toast({
        title: "Generation Notice",
        description: error.response?.data?.detail || error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Setup Step Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border border-[#23252E] bg-[#14151A] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-zinc-500">Step 1</div>
            <div className="text-xs font-semibold text-zinc-200 mt-0.5">Faculty Roster</div>
            <div className="text-[11px] text-zinc-500">{facultyData.length} records</div>
          </div>
          {facultyVerified ? (
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500">Unsaved</span>
          )}
        </div>

        <div className="p-3.5 rounded-lg border border-[#23252E] bg-[#14151A] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-zinc-500">Step 2</div>
            <div className="text-xs font-semibold text-zinc-200 mt-0.5">Course Catalog</div>
            <div className="text-[11px] text-zinc-500">{courseData.length} courses</div>
          </div>
          {courseVerified ? (
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500">Unsaved</span>
          )}
        </div>

        <div className="p-3.5 rounded-lg border border-[#23252E] bg-[#14151A] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-zinc-500">Step 3</div>
            <div className="text-xs font-semibold text-zinc-200 mt-0.5">Run Generator</div>
            <div className="text-[11px] text-zinc-500">Ready</div>
          </div>
          <span className="text-[11px] text-indigo-400 font-medium">Solver Ready</span>
        </div>
      </div>

      {/* Faculty Card */}
      <div className="rounded-xl border border-[#23252E] bg-[#14151A] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#23252E]">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              <span>Faculty List</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Teaching credit ceilings and subject assignments</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadFaculty}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Template</span>
            </button>

            <label className="px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>Upload Excel</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleUploadFaculty}
                className="hidden"
              />
            </label>

            <button
              onClick={handleSubmitFaculty}
              disabled={!facultyVerified || isSubmittingFaculty}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                facultyVerified
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-[#181920] text-zinc-500 border border-[#262833] cursor-not-allowed'
              }`}
            >
              {isSubmittingFaculty ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Faculty Preview Table */}
        <div className="overflow-x-auto rounded-lg border border-[#23252E] bg-[#111216]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#181920] text-zinc-400 border-b border-[#23252E]">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Dept</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Max Credits</th>
                <th className="px-3 py-2 font-medium">Primary Subject</th>
                <th className="px-3 py-2 font-medium">Other Subject</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23252E]">
              {facultyData.map((f, i) => (
                <tr key={i} className="hover:bg-[#16171E] transition-colors">
                  <td className="px-3 py-2 font-mono text-zinc-500">{f.Faculty_ID || `F00${i+1}`}</td>
                  <td className="px-3 py-2 font-medium text-zinc-200">{f.Name}</td>
                  <td className="px-3 py-2 text-zinc-400">{f.Department}</td>
                  <td className="px-3 py-2 text-zinc-400">{f.Course_Type}</td>
                  <td className="px-3 py-2 font-mono text-zinc-300">{f.Max_Credits} hrs</td>
                  <td className="px-3 py-2 text-zinc-300">{f.primary_subject}</td>
                  <td className="px-3 py-2 text-zinc-500">{f.other_subject || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courses Card */}
      <div className="rounded-xl border border-[#23252E] bg-[#14151A] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#23252E]">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-zinc-400" />
              <span>Course Catalog</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Classes, departments, and credit structures</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCourses}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Template</span>
            </button>

            <label className="px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>Upload Excel</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleUploadCourses}
                className="hidden"
              />
            </label>

            <button
              onClick={handleSubmitCourses}
              disabled={!courseVerified || isSubmittingCourses}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                courseVerified
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-[#181920] text-zinc-500 border border-[#262833] cursor-not-allowed'
              }`}
            >
              {isSubmittingCourses ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Course Preview Table */}
        <div className="overflow-x-auto rounded-lg border border-[#23252E] bg-[#111216]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#181920] text-zinc-400 border-b border-[#23252E]">
              <tr>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Course Name</th>
                <th className="px-3 py-2 font-medium">Department</th>
                <th className="px-3 py-2 font-medium">Credits</th>
                <th className="px-3 py-2 font-medium">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23252E]">
              {courseData.map((c, i) => (
                <tr key={i} className="hover:bg-[#16171E] transition-colors">
                  <td className="px-3 py-2 font-mono text-zinc-300">{c.Course_Code}</td>
                  <td className="px-3 py-2 font-medium text-zinc-200">{c.Course_Name}</td>
                  <td className="px-3 py-2 text-zinc-400">{c.department}</td>
                  <td className="px-3 py-2 font-mono text-zinc-300">{c.Credits} cr</td>
                  <td className="px-3 py-2 text-zinc-400">{c.Course_Type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Bar */}
      <div className="rounded-xl border border-[#23252E] bg-[#14151A] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold text-zinc-200">Generate Timetable</h3>
          <p className="text-[11px] text-zinc-400">Run the conflict-free scheduler once data is saved</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-[#1E1418] transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>

          <button
            onClick={handleGenerateTimeTable}
            disabled={isGenerating}
            className="px-4 py-1.5 rounded-md text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Computing...</span>
              </>
            ) : (
              <>
                <span>Generate Timetable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isClearModalOpen} onOpenChange={setIsClearModalOpen}>
        <DialogContent className="rounded-xl border border-[#23252E] bg-[#14151A] text-zinc-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Reset Academic Records?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mt-1 leading-relaxed">
              This will remove all uploaded faculty, course definitions, and generated timetables for your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <button
              onClick={() => setIsClearModalOpen(false)}
              className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-[#181920] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAllData}
              disabled={isClearing}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 transition-colors"
            >
              {isClearing ? "Resetting..." : "Yes, Reset Data"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimetableGrid;
