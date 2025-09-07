import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { Calendar, Menu, X, Home, Plus, Eye, Sparkles, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import LoginSignupForm from './loginPage';

const AppleNavbar = () => {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginPage, setShowLoginPage] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock scroll when login page is shown
  useEffect(() => {
    if (showLoginPage) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Lock the scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll when component unmounts or login page is closed
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showLoginPage]);

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Create', href: '/create', icon: Plus },
    { name: 'View', href: '/view', icon: Eye },
    // { name: 'sign up ', href: '/sign up ', icon: Eye },
  ];

  const handleSignIn = () => {
    setShowLoginPage(true);
    setIsMobileMenuOpen(false);
  };

  const handleCloseLogin = () => {
    setShowLoginPage(false);
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
  };

  // If login page is shown, render it as full page
  if (showLoginPage) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-200 to-indigo-200">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={handleCloseLogin}
          className="fixed top-6 left-6 z-50 flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white/90 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
          <span className="text-gray-700 font-medium">Back to Home</span>
        </motion.button>
        
        {/* Login Page */}
        <LoginSignupForm />
      </div>
    );
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50">
        {/* Main Bubble Container */}
        <motion.div
          className={cn(
            "mx-auto max-w-5xl top-2 px-4 sm:px-6 lg:px-8 py-4",
            "relative transition-all duration-500",
            "bg-white/45 backdrop-blur-xl",
            "rounded-2xl border border-white",
            "shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
          )}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-60"></div>
          
          <div className="relative flex items-center justify-between w-full">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => handleNavClick('/')}
            >
              <div className="relative">
                <motion.div 
                  className={cn(
                    "w-10 h-10 rounded-xl",
                    "bg-gradient-to-r from-blue-500 to-purple-500",
                    "flex items-center justify-center shadow-md"
                  )}
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Calendar className="w-5 h-5 text-white" />
                </motion.div>
                <motion.div 
                  className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-md"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                ></motion.div>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-purple-800 bg-clip-text text-transparent">
                  EduSchedule
                </span>
                <div className="flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-gray-600 font-medium">Pro</span>
                </div>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.name}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    "relative px-4 py-2 rounded-lg",
                    "text-sm font-medium transition-all duration-300",
                    "flex items-center space-x-2",
                    router.pathname === item.href
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                      : "text-gray-800 hover:bg-white/30 hover:shadow-sm backdrop-blur-md"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {router.pathname !== item.href && (
                    <div className="absolute inset-3px rounded-lg bg-white/0 hover:bg-white/60 transition-all duration-300"/>
                  )}
                </motion.button>
              ))}
              <div className="h-4 w-px bg-gray-200"></div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignIn}
                className={cn(
                  "px-4 py-2 rounded-lg",
                  "text-sm font-medium",
                  "bg-gradient-to-r from-blue-500 to-purple-500",
                  "text-white shadow-md",
                  "transition-all duration-300",
                  "flex items-center space-x-2"
                )}
              >
                <span>Sign In</span>
              </motion.button>
            </div>

            {/* Mobile Buttons */}
            <div className="md:hidden flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignIn}
                className={cn(
                  "px-3 py-2 rounded-xl",
                  "text-sm font-medium",
                  "bg-gradient-to-r from-blue-500 to-purple-500",
                  "text-white shadow-md",
                  "transition-all duration-300"
                )}
              >
                <span>Sign In</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-3 rounded-xl bg-white/20 hover:bg-white/30 text-gray-800 transition-all duration-300 shadow-sm backdrop-blur-md"
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </motion.div>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-full left-4 right-4 mt-2"
            >
              <div className={cn(
                "bg-white/25 backdrop-blur-xl rounded-xl",
                "shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
                "border border-white/30 p-2",
                "overflow-hidden"
              )}>
                <div className="space-y-1">
                  {navItems.map((item, index) => (
                    <motion.button
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNavClick(item.href)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-4 py-2",
                        "rounded-lg text-left transition-all duration-300",
                        router.pathname === item.href
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-white/60"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-24"></div>
    </>
  );
};

export default AppleNavbar;