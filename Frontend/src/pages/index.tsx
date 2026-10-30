import React from "react";
import Head from "next/head";
import AppNavbar from "@/components/AppNavbar";
import AppHero from "@/components/AppHero";
import { useRouter } from "next/router";
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  ArrowRight,
  CheckCircle,
  FileSpreadsheet,
  Shield,
  Layers,
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: Shield,
      title: "Conflict-Free Schedules",
      description:
        "Automatically ensures that no teacher or classroom is assigned to two courses simultaneously.",
    },
    {
      icon: Users,
      title: "Workload Balancing",
      description:
        "Respects weekly maximum credit limits and distributes teaching assignments equitably.",
    },
    {
      icon: FileSpreadsheet,
      title: "Excel & CSV Export",
      description:
        "Download complete schedules per cohort or teacher as clean, formatted spreadsheets.",
    },
  ];

  const steps = [
    {
      step: "1",
      title: "Input Faculty & Courses",
      description: "Upload your teacher list, course credits, and class sections via spreadsheet or simple form.",
    },
    {
      step: "2",
      title: "Run the Generator",
      description: "The scheduler computes an optimal timetable based on daily hour caps and lunch breaks.",
    },
    {
      step: "3",
      title: "Review & Export",
      description: "Inspect the generated grid by class cohort or teacher, and export directly to Excel.",
    },
  ];

  return (
    <>
      <Head>
        <title>The Phoenix — Academic Timetable Generator</title>
        <meta
          name="description"
          content="Clean, simple, automated academic timetable generator for schools, colleges, and universities."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-[#0E0F12] text-zinc-200">
        <AppNavbar />
        <AppHero />

        {/* 3 Core Features */}
        <section className="py-16 border-t border-[#23252E]">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mb-2">
                Designed for Reliable Scheduling
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                A straightforward system to eliminate manual timetable headaches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {features.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={i}
                    className="p-5 rounded-xl border border-[#23252E] bg-[#14151A] space-y-2.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#1D1F29] border border-[#2C2E3C] flex items-center justify-center text-indigo-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-100">{feat.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3-Step Process */}
        <section className="py-16 border-t border-[#23252E]">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mb-2">
                How It Works
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                From initial data setup to final timetable in three simple steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((st, i) => (
                <div key={i} className="space-y-2">
                  <div className="w-7 h-7 rounded-md bg-[#1C1E26] border border-[#2D303E] text-zinc-300 font-mono text-xs flex items-center justify-center font-semibold">
                    {st.step}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100">{st.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{st.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calm Bottom CTA */}
        <section className="py-16 border-t border-[#23252E]">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="p-8 rounded-xl border border-[#23252E] bg-[#14151A] space-y-4">
              <h2 className="text-xl font-bold text-zinc-100">Ready to build your timetable?</h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                Set up your faculty and course structure now or start with our template.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => router.push("/create")}
                  className="px-5 py-2.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                >
                  Setup Academic Data
                </button>
                <button
                  onClick={() => router.push("/generate")}
                  className="px-4 py-2.5 rounded-lg text-xs font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] transition-colors"
                >
                  Generate Timetable
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="py-8 border-t border-[#23252E] text-xs text-zinc-500 text-center">
          <p>© {new Date().getFullYear()} The Phoenix. Built for universities, colleges, and academic institutions.</p>
        </footer>
      </div>
    </>
  );
}
