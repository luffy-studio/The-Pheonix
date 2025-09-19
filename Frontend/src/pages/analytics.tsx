import React from 'react';
import Head from 'next/head';
import AppleNavbar from '@/components/AppleNavbar';
import SchedulerDashboard from '@/components/SchedulerDashboard';

export default function SchedulerAnalytics() {
  return (
    <>
      <Head>
        <title>Scheduler Analytics - EduSchedule</title>
        <meta name="description" content="Advanced analytics and optimization for your timetable scheduling" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <AppleNavbar />
        
        {/* Background Pattern */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-3xl" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 py-8">
          <SchedulerDashboard />
        </div>
      </div>
    </>
  );
}