import React, { useMemo, useState } from "react";
import { Calendar, Clock, User, BookOpen, Download, Share2, MapPin } from "lucide-react";

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
  timeSlot?: string;
  class_name?: string;
  room?: string;
}

interface PreviewCardProps {
  title: string;
  timetableData: { [key: string]: TimetableEntry };
  className?: string;
  onExport?: () => void;
  onShare?: () => void;
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const periods = [1, 2, 3, 4, 5, 6];

const PreviewCard: React.FC<PreviewCardProps> = ({
  title,
  timetableData,
  className = "",
  onExport,
  onShare,
}) => {
  const [teacherView, setTeacherView] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  const getCellKey = (day: string, period: number) => `${day}-${period}`;

  const teachers = useMemo(() => {
    const set = new Set<string>();
    Object.values(timetableData).forEach((entry) => {
      if (entry?.subject?.teacher) set.add(entry.subject.teacher);
    });
    return Array.from(set);
  }, [timetableData]);

  const teacherMap = useMemo(() => {
    const map: Record<string, Record<string, TimetableEntry>> = {};
    Object.entries(timetableData).forEach(([key, entry]) => {
      const teacher = entry?.subject?.teacher || "TBA";
      if (!map[teacher]) map[teacher] = {};
      map[teacher][key] = entry;
    });
    return map;
  }, [timetableData]);

  React.useEffect(() => {
    if (!selectedTeacher && teachers.length > 0) setSelectedTeacher(teachers[0]);
  }, [teachers, selectedTeacher]);

  const getTotalSubjects = () => {
    const subjects = new Set<string>();
    Object.values(timetableData).forEach((entry) => {
      if (entry?.subject?.id) subjects.add(entry.subject.id);
    });
    return subjects.size;
  };

  const getTotalClasses = () => {
    return Object.keys(timetableData).length;
  };

  const renderOverviewCell = (key: string) => {
    const entry = timetableData[key];
    return (
      <div
        key={key}
        className={`p-2 rounded-md min-h-[54px] flex flex-col justify-between border text-left ${
          entry
            ? "bg-[#181920] border-[#2B2E3B]"
            : "bg-[#111216] border-dashed border-[#23252E]"
        }`}
      >
        {entry ? (
          <>
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold text-xs text-zinc-100 truncate">
                {entry.subject.name}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {entry.subject.code}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate mt-1">
              {entry.subject.teacher || "TBA"}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <span className="text-[11px] text-zinc-600">—</span>
          </div>
        )}
      </div>
    );
  };

  const renderTeacherCell = (key: string, teacherKey: string | null) => {
    if (!teacherKey) {
      return (
        <div className="p-2 border border-dashed border-[#23252E] rounded-md bg-[#111216] flex items-center justify-center min-h-[54px]">
          <span className="text-[11px] text-zinc-600">—</span>
        </div>
      );
    }
    const entry = teacherMap[teacherKey]?.[key];
    if (!entry) {
      return (
        <div className="p-2 border border-dashed border-[#23252E] rounded-md bg-[#111216] flex items-center justify-center min-h-[54px]">
          <span className="text-[11px] text-zinc-600">—</span>
        </div>
      );
    }

    return (
      <div
        key={key}
        className="p-2 rounded-md min-h-[54px] flex flex-col justify-between bg-[#162030] border border-[#22334D] text-left"
      >
        <div className="text-xs font-semibold text-zinc-100 truncate">
          {entry.class_name ?? entry.subject.name}
        </div>
        <div className="text-[10px] text-blue-200 font-mono truncate mt-0.5">
          {entry.subject.name}
        </div>
        {entry.room && (
          <div className="text-[9px] text-zinc-400 mt-1 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-zinc-500" />
            <span className="truncate">{entry.room}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`rounded-xl border border-[#23252E] bg-[#14151A] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-[#23252E] bg-[#111216]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-[#1C1E26] border border-[#2B2D3A] flex items-center justify-center text-zinc-300">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {getTotalSubjects()} Subjects • {getTotalClasses()} Slots • {teachers.length} Faculty
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 rounded-lg bg-[#181920] border border-[#262833]">
              <button
                type="button"
                onClick={() => setTeacherView(false)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  !teacherView
                    ? "bg-[#232530] text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Cohort View
              </button>
              <button
                type="button"
                onClick={() => setTeacherView(true)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  teacherView
                    ? "bg-[#232530] text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Faculty View
              </button>
            </div>

            {onExport && (
              <button
                type="button"
                onClick={onExport}
                title="Download CSV"
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 bg-[#181920] border border-[#262833] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}

            {onShare && (
              <button
                type="button"
                onClick={onShare}
                title="Share"
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 bg-[#181920] border border-[#262833] transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-4">
        {teacherView && (
          <div className="mb-4 p-3 rounded-lg bg-[#181920] border border-[#23252E] space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Select Faculty Member</span>
              <span className="font-mono text-zinc-500">{teachers.length} available</span>
            </div>

            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
              {teachers.map((t) => {
                const count = Object.keys(teacherMap[t] || {}).length;
                const isSelected = selectedTeacher === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTeacher(t)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-[#14151A] text-zinc-400 border border-[#23252E] hover:text-zinc-200"
                    }`}
                  >
                    <span>{t}</span>
                    <span className="ml-1 opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            {/* Headers */}
            <div className="grid grid-cols-6 gap-1.5 mb-1.5 text-xs text-center font-medium">
              <div className="p-2 text-zinc-500 bg-[#181920] rounded-md border border-[#23252E]">
                Period
              </div>
              {days.map((day) => (
                <div
                  key={day}
                  className="p-2 text-zinc-300 bg-[#181920] rounded-md border border-[#23252E]"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="space-y-1.5">
              {periods.map((period) => (
                <div key={period} className="grid grid-cols-6 gap-1.5">
                  <div className="p-2 bg-[#181920] border border-[#23252E] rounded-md flex items-center justify-center text-center">
                    <span className="text-xs font-semibold text-zinc-300">P{period}</span>
                  </div>
                  {days.map((day) => {
                    const key = getCellKey(day, period);
                    return teacherView
                      ? renderTeacherCell(key, selectedTeacher)
                      : renderOverviewCell(key);
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCard;
