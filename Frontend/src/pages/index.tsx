import React from "react";
import Head from "next/head";
import AppleNavbar from "@/components/AppleNavbar";
import AppleHero from "@/components/AppleHero";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, BookOpen, Sparkles, Zap, Shield } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "AI-powered conflict detection and resolution for seamless timetable creation",
      gradient: "gradient-primary"
    },
    {
      icon: Users,
      title: "Teacher Management",
      description: "Intuitive teacher assignment with workload balancing and availability tracking",
      gradient: "gradient-secondary"
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Instant synchronization across all devices with live collaboration features",
      gradient: "gradient-tertiary"
    },
    {
      icon: BookOpen,
      title: "Subject Organization",
      description: "Advanced categorization with department-wise filtering and smart grouping",
      gradient: "gradient-quaternary"
    },
    {
      icon: Sparkles,
      title: "Beautiful Design",
      description: "Apple-inspired interface with glassmorphism and smooth micro-interactions",
      gradient: "gradient-primary"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance with instant loading and responsive interactions",
      gradient: "gradient-secondary"
    }
  ];

  return (
    <>
      <Head>
        <title>EduSchedule - Beautiful Timetable Management</title>
        <meta name="description" content="Create stunning school timetables with our Apple-inspired platform featuring glassmorphism design and intelligent scheduling" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen gradient-mesh-bg">
        <AppleNavbar />
        <AppleHero />

        {/* Features Section */}
        <section className="py-32 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 gradient-tertiary opacity-10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 gradient-secondary opacity-10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center space-x-2 glass-card px-4 py-2 rounded-full mb-6">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Premium Features</span>
              </div>
              <h2 className="text-large mb-6">
                Everything you need for
                <span className="block text-display">Perfect Scheduling</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Our comprehensive platform combines powerful functionality with stunning design, 
                making timetable management a delightful experience.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div 
                  key={index} 
                  variants={fadeInUp}
                  className="interactive-card p-8 group"
                >
                  <div className={`w-12 h-12 ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Showcase Section */}
        <section className="py-32 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 gradient-quaternary opacity-20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 gradient-primary opacity-15 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-large mb-6">
                See it in
                <span className="block text-display">Action</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Experience the power of intelligent scheduling with our interactive demo
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass-card p-8 rounded-3xl">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Interactive Demo</h3>
                    <p className="text-gray-600 mb-6">Click to explore our timetable builder</p>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-block"
                    >
                      <div className="interactive-button px-8 py-3 text-white font-semibold rounded-2xl cursor-pointer">
                        Launch Demo
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20 glass-nav border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-10 h-10 gradient-primary rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  EduSchedule
                </span>
              </div>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Making school scheduling beautiful, intelligent, and effortless. 
                Built with love for educators worldwide.
              </p>
              <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
                <span>© 2024 EduSchedule</span>
                <span>•</span>
                <span>Privacy Policy</span>
                <span>•</span>
                <span>Terms of Service</span>
                <span>•</span>
                <span>Support</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
