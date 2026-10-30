import React, { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { ArrowLeft, Mail, Check } from "lucide-react";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <Head>
        <title>Reset Password — The Phoenix</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0E0F12] text-zinc-200">
        <div className="w-full max-w-sm rounded-xl border border-[#23252E] bg-[#14151A] p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-zinc-100">Reset Password</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Enter your email to receive recovery instructions
            </p>
          </div>

          {submitted ? (
            <div className="text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed">
              <Check className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
              If an account with this email exists, a password reset link has been sent.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-zinc-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@institution.edu"
                    required
                    className="w-full px-3 py-2 pl-9 rounded-lg bg-[#181920] border border-[#262833] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                Send Reset Link
              </button>
            </form>
          )}

          <div className="text-center mt-6 pt-4 border-t border-[#23252E]">
            <Link
              href="/login"
              className="inline-flex items-center text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
