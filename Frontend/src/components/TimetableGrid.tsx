import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckCircle, Upload, Trash2, AlertCircle, BarChart3, Download } from 'lucide-react';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useRouter } from 'next/router';

const backend = process.env.Bckend_url;

// Improved TypeScript interfaces
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

// Default template data with improved structure
const defaultFacultyData: Faculty[] = [
  {
    Faculty_ID: 'F001',
    Name: 'Dr. Anjali Sharma',
    Department: 'ECE',
    Course_Type: 'Theory',
    Max_Credits: 10,
    primary_subject: 'Digital Electronics',
    other_subject: 'Circuit Theory',
  },
];

const defaultCourseData: Course[] = [
  {
    Course_Code: 'ECE201',
    Course_Name: 'Digital Electronics',
    department: 'ECE',
    Credits: 4,
    Course_Type: 'Theory',
  },
];

const TimetableGrid: React.FC = () => {
  const { isLoggedIn } = useAuth();

  const [facultyData, setFacultyData] = useState<Faculty[]>(defaultFacultyData);
  const [courseData, setCourseData] = useState<Course[]>(defaultCourseData);

  const [facultyVerified, setFacultyVerified] = useState(false);
  const [courseVerified, setCourseVerified] = useState(false);
  const [isButton1Active, setIsButton1Active] = useState(false);
  const [isButton2Active, setIsButton2Active] = useState(false);
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
      alert('You must be logged in to upload a file!');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'array' });
      const wsFaculty = workbook.Sheets['Faculty_Data'];

      if (!wsFaculty) {
        alert('Excel must contain "Faculty_Data" sheet!');
        setFacultyVerified(false);
        return;
      }

      const facultyJson = XLSX.utils.sheet_to_json<Faculty>(wsFaculty);
      setFacultyData(facultyJson);
      setFacultyVerified(true);
    };
    reader.readAsArrayBuffer(file);
  };
  // Upload Courses File
  const handleUploadCourses = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoggedIn) {
      alert('You must be logged in to upload a file!');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'array' });
      const wsCourse = workbook.Sheets['Course_Data'];

      if (!wsCourse) {
        alert('Excel must contain "Course_Data" sheet!');
        setCourseVerified(false);
        return;
      }

      const courseJson = XLSX.utils.sheet_to_json<Course>(wsCourse);
      setCourseData(courseJson);
      setCourseVerified(true);
    };
    reader.readAsArrayBuffer(file);
  };
  // Submit to backend
  const handleSubmitFaculty = async () => {
    if (!isLoggedIn) return alert("Login required!");
    if (!facultyVerified) return alert("Upload and verify first!");

    try {
      const userId = localStorage.getItem("userId"); // get logged-in user's ID
      if (!userId) return alert("User ID missing. Please log in again!");

      // Correct payload format
      const payload = {
        user_id: userId,
        details: facultyData.map((f) => ({
          Teacher_id: f.Faculty_ID || undefined, // optional, auto-generated backend
          name: f.Name,
          department: f.Department,
          course_type: f.Course_Type,
          max_credits: f.Max_Credits,
          primary_subject: f.primary_subject,
          other_subject: f.other_subject,
        })),
      };

      const res = await axios.post(
        "${backend}/upload_faculty",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      alert("Faculty data submitted successfully!");
      setIsButton1Active(true);
      console.log(res);
      console.log(payload)
    } catch (err: any) {
      console.error("Faculty submit error:", err.response?.data || err.message);
      alert(`Error submitting faculty data: ${JSON.stringify(err.response?.data)}`);
    }
  };
  const handleSubmitCourses = async () => {
    if (!isLoggedIn || !courseVerified)
      return alert("Login required or file not verified!");

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return alert("User ID missing. Please log in again!");

      // Wrap courses in a single payload object
      const payload = {
        user_id: userId,
        details: courseData.map((c) => ({
          Course_Code: c.Course_Code,
          Course_Name: c.Course_Name,
          department: c.department,
          Credits: c.Credits,
          Course_Type: c.Course_Type,
        })),
      };

      const res = await axios.post(
        "${backend}/upload_courses",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      alert("Course data submitted successfully!");
      setIsButton2Active(true);
      console.log(res.data);
    } catch (err: any) {
      console.error(err);
      alert(
        "Error submitting course data: " +
        (err.response?.data?.detail || err.message)
      );
    }
  };

  // Clear all user data
  const handleClearAllData = async () => {
    if (!isLoggedIn) {
      alert("You must be logged in to clear data!");
      return;
    }

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
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("User ID missing. Please log in again!");
        return;
      }

      const response = await axios.post(
        "${backend}/clear_user_data",
        { user_id: userId },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.status === "success") {
        alert("✅ All data cleared successfully!\n\n" +
          "Cleared records:\n" +
          Object.entries(response.data.cleared_counts)
            .map(([table, count]) => `• ${table}: ${count} records`)
            .join("\n"));

        // Reset local state
        setFacultyData(defaultFacultyData);
        setCourseData(defaultCourseData);
        setFacultyVerified(false);
        setCourseVerified(false);
        setIsButton1Active(false);
        setIsButton2Active(false);
      } else {
        alert("Error clearing data: " + response.data.message);
      }
    } catch (err: any) {
      console.error("Clear data error:", err.response?.data || err.message);
      alert(`Error clearing data: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleGenerateTimeTable = async () => {
    if (!isLoggedIn || !courseVerified || !facultyVerified)
      return alert("Login required or files not verified!");

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return alert("User ID missing. Please log in again!");

      // Show loading state
      alert("Generating timetable... This may take a moment.");

      const response = await axios.post(
        "${backend}/generate_timetable",
        { user_id: userId },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.status === "success") {
        alert("Timetable generated successfully! Redirecting to view page...");
        // Redirect to view page
        window.location.href = "/view";
      } else {
        alert("Error generating timetable: " + response.data.message);
      }
    } catch (error: any) {
      console.error("Error generating timetable:", error);
      alert("Error generating timetable: " + (error.response?.data?.detail || error.message));
    }
  }
  return (

    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Download Templates */}
      <div className="text-center space-x-4">
        <button
          onClick={handleDownloadFaculty}
          className="bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-600 transition"
        >
          Download Faculty Template
        </button>
        <button
          onClick={handleDownloadCourses}
          className="bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-600 transition"
        >
          Download Courses Template
        </button>
      </div>

      {/* Faculty Preview */}
      <div className="glass-card p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2" /> Faculty Data Preview
        </h2>
        <div
          className="overflow-x-auto border"
          style={{
            maxHeight: facultyData.length > 5 ? '300px' : 'auto', // scroll if more than 5 rows
            overflowY: facultyData.length > 5 ? 'auto' : 'visible',
          }}
        >
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-100">
                {Object.keys(defaultFacultyData[0]).map((col) => (
                  <th key={col} className="px-3 py-2 border">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facultyData.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-3 py-2 border">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload + Submit Faculty */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="flex items-center space-x-3">
          {isLoggedIn ? (
            <label className="bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-600 cursor-pointer transition">
              Upload Faculty File
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleUploadFaculty}
                className="hidden"
              />
            </label>
          ) : (
            <Alert
              onClick={() => alert('Please log in to upload!')}
              className="cursor-pointer px-6 py-3"
            >
              Please log in to upload a file!
            </Alert>
          )}
          {facultyVerified && <CheckCircle className="w-6 h-6 text-green-500" />}
        </div>

        <button
          onClick={handleSubmitFaculty}
          disabled={!facultyVerified || !isLoggedIn}
          className={`px-6 py-3 rounded-xl text-white transition ${facultyVerified && isLoggedIn
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-gray-400 cursor-not-allowed'
            }`}
        >
          Submit Faculty
        </button>
      </div>


      {/* Course Preview */}
      <div className="glass-card p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2" /> Course Data Preview
        </h2>
        <div
          className={`overflow-x-auto border`}
          style={{
            maxHeight: courseData.length > 5 ? '300px' : 'auto', // scroll if more than 5 rows
            overflowY: courseData.length > 5 ? 'auto' : 'visible',
          }}
        >
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-100">
                {Object.keys(defaultCourseData[0]).map((col) => (
                  <th key={col} className="px-3 py-2 border">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courseData.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-3 py-2 border">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload + Submit Courses */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="flex items-center space-x-3">
          {isLoggedIn ? (
            <label className="bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-600 cursor-pointer transition">
              Upload Courses File
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleUploadCourses}
                className="hidden"
              />
            </label>
          ) : (
            <Alert
              onClick={() => alert('Please log in to upload!')}
              className="cursor-pointer px-6 py-3"
            >
              Please log in to upload a file!
            </Alert>
          )}
          {courseVerified && <CheckCircle className="w-6 h-6 text-green-500" />}
        </div>

        <button
          onClick={handleSubmitCourses}
          disabled={!courseVerified || !isLoggedIn}
          className={`px-6 py-3 rounded-xl text-white transition ${courseVerified && isLoggedIn
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-gray-400 cursor-not-allowed'
            }`}
        >
          Submit Courses
        </button>

        <div className="mt-6 text-center space-y-4">
          {/* Clear Data Button */}
          {isLoggedIn && (
            <div className="mb-4">
              <button
                onClick={handleClearAllData}
                className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
              >
                🗑️ Clear All Data
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Remove all uploaded faculty, subjects, courses, and generated timetables
              </p>
            </div>
          )}

          {/* Generate Timetable Button */}
          <button
            onClick={handleGenerateTimeTable}
            disabled={!isLoggedIn || !courseVerified || !facultyVerified}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl ${isLoggedIn && courseVerified && facultyVerified
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                : 'bg-gray-400 text-gray-700 cursor-not-allowed'
              }`}
          >
            Generate Smart Timetable
          </button>

          {/* Analytics Link */}
          {isLoggedIn && (
            <div className="mt-4">
              <a
                href="/analytics"
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Scheduler Analytics
              </a>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default TimetableGrid;
