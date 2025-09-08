import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { Calendar, Home, Plus, Eye, ArrowLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import LoginSignupForm from "@/components/loginPage";
import { useAuth } from "@/lib/context/AuthContext";

const AppleNavbar = () => {
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Random avatar generator on login
  useEffect(() => {
    if (isLoggedIn) {
      const randomId = Math.floor(Math.random() * 1000);
      setAvatarUrl(
        `https://api.dicebear.com/7.x/identicon/svg?seed=${randomId}`
      );
    }
  }, [isLoggedIn]);

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
  };

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Create", href: "/create", icon: Plus },
    { name: "View", href: "/view", icon: Eye },
  ];

  const handleSignIn = () => {
    setShowLoginPage(true);
    setIsMobileMenuOpen(false);
    router.push("/login");
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
  };

  if (showLoginPage) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-200 to-indigo-200">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => setShowLoginPage(false)}
          className="fixed top-6 left-6 z-50 flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xxxl shadow-lg hover:bg-white/90"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
          <span className="text-gray-700 font-medium">Back to Home</span>
        </motion.button>
        <LoginSignupForm />
      </div>
    );
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <motion.div
          className={cn(
            "mx-auto max-w-5xl top-2 px-4 sm:px-6 lg:px-8 py-4",
            "relative transition-all duration-500",
            "bg-white/45 backdrop-blur-xl rounded-2xl border border-white shadow-lg"
          )}
        >
          <div className="relative flex items-center justify-between w-full">
            {/* Logo / Brand */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => handleNavClick("/")}
            >
              <Calendar className="w-8 h-8 text-indigo-600" />
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                FlexiSched
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3">
              {navItems.map((item) => (
                <motion.button
                  key={item.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    "relative px-4 py-2 rounded-lg",
                    "text-sm font-medium flex items-center space-x-2 transition-all",
                    router.pathname === item.href
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                      : "text-gray-800 hover:bg-white/30"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </motion.button>
              ))}

              <div className="h-4 w-px bg-gray-200"></div>

              {/* ✅ Avatar or Sign In */}
              {isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  <motion.img
                    src={avatarUrl}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full border border-gray-300 shadow-md cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={logout}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500 text-white shadow-md hover:bg-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignIn}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                >
                  Sign In
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.nav>
      <div className="h-24"></div>
    </>
  );
};

export default AppleNavbar;
