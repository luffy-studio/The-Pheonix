import React from "react";
import Head from "next/head";
import AppNavbar from "@/components/AppNavbar";
import SchedulerDashboard from "@/components/SchedulerDashboard";

export default function SchedulerAnalytics() {
  return (
    <>
      <Head>
        <title>Scheduler Analytics — The Phoenix</title>
        <meta
          name="description"
          content="Review timetable analytics, faculty workload distribution, and schedule optimization."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-[#0E0F12] text-zinc-200">
        <AppNavbar />

        <div className="pt-24 pb-16">
          <SchedulerDashboard />
        </div>
      </div>
    </>
  );
}
