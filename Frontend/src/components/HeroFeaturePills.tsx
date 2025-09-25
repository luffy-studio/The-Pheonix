import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Sparkles } from 'lucide-react'

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const FeaturePills: React.FC = () => {
  return (
    <div>
       {/* Feature Pills */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap justify-center gap-6 pt-8"
      >
        {[
          { icon: Calendar, text: "Smart Scheduling" },
          { icon: Clock, text: "Real-time Updates" },
          { icon: Sparkles, text: "Beautiful Design" },
        ].map((feature) => (
          <motion.div
            key={feature.text}
            whileHover={{ scale: 1.05, y: -2 }}
            className="glass-card px-5 py-3 rounded-full flex items-center space-x-2 shadow-sm hover:shadow-md transition"
          >
            <feature.icon className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              {feature.text}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default FeaturePills