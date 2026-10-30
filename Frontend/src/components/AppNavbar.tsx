import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Calendar,
  Layers,
  Zap,
  Eye,
  BarChart3,
  Flame,
  Menu,
  X,
  LogOut,
  LogIn,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/AuthContext";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Setup Data", href: "/create" },
  { name: "Generate", href: "/generate" },
  { name: "Timetables", href: "/view" },
  { name: "Analytics", href: "/analytics" },
];

const AppNavbar: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logout = () => {
    setIsLoggedIn(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userId");
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0E0F12]/95 backdrop-blur-md border-b border-[#23252E]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => handleNavClick("/")}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            The Phoenix
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  isActive
                    ? "text-zinc-100 bg-[#1C1E26]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#15171E]"
                )}
              >
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center space-x-2">
          {isLoggedIn ? (
            <button
              onClick={logout}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-md hover:bg-[#1C1E26] transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          ) : (
            <button
              onClick={() => handleNavClick("/login")}
              className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-md transition-colors"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-[#1C1E26]"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#23252E] bg-[#0E0F12] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors",
                  isActive
                    ? "text-zinc-100 bg-[#1C1E26]"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {item.name}
              </button>
            );
          })}
          <div className="pt-2 border-t border-[#23252E]">
            {isLoggedIn ? (
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-[#1C1E26] rounded-md transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavClick("/login")}
                className="w-full text-center px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-md"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default AppNavbar;
