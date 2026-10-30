import React, { useState } from "react";
import {
  Plus,
  X,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Check,
  Layers,
  Loader2,
  Trash2,
} from "lucide-react";
import { getBackendUrl, getAuthHeaders } from "@/lib/backendApi";
import { useToast } from "@/components/ui/use-toast";

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
  userId: string;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  isOpen,
  onToggle,
  userId,
}) => {
  const { toast } = useToast();
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
  ]);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>("All");

  const [newSubject, setNewSubject] = useState<Subject>({
    Subject_Name: "",
    Subject_Code: "",
    Subject_Type: "Core",
    Department: "CSE",
    Credits: 3,
  });

  const handleAddSubject = () => {
    if (newSubject.Subject_Name.trim() && newSubject.Subject_Code.trim()) {
      setSubjects((prev) => [newSubject, ...prev]);
      setNewSubject({
        Subject_Name: "",
        Subject_Code: "",
        Department: "CSE",
        Credits: 3,
        Subject_Type: "Core",
      });
      setIsAddingSubject(false);
      toast({
        title: "Subject Added",
        description: `${newSubject.Subject_Name} (${newSubject.Subject_Code}) added to local list.`,
      });
    }
  };

  const handleRemoveSubject = (code: string) => {
    setSubjects((prev) => prev.filter((s) => s.Subject_Code !== code));
  };

  const handleSubmitAll = async () => {
    if (subjects.length === 0) {
      toast({
        title: "No Subjects",
        description: "Add subjects to the list before submitting.",
        variant: "destructive",
      });
      return;
    }

    const currentUserId = userId || (typeof window !== "undefined" ? localStorage.getItem("userId") : null);

    if (!currentUserId || currentUserId.trim() === "") {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save subjects to your account.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      user_id: currentUserId,
      details: subjects,
    };

    try {
      const backend = getBackendUrl();
      const response = await fetch(`${backend}/upload_subjects`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        toast({
          title: "Subjects Saved",
          description: `Successfully uploaded ${data.inserted_subjects || subjects.length} subjects to database.`,
        });
      } else {
        throw new Error(data.detail || data.message || "Failed to upload subjects");
      }
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "An error occurred while uploading subjects.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = [
    "All",
    ...Array.from(new Set(subjects.map((s) => s.Department).filter(Boolean))),
  ];

  const filteredSubjects =
    selectedDept === "All"
      ? subjects
      : subjects.filter((s) => s.Department === selectedDept);

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      {/* Catalog Container */}
      <div
        className={`w-full rounded-xl border border-[#23252E] bg-[#14151A] overflow-hidden flex flex-col ${
          isOpen ? "block" : "hidden lg:flex"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#23252E] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>Subject Catalog</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#1C1E26] text-zinc-400">
                {subjects.length}
              </span>
            </h2>
          </div>

          <button
            onClick={onToggle}
            className="lg:hidden p-1 rounded text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4">
          {/* Add Subject Quick Action */}
          <button
            onClick={() => setIsAddingSubject(true)}
            className="w-full py-2 px-3 rounded-lg text-xs font-medium text-zinc-200 bg-[#181920] hover:bg-[#20222B] border border-[#262833] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Subject</span>
          </button>

          {/* Department Filter Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Filter by Department</span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {departments.length - 1} depts
              </span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    selectedDept === dept
                      ? "bg-indigo-600 text-white"
                      : "bg-[#181920] text-zinc-400 hover:text-zinc-200 border border-[#262833]"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Subjects List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Courses ({filteredSubjects.length})</span>
            </div>

            <div className="max-h-[320px] overflow-y-auto pr-1 space-y-1.5">
              {filteredSubjects.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">
                  No subjects in this department.
                </div>
              ) : (
                filteredSubjects.map((subject, index) => (
                  <div
                    key={`${subject.Subject_Code}-${index}`}
                    className="p-3 rounded-lg bg-[#181920] border border-[#23252E] hover:border-[#2E313D] transition-colors group flex items-start justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-zinc-200 truncate">
                          {subject.Subject_Name}
                        </span>
                        <span className="text-[10px] font-mono px-1 rounded bg-[#20222B] text-zinc-400">
                          {subject.Subject_Code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span>{subject.Department}</span>
                        <span>•</span>
                        <span>{subject.Credits} Cr</span>
                        <span>•</span>
                        <span>{subject.Subject_Type}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveSubject(subject.Subject_Code)}
                      title="Remove"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-rose-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {subjects.length > 0 && (
          <div className="p-3 border-t border-[#23252E] bg-[#111216]">
            <button
              onClick={handleSubmitAll}
              disabled={isSubmitting}
              className="w-full py-2 px-3 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Subjects to Database ({subjects.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      {isAddingSubject && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#23252E] bg-[#14151A] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#23252E] pb-3">
              <h3 className="text-sm font-semibold text-zinc-100">Add New Subject</h3>
              <button
                onClick={() => setIsAddingSubject(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operating Systems"
                  value={newSubject.Subject_Name}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, Subject_Name: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-[#181920] border border-[#262833] text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS301"
                    value={newSubject.Subject_Code}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, Subject_Code: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#181920] border border-[#262833] text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE"
                    value={newSubject.Department}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, Department: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#181920] border border-[#262833] text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Type
                  </label>
                  <select
                    value={newSubject.Subject_Type}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, Subject_Type: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#181920] border border-[#262833] text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="Lab">Lab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={newSubject.Credits || ""}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        Credits: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#181920] border border-[#262833] text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingSubject(false)}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-[#181920] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSubject}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubjectSelector;
