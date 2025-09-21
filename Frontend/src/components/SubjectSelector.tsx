import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  BookOpen,
  User,
  ChevronDown,
  ChevronRight,
  Check,
} from "lucide-react";

export interface Subject {
  Subject_Name: string;
  Subject_Code: string;
  Subject_Type: string;
  Department: string;
  Credits: number;
}

interface SubjectSelectorProps {
  isOpen: boolean;
  onToggle: () => void;
  userId: string; // 👈 Pass current logged-in user's id
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  isOpen,
  onToggle,
  userId,
}) => {
  // Pre-populate with realistic subjects that match teacher expertise
  const [subjects, setSubjects] = useState<Subject[]>([
    { Subject_Name: "Data Structures", Subject_Code: "CS201", Subject_Type: "Core", Department: "CSE", Credits: 3 },
    { Subject_Name: "Algorithms", Subject_Code: "CS301", Subject_Type: "Core", Department: "CSE", Credits: 4 },
    { Subject_Name: "Digital Electronics", Subject_Code: "EC202", Subject_Type: "Core", Department: "ECE", Credits: 3 },
    { Subject_Name: "VLSI Design", Subject_Code: "EC302", Subject_Type: "Core", Department: "ECE", Credits: 4 },
    { Subject_Name: "Thermodynamics", Subject_Code: "ME203", Subject_Type: "Core", Department: "Mechanical", Credits: 3 },
    { Subject_Name: "Fluid Mechanics", Subject_Code: "ME303", Subject_Type: "Core", Department: "Mechanical", Credits: 4 },
    { Subject_Name: "Machine Learning", Subject_Code: "AI201", Subject_Type: "Core", Department: "AIML", Credits: 4 },
    { Subject_Name: "Deep Learning", Subject_Code: "AI301", Subject_Type: "Core", Department: "AIML", Credits: 4 },
    { Subject_Name: "Structural Analysis", Subject_Code: "CE204", Subject_Type: "Core", Department: "Civil", Credits: 3 },
    { Subject_Name: "Surveying", Subject_Code: "CE304", Subject_Type: "Core", Department: "Civil", Credits: 3 },
    { Subject_Name: "Embedded Systems", Subject_Code: "IoT201", Subject_Type: "Core", Department: "IoT", Credits: 4 },
    { Subject_Name: "Wireless Networks", Subject_Code: "IoT301", Subject_Type: "Core", Department: "IoT", Credits: 3 },
    { Subject_Name: "Organizational Behavior", Subject_Code: "MG201", Subject_Type: "Core", Department: "Management", Credits: 3 },
    { Subject_Name: "Business Ethics", Subject_Code: "MG301", Subject_Type: "Core", Department: "Management", Credits: 2 }
  ]);
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const [newSubject, setNewSubject] = useState<Subject>({
    Subject_Name: "",
    Subject_Code: "",
    Subject_Type: "Core",
    Department: "",
    Credits: 0,
  });

  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([
    "All",
  ]);

  // --- Add subject to local state only ---
  const handleAddSubject = () => {
    if (newSubject.Subject_Name.trim() && newSubject.Subject_Code.trim()) {
      setSubjects((prev) => [...prev, newSubject]);
      setNewSubject({
        Subject_Name: "",
        Subject_Code: "",
        Department: "",
        Credits: 0,
        Subject_Type: "Core",
      });
      setIsAddingSubject(false);
    }
  };

  // --- Remove subject from local state ---
  const handleRemoveSubject = (code: string) => {
    setSubjects((prev) => prev.filter((s) => s.Subject_Code !== code));
  };

  // --- Submit all subjects to Supabase ---
  const handleSubmitAll = async () => {
    if (subjects.length === 0) {
      console.log("No subjects to submit");
      return;
    }

    if (!userId || userId.trim() === '') {
      console.error("❌ User ID is missing or empty:", userId);
      alert("Error: User ID not found. Please log in again.");
      return;
    }

    console.log("📤 Submitting subjects for User ID:", userId);

    // Use backend endpoint instead of direct Supabase
    const payload = {
      user_id: userId,
      details: subjects // Send subjects array directly
    };

    console.log("📦 Payload to submit:", payload);

    try {
      const response = await fetch("http://localhost:8000/upload_subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        console.log("✅ Submitted successfully:", data);
        alert(`✅ Successfully submitted ${data.inserted_subjects} subjects!`);
        setSubjects([]); // clear after submit
      } else {
        throw new Error(data.detail || data.message || "Unknown error");
      }
    } catch (error: any) {
      console.error("❌ Error submitting subjects:", error.message);
      alert(`Error submitting subjects: ${error.message}`);
    }
  };

  // --- Department toggle ---
  const toggleDepartment = (department: string) => {
    setExpandedDepartments((prev) =>
      prev.includes(department)
        ? prev.filter((d) => d !== department)
        : [...prev, department]
    );
  };

  // --- Department list ---
  const departments = [
    "All",
    ...Array.from(new Set(subjects.map((s) => s.Department).filter(Boolean))),
  ];

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-80 glass-nav z-50 lg:relative lg:w-96 lg:translate-x-0"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Subjects
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggle}
              className="lg:hidden p-2 rounded-xl glass hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Add Subject Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddingSubject(true)}
              className="w-full interactive-button text-white font-semibold py-3 px-4 rounded-2xl flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Subject</span>
            </motion.button>

            {/* Department Filter */}
            <div className="space-y-3">
              {/* Responsive, elegant departments list: responsive max-height, scrollbar niceties */}
              <div className="max-h-28 sm:max-h-40 lg:max-h-48 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300/60 overscroll-contain">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Departments
                </h3>
                {departments.map((department) => (
                  <motion.button
                    key={department}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleDepartment(department)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                      expandedDepartments.includes(department)
                        ? "glass-card text-gray-800"
                        : "glass hover:bg-white/10 text-gray-600"
                    }`}
                  >
                    <span className="font-medium">{department}</span>
                    {expandedDepartments.includes(department) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Subjects List */}
            <div className="space-y-3">
              {/* Responsive subjects list: larger max-height on wider screens, padding for scrollbar */}
              <div className="max-h-60 sm:max-h-72 lg:max-h-96 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300/60 overscroll-contain">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Added Subjects ({subjects.length})
                </h3>
                <div className="space-y-2">
                  {subjects.map((subject, index) => (
                  <motion.div
                    key={`${subject.Subject_Code}-${index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="interactive-card p-4 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                          {subject.Subject_Name}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {subject.Subject_Code}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <User className="w-3 h-3 mr-1" />
                          {subject.Department}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Credits: {subject.Credits}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveSubject(subject.Subject_Code)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {subjects.length > 0 && (
            <div className="p-6 border-t border-white/10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmitAll}
                className="w-full interactive-button text-white font-semibold py-3 px-4 rounded-2xl flex items-center justify-center space-x-2"
              >
                <Check className="w-5 h-5" />
                <span>Submit All</span>
              </motion.button>
            </div>
          )}
        </div>

        {/* Add Subject Modal */}
        <AnimatePresence>
          {isAddingSubject && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass-card p-6 rounded-3xl w-full max-w-md"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Add New Subject
                </h3>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Subject Name"
                    value={newSubject.Subject_Name}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        Subject_Name: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-xl glass border-0 focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Subject Code"
                    value={newSubject.Subject_Code}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        Subject_Code: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-xl glass border-0 focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Department"
                    value={newSubject.Department}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        Department: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-xl glass border-0 focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Credits"
                    value={newSubject.Credits || ""}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        Credits: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full p-3 rounded-xl glass border-0 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsAddingSubject(false)}
                    className="flex-1 glass-card py-3 px-4 rounded-xl font-medium text-gray-700 hover:bg-white/20"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddSubject}
                    className="flex-1 interactive-button text-white font-semibold py-3 px-4 rounded-xl"
                  >
                    Add Subject
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default SubjectSelector;
