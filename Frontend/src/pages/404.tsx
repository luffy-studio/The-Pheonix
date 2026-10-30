import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import AppNavbar from "@/components/AppNavbar";
import { ArrowLeft, Home, Compass } from "lucide-react";

export default function Custom404() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>404 — Page Not Found | The Phoenix</title>
        <meta
          name="description"
          content="The page you're looking for may have been moved or doesn't exist."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-[#0E0F12] text-zinc-200 flex flex-col justify-between">
        <AppNavbar />

        {/* Centered Error Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-24 sm:py-32">
          <div className="w-full max-w-md text-center">
            {/* Subtle 404 Indicator */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#181920] border border-[#262833] text-zinc-400 font-mono text-xs font-medium mb-4">
              <span>Error 404</span>
            </div>

            {/* Subtle Large 404 Number */}
            <div className="text-7xl sm:text-8xl font-black font-mono tracking-tighter text-zinc-700/60 select-none mb-2">
              404
            </div>

            {/* Main Message */}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mb-2">
              Oops! This page couldn&apos;t be found.
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto mb-8 leading-relaxed">
              The page you&apos;re looking for may have been moved or doesn&apos;t exist.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go Back</span>
              </button>
            </div>

            {/* Helpful Quick Links */}
            <div className="mt-12 pt-6 border-t border-[#23252E]/70">
              <span className="text-[11px] text-zinc-500 block mb-3 font-medium">
                Quick Navigation
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <Link
                  href="/create"
                  className="px-2.5 py-1 rounded bg-[#14151A] hover:bg-[#181920] border border-[#23252E] text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Setup Data
                </Link>
                <Link
                  href="/generate"
                  className="px-2.5 py-1 rounded bg-[#14151A] hover:bg-[#181920] border border-[#23252E] text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Generate Timetable
                </Link>
                <Link
                  href="/view"
                  className="px-2.5 py-1 rounded bg-[#14151A] hover:bg-[#181920] border border-[#23252E] text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  View Timetables
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="py-6 border-t border-[#23252E] text-[11px] text-zinc-600 text-center">
          <span>The Phoenix — Automated Academic Timetable Generator</span>
        </footer>
      </div>
    </>
  );
}
