import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { ArrowRight, Sparkles, Calendar, Clock } from "lucide-react";

const AppleHero = () => {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 5, 0, -5, 0],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />

      {/* Animated Blobs */}
      <div className="absolute inset-0">
        <motion.div
          variants={floatingVariants}
          animate="animate"
          className="absolute top-20 left-10 w-20 h-20 rounded-full gradient-tertiary opacity-20 blur-xl"
        />
        <motion.div
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: "2s" }}
          className="absolute top-40 right-20 w-32 h-32 rounded-full gradient-secondary opacity-15 blur-2xl"
        />
        <motion.div
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: "4s" }}
          className="absolute bottom-20 left-1/4 w-24 h-24 rounded-full gradient-quaternary opacity-25 blur-xl"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="glass-card px-4 py-2 rounded-full">
              <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>Introducing Smart Scheduling</span>
              </div>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Beautiful
              </span>{" "}
              School Timetables
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Create stunning school schedules with our intuitive platform.
              Designed for educators who value both functionality and aesthetics.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/create")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center space-x-2 min-w-[200px] shadow-md focus:ring-2 focus:ring-blue-400"
            >
              <span>Create Timetable</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/view")}
              className="glass-card px-8 py-4 rounded-xl text-gray-700 font-semibold text-lg hover:text-gray-900 transition-colors min-w-[200px]"
            >
              View Demo
            </motion.button>
          </motion.div>

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
        </motion.div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

export default AppleHero;
