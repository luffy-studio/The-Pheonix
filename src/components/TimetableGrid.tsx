import React, { useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { BookOpen, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useAuth } from '@/lib/context/AuthContext'; // import your AuthContext

interface Faculty {
  Faculty_ID: string;
  Name: string;
  Department: string;
  Course_Type: string;
  Max_Credits: number;
  Expertise: string;
}

interface Course {
  Course_Code: string;
  Course_Name: string;
  Program: string;
  Credits: number;
  Course_Type: string;
  Room_Type_Required: string;
}

// Default template data
const defaultFacultyData: Faculty[] = [
  { Faculty_ID: 'F001', Name: 'Dr. Anjali Sharma', Department: 'Education', Course_Type: 'Theory', Max_Credits: 10, Expertise: 'Pedagogy'},
];

const defaultCourseData: Course[] = [
  { Course_Code: 'EDU101', Course_Name: 'Foundations of Education', Program: 'B.Ed', Credits: 4, Course_Type: 'Theory', Room_Type_Required: 'Lecture Hall'},
];

const ExcelPreview: React.FC = () => {
  const { isLoggedIn } = useAuth(); // get login state from AuthContext
  const [facultyData, setFacultyData] = useState<Faculty[]>(defaultFacultyData);
  const [courseData, setCourseData] = useState<Course[]>(defaultCourseData);
  const [fileVerified, setFileVerified] = useState(false);

  // Download current Excel template
  const handleDownload = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(facultyData), 'Faculty_Data');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(courseData), 'Course_Data');
    XLSX.writeFile(wb, 'Faculty_Course_Template.xlsx');
  };

  // Upload & Verify file
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const wsCourse = workbook.Sheets['Course_Data'];

      if (!wsFaculty || !wsCourse) {
        alert('Excel file must contain "Faculty_Data" and "Course_Data" sheets!');
        setFileVerified(false);
        return;
      }

      const facultyJson = XLSX.utils.sheet_to_json<Faculty>(wsFaculty);
      const courseJson = XLSX.utils.sheet_to_json<Course>(wsCourse);

      setFacultyData(facultyJson);
      setCourseData(courseJson);
      setFileVerified(true);
    };
    reader.readAsArrayBuffer(file);
  };

  // Submit verified data to backend
  const handleSubmit = async () => {
    if (!isLoggedIn) {
      alert('You must be logged in to submit the data!');
      return;
    }
    if (!fileVerified) return alert('Please upload and verify a file first!');
    try {
      await axios.post('/api/upload-excel', { facultyData, courseData });
      alert('Data successfully submitted to the database!');
    } catch (error) {
      console.error(error);
      alert('Error submitting data.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-center p-4 sm:space-x-6 space-y-4 sm:space-y-0">
        {/* Upload & Verified Section */}
        <div className="flex items-center space-x-3">
          {isLoggedIn ? (
            // Logged-in: normal upload button
            <label className="bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-600 cursor-pointer transition">
              Upload & Verify File
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          ) : (
            // Not logged-in: show your Alert component
            <Alert
              onClick={() => alert('Please log in to upload a file!')}
              className="cursor-pointer px-6 py-3"
            >
              Please log in to upload a file!
            </Alert>
          )}
          {fileVerified && <CheckCircle className="w-6 h-6 text-green-500" />}
        </div>

        {/* Submit Button */}
        <div>
          <button
            onClick={handleSubmit}
            disabled={!fileVerified || !isLoggedIn}
            className={`px-6 py-3 rounded-xl text-white transition ${
              fileVerified && isLoggedIn
                ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Submit your File
          </button>
        </div>
      </div>

      {/* Preview Tables (Always Visible) */}
      <div className="glass-card p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2" /> Faculty Data Preview
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border">
            <thead>
              <tr className="bg-gray-100">
                {Object.keys(defaultFacultyData[0]).map((col) => (
                  <th key={col} className="px-3 py-2 border">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facultyData.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-3 py-2 border">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2" /> Course Data Preview
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border">
            <thead>
              <tr className="bg-gray-100">
                {Object.keys(defaultCourseData[0]).map((col) => (
                  <th key={col} className="px-3 py-2 border">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courseData.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-3 py-2 border">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Download Button */}
      <div className="text-center">
        <button
          onClick={handleDownload}
          className="bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-600 transition"
        >
          Download Excel Sheet
        </button>
      </div>
    </div>
  );
};

export default ExcelPreview;
