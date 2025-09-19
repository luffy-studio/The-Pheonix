import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, BookOpen, Download, Share2 } from 'lucide-react';

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

interface PreviewCardProps {
  title: string;
  timetableData: { [key: string]: TimetableEntry };
  className?: string;
  onExport?: () => void;
  onShare?: () => void;
}

const PreviewCard: React.FC<PreviewCardProps> = ({
  title,
  timetableData,
  className = '',
  onExport,
  onShare,
}) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6];

  const getCellKey = (day: string, period: number) => `${day}-${period}`;

  const getTotalSubjects = () => {
    const subjects = new Set();
    Object.values(timetableData).forEach(entry => {
      subjects.add(entry.subject.id);
    });
    return subjects.size;
  };

  const getTotalClasses = () => {
    return Object.keys(timetableData).length;
  };

  // Extract unique teachers for responsive display
  const teachers = Array.from(new Set(Object.values(timetableData).map(e => e.subject.teacher)));

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
  };

  const cellVariants = {
    // hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
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
                {getTotalSubjects()} subjects • {getTotalClasses()} classes scheduled
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
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
            <p className="text-sm text-gray-600">Classes</p>
          </div>
          <div className="text-center">
            <div className="p-3 gradient-quaternary rounded-2xl w-fit mx-auto mb-2">
              <User className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{teachers.length}</p>
            <p className="text-sm text-gray-600">Teachers</p>
            {/* Responsive teacher chips (show up to 3, wrap on small) */}
            <div
              className="mt-2 flex items-center justify-center flex-wrap gap-2 max-w-[180px] mx-auto"
              title={teachers.join(', ')}
            >
              {teachers.slice(0, 3).map((t, i) => (
                <span
                  key={t + i}
                  className="px-2 py-1 text-xs bg-white/60 backdrop-blur-sm rounded-full text-gray-700"
                >
                  {t.split(' ').map(s => s[0]).join('').slice(0,3)}
                </span>
              ))}
              {teachers.length > 3 && (
                <span className="px-2 py-1 text-xs bg-white/60 backdrop-blur-sm rounded-full text-gray-700">+{teachers.length - 3}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mini Timetable Grid */}
  <div className="p-4 md:p-6">
        <h4 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">
          Weekly Overview
        </h4>
        
        {/* Desktop Grid */}
        <div className="hidden md:block overflow-auto">
          <div className="min-w-[720px] grid grid-cols-6 gap-2 text-xs">
            {/* Header */}
                <div className="p-2 glass rounded-lg text-center font-medium text-gray-600">
              Time
            </div>
            {days.map((day) => (
              <div key={day} className="p-2 glass rounded-lg text-center font-medium text-gray-600">
                {day.slice(0, 3)}
              </div>
            ))}

            {/* Periods */}
              {periods.map((period) => (
              <React.Fragment key={period}>
                <div className="p-2 glass rounded-lg text-center font-medium text-gray-600">
                  P{period}
                </div>
                {days.map((day) => {
                  const key = getCellKey(day, period);
                  const entry = timetableData[key];

                  return (
                    <motion.div
                      key={key}
                      variants={cellVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: (period - 1) * 0.1 + days.indexOf(day) * 0.02 }}
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
                  const entry = timetableData[key];

                  return (
                    <motion.div
                      key={key}
                      variants={cellVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: days.indexOf(day) * 0.1 + (period - 1) * 0.02 }}
                      className={`px-2 py-1 rounded-lg text-xs ${
                        entry ? 'glass-card' : 'glass'
                      }`}
                    >
                      {entry ? (
                        <div className="flex items-center space-x-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${entry.subject.color}`} />
                          <span className="font-medium text-gray-800">
                            {entry.subject.code || entry.subject.name.slice(0, 6)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">P{period}</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Legend */}
  <div className="p-4 md:p-6 border-t border-white/10">
        <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
          Subject Legend
        </h4>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(Object.values(timetableData).map(entry => entry.subject.id)))
            .map(subjectId => {
              const entry = Object.values(timetableData).find(e => e.subject.id === subjectId);
              if (!entry) return null;
              
              return (
                <motion.div
                  key={subjectId}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-2 glass px-3 py-2 rounded-full text-sm"
                >
                  <div className={`w-3 h-3 rounded-full ${entry.subject.color}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {entry.subject.name}
                  </span>
                </motion.div>
              );
            })}
        </div>
      </div>
    </motion.div>
  );
};

export default PreviewCard;