import React from "react";
import { Clock, User, BookOpen, MapPin } from "lucide-react";

interface TimetablePreviewProps {
  timetableData: any;
  className?: string;
}

interface ScheduleEntry {
  day: string;
  period: number;
  start_time: string;
  end_time: string;
  subject: string;
  subject_code: string;
  teacher: string;
  room: string;
  subject_type: string;
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const periods = [1, 2, 3, 4, 5, 6];

const getSubjectBadgeStyle = (subjectType: string) => {
  switch (subjectType?.toLowerCase()) {
    case "theory":
      return "bg-[#162030] text-blue-200 border-[#22334D]";
    case "practical":
      return "bg-[#14261F] text-emerald-200 border-[#203D32]";
    case "lab":
      return "bg-[#221B2E] text-purple-200 border-[#382B4D]";
    case "field work":
      return "bg-[#2A2016] text-amber-200 border-[#473420]";
    default:
      return "bg-[#181A22] text-zinc-200 border-[#282B38]";
  }
};

const getPeriodTimes = (period: number) => {
  switch (period) {
    case 1:
      return "09:00 - 10:00";
    case 2:
      return "10:00 - 11:00";
    case 3:
      return "11:30 - 12:30";
    case 4:
      return "12:30 - 13:30";
    case 5:
      return "14:30 - 15:30";
    case 6:
      return "15:30 - 16:30";
    default:
      return "TBA";
  }
};

const TimetablePreview: React.FC<TimetablePreviewProps> = ({
  timetableData,
  className = "",
}) => {
  if (!timetableData || !timetableData.classes || timetableData.classes.length === 0) {
    return (
      <div className={`p-8 text-center rounded-xl border border-[#23252E] bg-[#14151A] ${className}`}>
        <Clock className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-zinc-200">No Timetable Data</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
          Generate a timetable to preview the weekly schedule matrix.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {timetableData.classes.map((classData: any, classIndex: number) => {
        const uniqueSubjects = new Set(
          classData.schedule?.map((s: ScheduleEntry) => s.subject).filter(Boolean) || []
        ).size;
        const uniqueTeachers = new Set(
          classData.schedule?.map((s: ScheduleEntry) => s.teacher).filter(Boolean) || []
        ).size;
        const totalPeriods = classData.schedule?.length || 0;

        return (
          <div
            key={classIndex}
            className="rounded-xl border border-[#23252E] bg-[#14151A] overflow-hidden"
          >
            {/* Class Header */}
            <div className="p-4 border-b border-[#23252E] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-md bg-[#1C1E26] border border-[#2B2D3A] flex items-center justify-center text-zinc-300">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">
                    {classData.class_name || classData.name}
                  </h3>
                  <div className="text-xs text-zinc-500">
                    {classData.department} • {totalPeriods} Periods Assigned
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="px-2 py-0.5 rounded bg-[#181920] border border-[#262833]">
                  {uniqueSubjects} Subjects
                </span>
                <span className="px-2 py-0.5 rounded bg-[#181920] border border-[#262833]">
                  {uniqueTeachers} Faculty
                </span>
              </div>
            </div>

            {/* Matrix View */}
            <div className="p-4 overflow-x-auto">
              <div className="min-w-[760px]">
                {/* Header Days Row */}
                <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-xs text-center font-medium">
                  <div className="p-2 text-zinc-500 bg-[#181920] rounded-md border border-[#23252E]">
                    Period
                  </div>
                  {days.map((day) => (
                    <div
                      key={day}
                      className="p-2 text-zinc-300 bg-[#181920] rounded-md border border-[#23252E]"
                    >
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                {/* Periods Matrix */}
                <div className="space-y-1.5">
                  {periods.map((period) => {
                    const periodEntries: Record<string, ScheduleEntry> = {};
                    classData.schedule?.forEach((entry: ScheduleEntry) => {
                      if (entry.period === period) {
                        periodEntries[entry.day] = entry;
                      }
                    });

                    return (
                      <div key={period} className="grid grid-cols-7 gap-1.5">
                        {/* Period Label */}
                        <div className="p-2 bg-[#181920] border border-[#23252E] rounded-md flex flex-col justify-center text-center">
                          <span className="text-xs font-semibold text-zinc-200">
                            P{period}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {getPeriodTimes(period)}
                          </span>
                        </div>

                        {/* Days Slots */}
                        {days.map((day) => {
                          const entry = periodEntries[day];

                          if (entry) {
                            return (
                              <div
                                key={`${day}-${period}`}
                                className={`p-2 rounded-md border text-left flex flex-col justify-between min-h-[58px] ${getSubjectBadgeStyle(
                                  entry.subject_type
                                )}`}
                              >
                                <div>
                                  <div className="font-semibold text-xs leading-tight line-clamp-1">
                                    {entry.subject}
                                  </div>
                                  <div className="text-[10px] opacity-75 font-mono mt-0.5">
                                    {entry.subject_code}
                                  </div>
                                </div>

                                <div className="text-[10px] opacity-80 truncate mt-1 flex items-center justify-between">
                                  <span className="truncate">{entry.teacher}</span>
                                  {entry.room && entry.room !== "TBA" && (
                                    <span className="text-[9px] opacity-70 ml-1">
                                      {entry.room}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={`${day}-${period}`}
                              className="p-2 border border-dashed border-[#23252E] rounded-md bg-[#111216] flex items-center justify-center text-center min-h-[58px]"
                            >
                              <span className="text-[11px] text-zinc-600">—</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend Footer */}
            <div className="px-4 py-2.5 bg-[#111216] border-t border-[#23252E] flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
              <span className="text-zinc-500 text-[11px]">Legend:</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#162030] text-blue-200 border border-[#22334D]">
                  Theory
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#221B2E] text-purple-200 border border-[#382B4D]">
                  Lab
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#14261F] text-emerald-200 border border-[#203D32]">
                  Practical
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimetablePreview;
