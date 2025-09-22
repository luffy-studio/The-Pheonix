import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { Calendar, Home, Plus, Eye, ArrowLeft, BarChart3, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import LoginSignupForm from "@/components/loginPage";
import { useAuth } from "@/lib/context/AuthContext";
import { Button } from "./ui/button";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Create", href: "/create", icon: Plus },
  { name: "Generate", href: "/generate", icon: Zap },
  // { name: "View", href: "/view", icon: Eye },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const AppleNavbar = () => {
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // removed overlay login state — navigate to dedicated `/login` page instead
  const [avatarUrl, setAvatarUrl] = useState("");

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Random avatar on login
  useEffect(() => {
    if (isLoggedIn) {
      const randomId = Math.floor(Math.random() * 1000);
      setAvatarUrl(`https://api.dicebear.com/7.x/identicon/svg?seed=${randomId}`);
    }
  }, [isLoggedIn]);

  const logout = () => {
    // Clear auth flags and user id from storage
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userId");
    // Reset local UI state
    setAvatarUrl("");
    setIsMobileMenuOpen(false);
    // Force a reload so the app resets to unauthenticated state
    if (typeof window !== "undefined") {
      router.reload();
    }
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
  };

  const handleSignIn = () => {
    setIsMobileMenuOpen(false);
    router.push("/login");
  };

  const handleMobileMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // No inline overlay — use `/login` page for sign-in UI

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
            "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4",
            "relative transition-all duration-500",
            "bg-white/45 backdrop-blur-xl rounded-2xl border border-white shadow-lg"
          )}
        >
          <div className="flex items-center justify-between w-full">
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

            {/* Desktop Nav & Avatar */}
              <div className="hidden md:flex items-center space-x-3">
                {navItems.map((item) => (
                  <motion.button
                    key={item.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavClick(item.href)}
                    className={cn(
                      "relative px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all",
                      router.pathname === item.href
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                        : "text-gray-800 hover:bg-white/30"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </motion.button>
                ))}

                <div className="h-4 w-px bg-gray-200" />

                {isLoggedIn ? (
                  <>
                    {avatarUrl ? (
                      <motion.img
                        src={avatarUrl}
                        alt="User Avatar"
                        className="w-10 h-10 rounded-full border border-gray-300 shadow-md cursor-pointer"
                        whileHover={{ scale: 1.1 }}
                      />
                    ) : null}
                    <Button variant="destructive" onClick={logout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button variant="default" onClick={handleSignIn}>
                    Sign In
                  </Button>
                )}
              </div>

            {/* Easy Access / Mobile Menu */}
            <div className="flex md:hidden items-center space-x-3">
              {!isLoggedIn && (
                <Button variant="default" onClick={handleSignIn}>
                  Sign In
                </Button>
              )}
              {isLoggedIn && (
                <Button variant="destructive" onClick={logout}>
                  Logout
                </Button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleMobileMenuToggle}
                className="p-2 rounded-lg bg-white/30 text-gray-800 shadow-md"
              >
                {isMobileMenuOpen ? "Close" : "Menu"}
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-full left-0 right-0 bg-white shadow-md rounded-lg p-4 md:hidden"
            >
              {/* Mobile menu actions */}
              <div className="mb-2">
                {!isLoggedIn ? (
                  <Button variant="default" onClick={handleSignIn} className="w-full">
                    Sign In
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={logout} className="w-full">
                    Logout
                  </Button>
                )}
              </div>
              {navItems.map((item) => (
                <motion.button
                  key={item.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavClick(item.href)}
                  className="block w-full text-left px-4 py-2 rounded-lg text-gray-800 hover:bg-gray-100"
                >
                  <item.icon className="w-4 h-4 inline-block mr-2" />
                  {item.name}
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.nav>

      {/* Spacer to prevent content overlap */}
      <div className="h-24" />
    </>
  );
};

export default AppleNavbar;
