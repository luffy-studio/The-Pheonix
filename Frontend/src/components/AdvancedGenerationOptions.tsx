import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Clock, 
  Users, 
  BookOpen, 
  AlertTriangle,
  Plus,
  Minus,
  Star
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  onPreferencesChange 
}: AdvancedOptionsProps) {
  const [timePreferences, setTimePreferences] = useState<TimePreference[]>([]);
  const [teacherWorkloads, setTeacherWorkloads] = useState<TeacherWorkload[]>([]);
  const [subjectPriorities, setSubjectPriorities] = useState<Record<string, number>>({});

  const addTimePreference = () => {
    const newPref: TimePreference = {
      day: "Monday",
      periods: [],
      preference: "neutral"
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
    const existing = teacherWorkloads.find(w => w.teacher_id === teacherId);
    let updated;
    
    if (existing) {
      updated = teacherWorkloads.map(w => 
        w.teacher_id === teacherId ? { ...w, ...workload } : w
      );
    } else {
      updated = [...teacherWorkloads, { 
        teacher_id: teacherId, 
        preferred_hours: 20,
        max_consecutive: 3,
        avoid_periods: [],
        ...workload 
      }];
    }
    
    setTeacherWorkloads(updated);
    onPreferencesChange({ ...preferences, teacher_workloads: updated });
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "text-red-600 bg-red-50";
    if (priority >= 6) return "text-orange-600 bg-orange-50";
    if (priority >= 4) return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return "Critical";
    if (priority >= 6) return "High";
    if (priority >= 4) return "Medium";
    return "Low";
  };

  return (
    <div className="space-y-6">
      {/* Time Slot Preferences */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Time Slot Preferences
          </CardTitle>
          <CardDescription>
            Configure preferred and avoided time slots for better scheduling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {timePreferences.map((pref, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border border-gray-200 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Select
                    value={pref.day}
                    onValueChange={(day) => updateTimePreference(index, { day })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {config.days.map((day: string) => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={pref.preference}
                    onValueChange={(preference: "preferred" | "avoid" | "neutral") => 
                      updateTimePreference(index, { preference })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preferred">Preferred</SelectItem>
                      <SelectItem value="avoid">Avoid</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeTimePreference(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>

              <div>
                <Label className="text-sm">Periods</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {config.time_slots.map((slot: any) => (
                    <Badge
                      key={slot.period}
                      variant={pref.periods.includes(slot.period) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const periods = pref.periods.includes(slot.period)
                          ? pref.periods.filter(p => p !== slot.period)
                          : [...pref.periods, slot.period];
                        updateTimePreference(index, { periods });
                      }}
                    >
                      P{slot.period} ({slot.time})
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          <Button
            variant="outline"
            onClick={addTimePreference}
            className="w-full glass-card border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Time Preference
          </Button>
        </CardContent>
      </Card>

      {/* Subject Priorities */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Subject Priorities
          </CardTitle>
          <CardDescription>
            Set importance levels for subjects to influence scheduling order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {config.available_subjects.map((subject: any) => (
              <div key={subject.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium">{subject.name}</div>
                  <div className="text-sm text-gray-600">{subject.code} • {subject.credits} credits</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32">
                    <Input
                      type="number"
                      value={subjectPriorities[subject.id] || 5}
                      onChange={(e) => updateSubjectPriority(subject.id, parseInt(e.target.value) || 5)}
                      max={10}
                      min={1}
                      className="text-center"
                    />
                  </div>
                  <Badge className={`w-16 text-center ${getPriorityColor(subjectPriorities[subject.id] || 5)}`}>
                    {getPriorityLabel(subjectPriorities[subject.id] || 5)}
                  </Badge>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium">{subjectPriorities[subject.id] || 5}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Teacher Workload Management */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Teacher Workload Management
          </CardTitle>
          <CardDescription>
            Configure individual teacher preferences and constraints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {config.available_teachers.map((teacher: any) => {
              const workload = teacherWorkloads.find(w => w.teacher_id === teacher.id);
              return (
                <div key={teacher.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{teacher.name}</div>
                      <div className="text-sm text-gray-600">
                        {teacher.department} • Max: {teacher.max_credits} hrs
                      </div>
                    </div>
                    <Badge variant="outline">
                      Primary: {teacher.primary_subject}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Preferred Hours/Week</Label>
                      <Input
                        type="number"
                        value={workload?.preferred_hours || teacher.max_credits}
                        onChange={(e) => 
                          updateTeacherWorkload(teacher.id, { preferred_hours: parseInt(e.target.value) || teacher.max_credits })
                        }
                        max={teacher.max_credits}
                        min={5}
                        className="mt-2"
                      />
                      <div className="text-xs text-gray-600 mt-1">
                        {workload?.preferred_hours || teacher.max_credits} hours
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Max Consecutive Periods</Label>
                      <Input
                        type="number"
                        value={workload?.max_consecutive || 3}
                        onChange={(e) => 
                          updateTeacherWorkload(teacher.id, { max_consecutive: parseInt(e.target.value) || 3 })
                        }
                        max={6}
                        min={1}
                        className="mt-2"
                      />
                      <div className="text-xs text-gray-600 mt-1">
                        {workload?.max_consecutive || 3} periods
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Generation Constraints */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Generation Constraints
          </CardTitle>
          <CardDescription>
            Additional rules and constraints for timetable generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="prevent-back-labs"
                checked={preferences.prevent_back_labs || false}
                onCheckedChange={(checked: boolean) => 
                  onPreferencesChange({ ...preferences, prevent_back_labs: checked })
                }
              />
              <Label htmlFor="prevent-back-labs">Prevent Back-to-Back Labs</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="balance-daily-load"
                checked={preferences.balance_daily_load || true}
                onCheckedChange={(checked: boolean) => 
                  onPreferencesChange({ ...preferences, balance_daily_load: checked })
                }
              />
              <Label htmlFor="balance-daily-load">Balance Daily Load</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="minimize-travel"
                checked={preferences.minimize_travel || true}
                onCheckedChange={(checked: boolean) => 
                  onPreferencesChange({ ...preferences, minimize_travel: checked })
                }
              />
              <Label htmlFor="minimize-travel">Minimize Teacher Travel</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="optimize-rooms"
                checked={preferences.optimize_rooms || false}
                onCheckedChange={(checked: boolean) => 
                  onPreferencesChange({ ...preferences, optimize_rooms: checked })
                }
              />
              <Label htmlFor="optimize-rooms">Optimize Room Usage</Label>
            </div>
          </div>

          <div>
            <Label>Preferred Start Time</Label>
            <Select
              value={preferences.preferred_start_time || "09:00"}
              onValueChange={(time) => 
                onPreferencesChange({ ...preferences, preferred_start_time: time })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="08:00">08:00 AM</SelectItem>
                <SelectItem value="09:00">09:00 AM</SelectItem>
                <SelectItem value="10:00">10:00 AM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Maximum Gap Between Classes</Label>
            <Input
              type="number"
              value={preferences.max_gap_hours || 2}
              onChange={(e) => 
                onPreferencesChange({ ...preferences, max_gap_hours: parseInt(e.target.value) || 2 })
              }
              max={4}
              min={0}
              className="mt-2"
            />
            <div className="text-sm text-gray-600 mt-1">
              {preferences.max_gap_hours || 2} hours maximum gap
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}