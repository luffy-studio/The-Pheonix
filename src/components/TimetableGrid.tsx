import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Clock, User, BookOpen } from 'lucide-react';

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
  timeSlot: string;
}

interface TimetableGridProps {
  subjects: Subject[];
  onCellClick?: (day: string, period: number) => void;
  timetableData?: { [key: string]: TimetableEntry };
  onUpdateTimetable?: (key: string, entry: TimetableEntry | null) => void;
}

const TimetableGrid: React.FC<TimetableGridProps> = ({
  subjects,
  onCellClick,
  timetableData = {},
  onUpdateTimetable,
}) => {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];
  const timeSlots = [
    '9:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '12:00 - 1:00',
    '2:00 - 3:00',
    '3:00 - 4:00',
    '4:00 - 5:00',
    '5:00 - 6:00',
  ];

  const getCellKey = (day: string, period: number) => `${day}-${period}`;

  const handleCellClick = (day: string, period: number) => {
    const key = getCellKey(day, period);
    setSelectedCell(selectedCell === key ? null : key);
    onCellClick?.(day, period);
  };

  const handleSubjectSelect = (subject: Subject, day: string, period: number) => {
    const key = getCellKey(day, period);
    const entry: TimetableEntry = {
      subject,
      timeSlot: timeSlots[period - 1],
    };
    onUpdateTimetable?.(key, entry);
    setSelectedCell(null);
  };

  const handleCellClear = (day: string, period: number) => {
    const key = getCellKey(day, period);
    onUpdateTimetable?.(key, null);
    setSelectedCell(null);
  };

  const cellVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2 }
    },
  };

  const subjectCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
  };

  return (
    <div className="w-full">
      {/* Desktop Grid */}
      <div className="hidden lg:block">
        <div className="glass-card p-6 rounded-3xl">
          <div className="grid grid-cols-6 gap-4">
            {/* Header */}
            <div className="glass rounded-2xl p-4 text-center font-semibold text-gray-700">
              Time / Day
            </div>
            {days.map((day) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: days.indexOf(day) * 0.1 }}
                className="glass rounded-2xl p-4 text-center font-semibold text-gray-700"
              >
                {day}
              </motion.div>
            ))}

            {/* Time slots and cells */}
            {periods.slice(0, 6).map((period) => (
              <React.Fragment key={period}>
                {/* Time slot */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: period * 0.1 }}
                  className="glass rounded-2xl p-4 flex flex-col items-center justify-center text-sm font-medium text-gray-600"
                >
                  <Clock className="w-4 h-4 mb-1" />
                  <span>Period {period}</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {timeSlots[period - 1]}
                  </span>
                </motion.div>

                {/* Day cells */}
                {days.map((day) => {
                  const key = getCellKey(day, period);
                  const entry = timetableData[key];
                  const isSelected = selectedCell === key;
                  const isHovered = hoveredCell === key;

                  return (
                    <motion.div
                      key={key}
                      variants={cellVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      className={`timetable-cell relative ${entry ? 'filled' : ''}`}
                      onMouseEnter={() => setHoveredCell(key)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => handleCellClick(day, period)}
                    >
                      {entry ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="h-full flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between">
                            <div className={`w-3 h-3 rounded-full ${entry.subject.color}`} />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellClear(day, period);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full"
                            >
                              <X className="w-3 h-3 text-red-500" />
                            </motion.button>
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-sm text-gray-800 leading-tight">
                              {entry.subject.name}
                            </p>
                            <p className="text-xs text-gray-600 flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {entry.subject.teacher}
                            </p>
                            <p className="text-xs text-gray-500">
                              {entry.timeSlot}
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          className="h-full flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Plus className="w-6 h-6 text-gray-400" />
                        </motion.div>
                      )}

                      {/* Subject Selection Popup */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-2 z-50"
                          >
                            <div className="glass-card p-4 rounded-2xl shadow-large">
                              <h4 className="font-semibold text-sm text-gray-800 mb-3 flex items-center">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Select Subject
                              </h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {subjects.map((subject) => (
                                  <motion.button
                                    key={subject.id}
                                    variants={subjectCardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSubjectSelect(subject, day, period)}
                                    className="w-full p-3 rounded-xl glass hover:bg-white/20 transition-all duration-200 text-left"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-800 truncate">
                                          {subject.name}
                                        </p>
                                        <p className="text-xs text-gray-600 truncate">
                                          {subject.teacher}
                                        </p>
                                      </div>
                                    </div>
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden space-y-6">
        {days.map((day) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: days.indexOf(day) * 0.1 }}
            className="glass-card p-4 rounded-3xl"
          >
            <h3 className="font-bold text-lg text-gray-800 mb-4 text-center">
              {day}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {periods.slice(0, 6).map((period) => {
                const key = getCellKey(day, period);
                const entry = timetableData[key];

                return (
                  <motion.div
                    key={key}
                    variants={cellVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    className={`timetable-cell ${entry ? 'filled' : ''}`}
                    onClick={() => handleCellClick(day, period)}
                  >
                    <div className="text-xs text-gray-500 mb-2">
                      Period {period} • {timeSlots[period - 1]}
                    </div>
                    {entry ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${entry.subject.color}`} />
                          <p className="font-semibold text-sm text-gray-800">
                            {entry.subject.name}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600">
                          {entry.subject.teacher}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-12">
                        <Plus className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TimetableGrid;