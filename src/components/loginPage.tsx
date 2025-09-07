import React, { useState } from "react";
import { User, Lock, Mail, Facebook, Github, Linkedin, Chrome } from "lucide-react";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Validation schemas using Zod
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registrationSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const LoginSignupForm: React.FC = () => {
  const [isActive, setIsActive] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    };

    const result = loginSchema.safeParse(data);
    if (!result.success) {
      alert(result.error.errors.map((err) => err.message).join("\n"));
      return;
    }

    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("username, password")
        .eq("username", data.username)
        .single();

      if (error) {
        alert("User not found or an error occurred.");
        return;
      }

      if (user.password !== data.password) {
        alert("Invalid password.");
        return;
      }

      alert("Login successful!");
      console.log("User data:", user);
    } catch (err) {
      console.error("Error verifying login:", err);
      alert("An unexpected error occurred.");
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const result = registrationSchema.safeParse(data);
    if (!result.success) {
      alert(result.error.errors.map((err) => err.message).join("\n"));
      return;
    }

    try {
      const { error } = await supabase.from("users").insert([data]);

      if (error) {
        alert("An error occurred while registering the user.");
        console.error("Error saving user data:", error);
        return;
      }

      alert("Registration successful!");
      console.log("User registered:", data);
    } catch (err) {
      console.error("Error during registration:", err);
      alert("An unexpected error occurred.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-gray-200 to-indigo-200">
      <div className="relative w-[850px] h-[550px] bg-[#ffffff] rounded-[30px] shadow-2xl overflow-hidden">
          
{/* Login Form */}
        <div className={`absolute w-1/2 h-full flex translate-x-[-100%] items-center text-center p-10 z-10 transition-all duration-700 ease-in-out ${isActive ? "translate-x-[100%] opacity-0" : "right-0 opacity-100"}`}>
          <form className="w-full" onSubmit={handleLogin}>
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
                type="password"
                name="password"
                placeholder="Password"
                required
                className="w-full py-3 pl-5 pr-12 bg-gray-200 rounded-md outline-none text-gray-800 font-medium placeholder-gray-500"
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" />
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
              <a href="#" className="p-2 border-2 border-gray-300 rounded-md"><Chrome /></a>
              <a href="#" className="p-2 border-2 border-gray-300 rounded-md"><Facebook /></a>
              <a href="#" className="p-2 border-2 border-gray-300 rounded-md"><Github /></a>
              <a href="#" className="p-2 border-2 border-gray-300 rounded-md"><Linkedin /></a>
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
          className={`absolute top-0 left-0 text-center align-center w-full h-full bg-[#7494ec] rounded-[150px] transition-all duration-[1800ms] ease-in-out z-0 ${isActive ? "-translate-x-1/2" : "translate-x-1/2"
            }`}
        >
          
        </div>
        {/* Register Form */}
          <div className={`absolute w-1/2 h-full flex items-center text-center p-10 z-10 transition-all duration-700 ease-in-out ${isActive ? "right-0 opacity-100" : "translate-x-[200%] opacity-0"}`}>
            <form className="w-full" onSubmit={handleRegister}>
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
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  className="w-full py-3 pl-5 pr-12 bg-gray-200 rounded-md outline-none text-gray-800 font-medium placeholder-gray-500"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" />
              </div>
              <button
                className="w-full h-12 bg-indigo-400 rounded-md shadow-md text-white font-semibold"
                type="submit"
              >
                Register
              </button>
              <p className="mt-5 text-sm">or register with social platforms</p>
              <div className="flex justify-center mt-4 space-x-3">
                <a href="#" className="p-2 border-2 border-gray-300 rounded-md"><Chrome /></a>
                <a href="#" className="p-2 border-2 border-gray-300 rounded-md"><Facebook /></a>
                <a href="#" className="p-2 border-2 border-gray-300 rounded-md"><Github /></a>
                <a href="#" className="p-2 border-2 border-gray-300 rounded-md"><Linkedin /></a>
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
    </div>
  );
};

export default LoginSignupForm;
