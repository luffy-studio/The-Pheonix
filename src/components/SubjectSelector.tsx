import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, BookOpen, User, Palette, ChevronDown, ChevronRight } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  teacher: string;
  department: string;
}

interface SubjectSelectorProps {
  subjects: Subject[];
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onRemoveSubject: (id: string) => void;
  onUpdateSubject: (id: string, subject: Partial<Subject>) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  subjects,
  onAddSubject,
  onRemoveSubject,
  onUpdateSubject,
  isOpen,
  onToggle,
}) => {
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    color: 'bg-blue-500',
    teacher: '',
    department: '',
  });
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>(['All']);

  const colorOptions = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];

  const departments = ['All', ...Array.from(new Set(subjects.map(s => s.department).filter(Boolean)))];

  const handleAddSubject = () => {
    if (newSubject.name && newSubject.teacher) {
      onAddSubject(newSubject);
      setNewSubject({
        name: '',
        code: '',
        color: 'bg-blue-500',
        teacher: '',
        department: '',
      });
      setIsAddingSubject(false);
    }
  };

  const toggleDepartment = (department: string) => {
    setExpandedDepartments(prev =>
      prev.includes(department)
        ? prev.filter(d => d !== department)
        : [...prev, department]
    );
  };

  const getFilteredSubjects = () => {
    if (expandedDepartments.includes('All')) {
      return subjects;
    }
    return subjects.filter(subject => 
      expandedDepartments.includes(subject.department) || !subject.department
    );
  };

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: '100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
  };

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
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        className="fixed right-0 top-0 h-full w-80 glass-nav z-50 lg:relative lg:w-96 lg:translate-x-0"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Subjects~
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
                      ? 'glass-card text-gray-800'
                      : 'glass hover:bg-white/10 text-gray-600'
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

            {/* Subjects List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                Available Subjects ({getFilteredSubjects().length})
              </h3>
              <div className="space-y-2">
                {getFilteredSubjects().map((subject, index) => (
                  <motion.div
                    key={subject.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                    className="interactive-card p-4 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-4 h-4 rounded-full ${subject.color} mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                            {subject.name}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {subject.code}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <User className="w-3 h-3 mr-1" />
                            {subject.teacher}
                          </div>
                          {subject.department && (
                            <div className="mt-1">
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {subject.department}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onRemoveSubject(subject.id)}
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
                <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Subject</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      className="w-full p-3 rounded-xl glass border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g., Mathematics"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                      className="w-full p-3 rounded-xl glass border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g., MATH101"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teacher
                    </label>
                    <input
                      type="text"
                      value={newSubject.teacher}
                      onChange={(e) => setNewSubject({ ...newSubject, teacher: e.target.value })}
                      className="w-full p-3 rounded-xl glass border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g., Dr. Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={newSubject.department}
                      onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}
                      className="w-full p-3 rounded-xl glass border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g., Science"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Palette className="w-4 h-4 mr-1" />
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <motion.button
                          key={color}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setNewSubject({ ...newSubject, color })}
                          className={`w-8 h-8 rounded-full ${color} ${
                            newSubject.color === color ? 'ring-2 ring-gray-400 ring-offset-2' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsAddingSubject(false)}
                    className="flex-1 glass-card py-3 px-4 rounded-xl font-medium text-gray-700 hover:bg-white/20 transition-colors"
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