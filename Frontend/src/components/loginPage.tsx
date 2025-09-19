import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Mail,
  Facebook,
  Github,
  Linkedin,
  Chrome,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { handleRegister } from "@/handlers/handleRegister";
import { handleLogin } from "@/handlers/handleLogin";

const LoginSignupForm: React.FC = () => {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false); // false = login, true = register
  const [loading, setLoading] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const { setIsLoggedIn } = useAuth();

  const handleCloseLogin = () => router.push("/");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-gray-200 to-indigo-200">
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

  <div className="hidden md:block relative w-[850px] h-[550px] bg-[#ffffff] rounded-[30px] shadow-2xl overflow-hidden">
        {/* Login Form */}
        <div
          className={`absolute w-1/2 h-full flex translate-x-[-100%] items-center text-center p-10 z-10 transition-all duration-700 ease-in-out ${
            isActive ? "translate-x-[100%] opacity-0" : "right-0 opacity-100"
          }`}
        >
          <form className="w-full" onSubmit={(e) => handleLogin(e, setIsLoggedIn, router)}>
            <h1 className="text-3xl font-bold mb-2">Login</h1>
            <div className="relative my-6">
              <input
                type="text"
                name="username"
                placeholder="Username"
                required
                className="w-full py-3 pl-5 pr-12 bg-gray-200 rounded-md outline-none text-gray-800 font-medium placeholder-gray-500"
              />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" />
            </div>
            <div className="relative my-6">
              <input
                type={showLoginPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                required
                className="w-full py-3 pl-5 pr-12 bg-gray-200 rounded-md outline-none text-gray-800 font-medium placeholder-gray-500"
              />
              <div
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
              >
                {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>
            </div>
            <div className="text-sm text-right mb-4">
              <a href="#" className="text-gray-600 hover:underline">
                Forgot Password?
              </a>
            </div>
            <button className="w-full h-12 bg-indigo-400 rounded-md shadow-md text-white font-semibold">
              Login
            </button>
            <p className="mt-5 text-sm">or login with social platforms</p>
            <div className="flex justify-center mt-4 space-x-3">
              <a href="#" className="p-2 border-2 border-gray-300 rounded-md">
                <Chrome />
              </a>
              <a href="#" className="p-2 border-2 border-gray-300 rounded-md">
                <Facebook />
              </a>
              <a href="#" className="p-2 border-2 border-gray-300 rounded-md">
                <Github />
              </a>
              <a href="#" className="p-2 border-2 border-gray-300 rounded-md">
                <Linkedin />
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-600">Don’t have an account?</p>
            <button
              type="button"
              className="mt-2 w-full h-12 border-2 border-indigo-400 text-indigo-400 rounded-md hover:bg-indigo-400 hover:text-white transition"
              onClick={() => setIsActive(true)}
            >
              Register Now
            </button>
          </form>
        </div>

        {/* Blue Background Overlay */}
        <div
          className={`absolute top-0 left-0 text-center align-center w-full h-full bg-[#7494ec] rounded-[150px] transition-all duration-[1800ms] ease-in-out z-0 ${
            isActive ? "-translate-x-1/2" : "translate-x-1/2"
          }`}
        ></div>

        {/* Register Form */}
        <div
          className={`absolute w-1/2 h-full flex items-center text-center p-10 z-10 transition-all duration-700 ease-in-out ${
            isActive ? "right-0 opacity-100" : "translate-x-[200%] opacity-0"
          }`}
        >
          <form className="w-full" onSubmit={(e) => handleRegister(e, setIsLoggedIn, router)}>
            <h1 className="text-3xl font-bold mb-2">Registration</h1>
            <div className="relative my-6">
              <input
                type="text"
                name="username"
                placeholder="Username"
                required
                className="w-full py-3 pl-5 pr-12 bg-gray-200 rounded-md outline-none text-gray-800 font-medium placeholder-gray-500"
              />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" />
            </div>
            <div className="relative my-6">
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                className="w-full py-3 pl-5 pr-12 bg-gray-200 rounded-md outline-none text-gray-800 font-medium placeholder-gray-500"
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" />
            </div>
            <div className="relative my-6">
              <input
                type={showRegisterPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                required
                className="w-full py-3 pl-5 pr-12 bg-gray-200 rounded-md outline-none text-gray-800 font-medium placeholder-gray-500"
              />
              <div
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
              >
                {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>
            </div>
            <button className="w-full h-12 bg-indigo-400 rounded-md shadow-md text-white font-semibold" type="submit">
              Register
            </button>
            <p className="mt-5 text-sm">or register with social platforms</p>
            <div className="flex justify-center mt-4 space-x-3">
              <a href="#" className="p-2 border-2 border-gray-300 rounded-md">
                <Chrome />
              </a>
              <a href="#" className="p-2 border-2 border-gray-300 rounded-md">
                <Facebook />
              </a>
              <a href="#" className="p-2 border-2 border-gray-300 rounded-md">
                <Github />
              </a>
              <a href="#" className="p-2 border-2 border-gray-300 rounded-md">
                <Linkedin />
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-600">Already have an account?</p>
            <button
              type="button"
              className="mt-2 w-full h-12 border-2 border-indigo-400 text-indigo-400 rounded-md hover:bg-indigo-400 hover:text-white transition"
              onClick={() => setIsActive(false)}
            >
              Login Now
            </button>
          </form>
        </div>
      </div>

      {/* Mobile-first responsive card (keeps original desktop layout above unchanged) */}
      <div className="block md:hidden w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl p-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{isActive ? 'Register' : 'Login'}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsActive(false)}
              className={`px-3 py-1 rounded-md text-sm ${!isActive ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Login
            </button>
            <button
              onClick={() => setIsActive(true)}
              className={`px-3 py-1 rounded-md text-sm ${isActive ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Register
            </button>
          </div>
        </div>

        {!isActive ? (
          <form className="w-full" onSubmit={(e) => handleLogin(e, setIsLoggedIn, router)}>
            <div className="mb-3">
              <input
                type="text"
                name="username"
                placeholder="Username"
                required
                className="w-full py-2 px-3 bg-gray-100 rounded-md outline-none"
              />
            </div>
            <div className="mb-3 relative">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                required
                className="w-full py-2 px-3 bg-gray-100 rounded-md outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
            </div>
            <button className="w-full py-2 bg-indigo-500 text-white rounded-md font-medium">Login</button>
            <div className="mt-3 text-center text-sm text-gray-600">or login with social platforms</div>
            <div className="flex justify-center mt-3 space-x-3">
              <a href="#" className="p-2 border rounded-md"><Chrome className="w-4 h-4" /></a>
              <a href="#" className="p-2 border rounded-md"><Facebook className="w-4 h-4" /></a>
              <a href="#" className="p-2 border rounded-md"><Github className="w-4 h-4" /></a>
              <a href="#" className="p-2 border rounded-md"><Linkedin className="w-4 h-4" /></a>
            </div>
          </form>
        ) : (
          <form className="w-full" onSubmit={(e) => handleRegister(e, setIsLoggedIn, router)}>
            <div className="mb-3">
              <input
                type="text"
                name="username"
                placeholder="Username"
                required
                className="w-full py-2 px-3 bg-gray-100 rounded-md outline-none"
              />
            </div>
            <div className="mb-3">
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                className="w-full py-2 px-3 bg-gray-100 rounded-md outline-none"
              />
            </div>
            <div className="mb-3 relative">
              <input
                type={showRegisterPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                required
                className="w-full py-2 px-3 bg-gray-100 rounded-md outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600" onClick={() => setShowRegisterPassword(!showRegisterPassword)}>
                {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
            </div>
            <button type="submit" className="w-full py-2 bg-indigo-500 text-white rounded-md font-medium">Register</button>
            <div className="mt-3 text-center text-sm text-gray-600">or register with social platforms</div>
            <div className="flex justify-center mt-3 space-x-3">
              <a href="#" className="p-2 border rounded-md"><Chrome className="w-4 h-4" /></a>
              <a href="#" className="p-2 border rounded-md"><Facebook className="w-4 h-4" /></a>
              <a href="#" className="p-2 border rounded-md"><Github className="w-4 h-4" /></a>
              <a href="#" className="p-2 border rounded-md"><Linkedin className="w-4 h-4" /></a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginSignupForm;
