import React, { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/router";
import {
  User,
  Lock,
  Mail,
  ArrowLeft,
  Eye,
  EyeOff,
  Flame,
} from "lucide-react";
import { handleRegister } from "@/handlers/handleRegister";
import { handleLogin } from "@/handlers/handleLogin";

const LoginSignupForm: React.FC = () => {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false); // false = login, true = register
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setIsLoggedIn } = useAuth();
  const forgotPassword = () => router.push("/forgot-password");
  const handleCloseLogin = () => router.push("/");

  const onLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    try {
      await handleLogin(e, setIsLoggedIn, router);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    try {
      await handleRegister(e, setIsLoggedIn, router);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0E0F12] text-zinc-200">
      {/* Return link */}
      <button
        onClick={handleCloseLogin}
        className="fixed top-6 left-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#181920] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Home</span>
      </button>

      {/* Main Authentication Card */}
      <div className="w-full max-w-sm rounded-xl border border-[#23252E] bg-[#14151A] p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-9 h-9 mx-auto rounded-lg bg-indigo-600 flex items-center justify-center text-white mb-2">
            <Flame className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">The Phoenix</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Sign in to your account</p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#181920] rounded-lg border border-[#262833] mb-6">
          <button
            type="button"
            onClick={() => setIsActive(false)}
            className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
              !isActive
                ? "bg-[#232530] text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsActive(true)}
            className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
              isActive
                ? "bg-[#232530] text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        {!isActive ? (
          <form onSubmit={onLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Username</label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  required
                  className="w-full px-3 py-2 pl-9 rounded-lg bg-[#181920] border border-[#262833] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-300">Password</label>
                <button
                  type="button"
                  onClick={forgotPassword}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 pl-9 pr-9 rounded-lg bg-[#181920] border border-[#262833] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Username</label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  required
                  className="w-full px-3 py-2 pl-9 rounded-lg bg-[#181920] border border-[#262833] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="name@institution.edu"
                  required
                  className="w-full px-3 py-2 pl-9 rounded-lg bg-[#181920] border border-[#262833] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  required
                  className="w-full px-3 py-2 pl-9 pr-9 rounded-lg bg-[#181920] border border-[#262833] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginSignupForm;
