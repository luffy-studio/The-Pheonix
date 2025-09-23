import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, BookOpen, Download, Share2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  // optional class name if available in source
  class_name?: string;
  // optional room if available
  room?: string;
}

interface PreviewCardProps {
  title: string;
  timetableData: { [key: string]: TimetableEntry };
  className?: string;
  onExport?: () => void;
  onShare?: () => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const periods = [1, 2, 3, 4, 5, 6];

const getShort = (s: string) =>
  s
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 3);

const PreviewCard: React.FC<PreviewCardProps> = ({
  title,
  timetableData,
  className = '',
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

  // build teacher -> map(day-period -> entry)
  const teacherMap = useMemo(() => {
    const map: Record<string, Record<string, TimetableEntry>> = {};
    Object.entries(timetableData).forEach(([key, entry]) => {
      const teacher = entry?.subject?.teacher || 'TBA';
      if (!map[teacher]) map[teacher] = {};
      map[teacher][key] = entry;
    });
    return map;
  }, [timetableData]);

  // default selected teacher
  React.useEffect(() => {
    if (!selectedTeacher && teachers.length > 0) setSelectedTeacher(teachers[0]);
  }, [teachers, selectedTeacher]);

  const getTotalSubjects = () => {
    const subjects = new Set<string>();
    Object.values(timetableData).forEach((entry) => {
      subjects.add(entry.subject.id);
    });
    return subjects.size;
  };

  const getTotalClasses = () => {
    return Object.keys(timetableData).length;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const cellVariants = {
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  // Render generic grid cell for overview (keeps previous behavior)
  const renderOverviewCell = (key: string) => {
    const entry = timetableData[key];
    return (
      <motion.div
        key={key}
        variants={cellVariants}
        initial="hidden"
        animate="visible"
        transition={{}}
        className={`p-2 rounded-lg min-h-[40px] flex items-center justify-center ${
          entry ? 'glass-card' : 'glass'
        }`}
      >
        {entry ? (
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${entry.subject.color}`} />
            <span className="font-medium text-gray-800 truncate">
              {entry.subject.code || entry.subject.name.slice(0, 4)}
            </span>
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        )}
      </motion.div>
    );
  };

  // Render teacher-specific cell: show class name, subject, room
  const renderTeacherCell = (key: string, teacherKey: string | null) => {
    if (!teacherKey) {
      return (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 text-center text-gray-400 text-sm">
          Free
        </div>
      );
    }
    const entry = teacherMap[teacherKey]?.[key];
    if (!entry) {
      return (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 text-center text-gray-400 text-sm">
          Free
        </div>
      );
    }

    return (
      <motion.div
        key={key}
        variants={cellVariants}
        initial="hidden"
        animate="visible"
        className="p-2 rounded-lg min-h-[40px] flex flex-col items-start justify-center bg-white/70 border"
      >
        <div className="text-sm font-semibold truncate">{entry.class_name ?? entry.subject.name}</div>
        <div className="text-xs opacity-80 truncate">
          {entry.subject.name}
          {entry.subject.code ? ` • ${entry.subject.code}` : ''}
        </div>
        {entry.room && (
          <div className="text-xs opacity-70 mt-1 flex items-center">
            <span className="truncate text-xs">{entry.room}</span>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`glass-card rounded-3xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 gradient-primary rounded-xl">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{title}</h3>
              <p className="text-sm text-gray-600">
                {getTotalSubjects()} subjects • {getTotalClasses()} scheduled • {teachers.length} teachers
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 mr-2">
              <button
                onClick={() => setTeacherView(false)}
                className={`px-3 py-1 rounded-md text-sm ${!teacherView ? 'bg-blue-600 text-white' : 'bg-white/60'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setTeacherView(true)}
                className={`px-3 py-1 rounded-md text-sm ${teacherView ? 'bg-blue-600 text-white' : 'bg-white/60'}`}
              >
                By Teacher
              </button>
            </div>

            {onShare && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onShare}
                className="p-2 glass rounded-xl hover:bg-white/20 transition-colors"
              >
                <Share2 className="w-4 h-4 text-gray-600" />
              </motion.button>
            )}
            {onExport && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onExport}
                className="p-2 glass rounded-xl hover:bg-white/20 transition-colors"
              >
                <Download className="w-4 h-4 text-gray-600" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 md:p-6 border-b border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="p-3 gradient-tertiary rounded-2xl w-fit mx-auto mb-2">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{getTotalSubjects()}</p>
            <p className="text-sm text-gray-600">Subjects</p>
          </div>
          <div className="text-center">
            <div className="p-3 gradient-secondary rounded-2xl w-fit mx-auto mb-2">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{getTotalClasses()}</p>
            <p className="text-sm text-gray-600">Entries</p>
          </div>
          <div className="text-center">
            <div className="p-3 gradient-quaternary rounded-2xl w-fit mx-auto mb-2">
              <User className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{teachers.length}</p>
            <p className="text-sm text-gray-600">Teachers</p>

            <div
              className="mt-2 flex items-center justify-center flex-wrap gap-2 max-w-[220px] mx-auto"
              title={teachers.join(', ')}
            >
              {teachers.slice(0, 4).map((t, i) => (
                <button
                  key={t + i}
                  onClick={() => {
                    setTeacherView(true);
                    setSelectedTeacher(t);
                  }}
                  className="px-2 py-1 text-xs bg-white/60 backdrop-blur-sm rounded-full text-gray-700"
                >
                  {getShort(t)}
                </button>
              ))}
              {teachers.length > 4 && (
                <span className="px-2 py-1 text-xs bg-white/60 backdrop-blur-sm rounded-full text-gray-700">
                  +{teachers.length - 4}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timetable Area */}
      <div className="p-4 md:p-6">
        <h4 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Weekly Overview</h4>

        {/* Teacher selector when in teacher view */}
        {teacherView && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-600">Select Teacher Schedule</label>
              <span className="text-xs text-gray-500">{teachers.length} teachers available</span>
            </div>
            
            <Select
              value={selectedTeacher || ''}
              onValueChange={(value) => setSelectedTeacher(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a teacher to view their schedule" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher} value={teacher}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{teacher}</span>
                      <span className="text-xs text-gray-500">
                        ({Object.keys(teacherMap[teacher] || {}).length} periods)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {teachers.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTeacher(t)}
                  className={`
                    px-3 py-1.5 rounded-full text-sm transition-all
                    ${selectedTeacher === t 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-white/60 hover:bg-white/80'
                    }
                  `}
                >
                  {t}
                  <span className="text-xs ml-1 opacity-70">
                    ({Object.keys(teacherMap[t] || {}).length})
                  </span>
                </button>
              ))}
            </div>

            {selectedTeacher && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Currently Viewing</h3>
                    <p className="text-sm text-gray-600">{selectedTeacher}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {Object.keys(teacherMap[selectedTeacher] || {}).length} periods
                    </div>
                    <div className="text-xs text-gray-500">
                      {Array.from(new Set(Object.values(teacherMap[selectedTeacher] || {})
                        .map(e => e.class_name))).length} classes
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desktop Grid */}
        <div className="hidden md:block overflow-auto">
          <div className="min-w-[720px] grid grid-cols-6 gap-2 text-xs">
            <div className="p-2 glass rounded-lg text-center font-medium text-gray-600">Time</div>
            {days.map((day) => (
              <div key={day} className="p-2 glass rounded-lg text-center font-medium text-gray-600">
                {day.slice(0, 3)}
              </div>
            ))}

            {periods.map((period) => (
              <React.Fragment key={period}>
                <div className="p-2 glass rounded-lg text-center font-medium text-gray-600">P{period}</div>
                {days.map((day) => {
                  const key = getCellKey(day, period);
                  return teacherView ? renderTeacherCell(key, selectedTeacher) : renderOverviewCell(key);
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Mobile List */}
        <div className="md:hidden space-y-2">
          {days.map((day) => (
            <div key={day} className="glass rounded-2xl p-2">
              <h5 className="font-semibold text-gray-700 mb-2 text-sm">{day}</h5>
              <div className="flex flex-wrap gap-1">
                {periods.map((period) => {
                  const key = getCellKey(day, period);
                  return (
                    <div key={key} className="w-full sm:w-auto">
                      {teacherView ? renderTeacherCell(key, selectedTeacher) : renderOverviewCell(key)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Legend */}
      <div className="p-4 md:p-6 border-t border-white/10">
        <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Subject Legend</h4>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(Object.values(timetableData).map((entry) => entry.subject.id))).map((subjectId) => {
            const entry = Object.values(timetableData).find((e) => e.subject.id === subjectId);
            if (!entry) return null;

            return (
              <motion.div
                key={subjectId}
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 glass px-3 py-2 rounded-full text-sm"
              >
                <div className={`w-3 h-3 rounded-full ${entry.subject.color}`} />
                <span className="text-sm font-medium text-gray-700">{entry.subject.name}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default PreviewCard;