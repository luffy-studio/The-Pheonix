import React from "react";
import { motion } from "framer-motion";
import { Clock, User, BookOpen, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

const getSubjectColor = (subjectType: string) => {
  switch (subjectType) {
    case "Theory":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Practical":
      return "bg-green-100 text-green-800 border-green-200";
    case "Lab":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Field Work":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const TimetablePreview: React.FC<TimetablePreviewProps> = ({ 
  timetableData, 
  className = "" 
}) => {
  if (!timetableData || !timetableData.classes || timetableData.classes.length === 0) {
    return (
      <Card className={`glass-card border-0 ${className}`}>
        <CardContent className="p-8 text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Timetable Data</h3>
          <p className="text-gray-600">Generate a timetable to see the preview here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {timetableData.classes.map((classData: any, classIndex: number) => (
        <motion.div
          key={classIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: classIndex * 0.1 }}
        >
          <Card className="glass-card border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  {classData.class_name}
                </CardTitle>
                <Badge variant="outline">
                  {classData.department}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Timetable Grid */}
              <div className="overflow-x-auto">
                <div className="grid grid-cols-7 gap-1 min-w-full">
                  {/* Header Row */}
                  <div className="p-3 font-semibold text-center bg-gray-100 rounded-lg">
                    Time / Day
                  </div>
                  {days.map((day) => (
                    <div
                      key={day}
                      className="p-3 font-semibold text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg"
                    >
                      {day.slice(0, 3)}
                    </div>
                  ))}

                  {/* Time Periods */}
                  {periods.map((period) => {
                    // Find schedule entries for this period
                    const periodEntries: Record<string, ScheduleEntry> = {};
                    
                    classData.schedule?.forEach((entry: ScheduleEntry) => {
                      if (entry.period === period) {
                        periodEntries[entry.day] = entry;
                      }
                    });

                    return (
                      <React.Fragment key={period}>
                        {/* Period Label */}
                        <div className="p-3 font-medium text-center bg-gray-50 border border-gray-200 rounded-lg flex flex-col justify-center">
                          <div className="text-sm font-semibold">P{period}</div>
                          <div className="text-xs text-gray-600">
                            {period === 1 && "09:00-10:00"}
                            {period === 2 && "10:00-11:00"}
                            {period === 3 && "11:30-12:30"}
                            {period === 4 && "12:30-13:30"}
                            {period === 5 && "14:30-15:30"}
                            {period === 6 && "15:30-16:30"}
                          </div>
                        </div>

                        {/* Day Cells */}
                        {days.map((day) => {
                          const entry = periodEntries[day];
                          
                          if (entry) {
                            return (
                              <motion.div
                                key={`${day}-${period}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={`p-2 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${getSubjectColor(entry.subject_type)}`}
                              >
                                <div className="text-sm font-semibold truncate">
                                  {entry.subject}
                                </div>
                                <div className="text-xs opacity-75 truncate">
                                  {entry.subject_code}
                                </div>
                                <div className="flex items-center mt-1 text-xs opacity-75">
                                  <User className="w-3 h-3 mr-1" />
                                  <span className="truncate">{entry.teacher}</span>
                                </div>
                                {entry.room && entry.room !== "TBA" && (
                                  <div className="flex items-center mt-1 text-xs opacity-75">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    <span className="truncate">{entry.room}</span>
                                  </div>
                                )}
                              </motion.div>
                            );
                          }

                          return (
                            <div
                              key={`${day}-${period}`}
                              className="p-3 border border-gray-200 rounded-lg bg-gray-50 text-center text-gray-400 text-sm"
                            >
                              Free
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Schedule Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3">Schedule Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-600">Total Periods</div>
                    <div className="text-lg font-bold">
                      {classData.schedule?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600">Unique Subjects</div>
                    <div className="text-lg font-bold">
                      {new Set(classData.schedule?.map((s: ScheduleEntry) => s.subject) || []).size}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600">Teachers</div>
                    <div className="text-lg font-bold">
                      {new Set(classData.schedule?.map((s: ScheduleEntry) => s.teacher) || []).size}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600">Subject Types</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.from(new Set(classData.schedule?.map((s: ScheduleEntry) => s.subject_type) || [])).map((type) => (
                        <Badge
                          key={type as string}
                          variant="secondary"
                          className={`text-xs ${getSubjectColor(type as string)}`}
                        >
                          {type as string}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default TimetablePreview;