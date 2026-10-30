import React, { useState } from "react";
import {
  Clock,
  Users,
  BookOpen,
  Plus,
  Minus,
  Sliders,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface AdvancedOptionsProps {
  config: any;
  preferences: any;
  onPreferencesChange: (prefs: any) => void;
}

interface TimePreference {
  day: string;
  periods: number[];
  preference: "preferred" | "avoid" | "neutral";
}

interface TeacherWorkload {
  teacher_id: string;
  preferred_hours: number;
  max_consecutive: number;
  avoid_periods: number[];
}

export default function AdvancedGenerationOptions({
  config,
  preferences,
  onPreferencesChange,
}: AdvancedOptionsProps) {
  const [timePreferences, setTimePreferences] = useState<TimePreference[]>([]);
  const [teacherWorkloads, setTeacherWorkloads] = useState<TeacherWorkload[]>([]);
  const [subjectPriorities, setSubjectPriorities] = useState<Record<string, number>>({});

  const addTimePreference = () => {
    const newPref: TimePreference = {
      day: "Monday",
      periods: [],
      preference: "neutral",
    };
    setTimePreferences([...timePreferences, newPref]);
  };

  const removeTimePreference = (index: number) => {
    setTimePreferences(timePreferences.filter((_, i) => i !== index));
  };

  const updateTimePreference = (index: number, updates: Partial<TimePreference>) => {
    const updated = timePreferences.map((pref, i) =>
      i === index ? { ...pref, ...updates } : pref
    );
    setTimePreferences(updated);
    onPreferencesChange({ ...preferences, time_preferences: updated });
  };

  const updateSubjectPriority = (subjectId: string, priority: number) => {
    const updated = { ...subjectPriorities, [subjectId]: priority };
    setSubjectPriorities(updated);
    onPreferencesChange({ ...preferences, subject_priorities: updated });
  };

  const updateTeacherWorkload = (teacherId: string, workload: Partial<TeacherWorkload>) => {
    const existing = teacherWorkloads.find((w) => w.teacher_id === teacherId);
    let updated;

    if (existing) {
      updated = teacherWorkloads.map((w) =>
        w.teacher_id === teacherId ? { ...w, ...workload } : w
      );
    } else {
      updated = [
        ...teacherWorkloads,
        {
          teacher_id: teacherId,
          preferred_hours: 20,
          max_consecutive: 3,
          avoid_periods: [],
          ...workload,
        },
      ];
    }

    setTeacherWorkloads(updated);
    onPreferencesChange({ ...preferences, teacher_workloads: updated });
  };

  return (
    <div className="space-y-6">
      {/* Time Slot Preferences */}
      <div className="rounded-xl border border-[#23252E] bg-[#14151A] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#23252E] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span>Time Slot Rules</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Specify preferred or avoided periods per day</p>
          </div>
          <button
            type="button"
            onClick={addTimePreference}
            className="px-2.5 py-1 rounded-md text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </div>

        <div className="space-y-3">
          {timePreferences.length === 0 ? (
            <p className="text-xs text-zinc-500 py-2 text-center">
              No custom slot preferences set. Standard algorithm weighting will be used.
            </p>
          ) : (
            timePreferences.map((pref, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-[#181920] border border-[#23252E] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={pref.day}
                      onChange={(e) => updateTimePreference(index, { day: e.target.value })}
                      className="px-2.5 py-1 rounded bg-[#111216] border border-[#262833] text-zinc-200 text-xs focus:outline-none"
                    >
                      {config?.days?.map((day: string) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>

                    <select
                      value={pref.preference}
                      onChange={(e) =>
                        updateTimePreference(index, {
                          preference: e.target.value as "preferred" | "avoid" | "neutral",
                        })
                      }
                      className="px-2.5 py-1 rounded bg-[#111216] border border-[#262833] text-zinc-200 text-xs focus:outline-none"
                    >
                      <option value="preferred">Prefer Slot</option>
                      <option value="avoid">Avoid Slot</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeTimePreference(index)}
                    className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <span className="block text-[11px] text-zinc-400 mb-1">
                    Select target periods:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {config?.time_slots?.map((slot: any) => {
                      const isSelected = pref.periods.includes(slot.period);
                      return (
                        <button
                          key={slot.period}
                          type="button"
                          onClick={() => {
                            const periods = isSelected
                              ? pref.periods.filter((p) => p !== slot.period)
                              : [...pref.periods, slot.period];
                            updateTimePreference(index, { periods });
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-[#14151A] text-zinc-400 border border-[#23252E] hover:text-zinc-200"
                          }`}
                        >
                          P{slot.period}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Subject Priority Weights */}
      <div className="rounded-xl border border-[#23252E] bg-[#14151A] p-5 space-y-4">
        <div className="border-b border-[#23252E] pb-3">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-zinc-400" />
            <span>Subject Priorities</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">Higher priority subjects are scheduled earlier in the day</p>
        </div>

        <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
          {config?.available_subjects?.map((subject: any) => {
            const currentPriority = subjectPriorities[subject.id] || 5;
            return (
              <div
                key={subject.id}
                className="p-3 rounded-lg bg-[#181920] border border-[#23252E] flex items-center justify-between gap-3 text-xs"
              >
                <div className="truncate">
                  <div className="font-medium text-zinc-200 truncate">{subject.name}</div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    {subject.code} • {subject.credits} credits
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 flex-shrink-0">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={currentPriority}
                    onChange={(e) =>
                      updateSubjectPriority(subject.id, parseInt(e.target.value) || 5)
                    }
                    className="w-20 accent-indigo-500"
                  />
                  <span className="w-8 text-center text-xs font-mono text-zinc-300">
                    {currentPriority}/10
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Teacher Workload Limits */}
      <div className="rounded-xl border border-[#23252E] bg-[#14151A] p-5 space-y-4">
        <div className="border-b border-[#23252E] pb-3">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-400" />
            <span>Faculty Caps</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">Set weekly maximum hours and consecutive class limits</p>
        </div>

        <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
          {config?.available_teachers?.map((teacher: any) => {
            const workload = teacherWorkloads.find((w) => w.teacher_id === teacher.id);
            const preferredHours = workload?.preferred_hours || teacher.max_credits;
            const maxConsecutive = workload?.max_consecutive || 3;

            return (
              <div
                key={teacher.id}
                className="p-3 rounded-lg bg-[#181920] border border-[#23252E] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-zinc-200">{teacher.name}</div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    {teacher.department} • Max: {teacher.max_credits} hrs
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#23252E]">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-0.5">
                      Max Hours/Week
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={teacher.max_credits || 30}
                      value={preferredHours}
                      onChange={(e) =>
                        updateTeacherWorkload(teacher.id, {
                          preferred_hours: parseInt(e.target.value) || teacher.max_credits,
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-[#111216] border border-[#262833] text-zinc-200 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-0.5">
                      Max Consecutive
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={maxConsecutive}
                      onChange={(e) =>
                        updateTeacherWorkload(teacher.id, {
                          max_consecutive: parseInt(e.target.value) || 3,
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-[#111216] border border-[#262833] text-zinc-200 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Constraints */}
      <div className="rounded-xl border border-[#23252E] bg-[#14151A] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-100 border-b border-[#23252E] pb-3">
          Additional Constraints
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#181920] border border-[#23252E] cursor-pointer">
            <Checkbox
              checked={preferences.prevent_back_labs || false}
              onCheckedChange={(checked: boolean) =>
                onPreferencesChange({ ...preferences, prevent_back_labs: checked })
              }
            />
            <span className="text-zinc-300">Prevent Back-to-Back Labs</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#181920] border border-[#23252E] cursor-pointer">
            <Checkbox
              checked={preferences.balance_daily_load ?? true}
              onCheckedChange={(checked: boolean) =>
                onPreferencesChange({ ...preferences, balance_daily_load: checked })
              }
            />
            <span className="text-zinc-300">Balance Daily Load</span>
          </label>
        </div>
      </div>
    </div>
  );
}
