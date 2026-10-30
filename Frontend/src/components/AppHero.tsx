import React from "react";
import { useRouter } from "next/router";
import { ArrowRight, Calendar, Clock, Check, User, MapPin } from "lucide-react";

const AppHero: React.FC = () => {
  const router = useRouter();

  return (
    <section className="pt-24 pb-16 md:pt-28 md:pb-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181920] border border-[#262833] text-zinc-300 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span>Automated Timetable Scheduling</span>
        </div>

        {/* Clear Headline */}
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-100 leading-tight mb-4">
          Academic Timetables, Simplified
        </h1>

        {/* Short, comfortable description */}
        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
          Generate conflict-free schedules for faculty, classes, and rooms in seconds. 
          Balance teacher workloads and export to Excel with one click.
        </p>

        {/* Primary and secondary CTAs */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <button
            onClick={() => router.push("/create")}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push("/generate")}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-300 bg-[#181920] hover:bg-[#20222B] border border-[#262833] transition-colors"
          >
            Open Generator
          </button>
        </div>

        {/* Clean, Readable Product Preview Card */}
        <div className="rounded-xl border border-[#23252E] bg-[#14151A] overflow-hidden text-left shadow-lg">
          {/* Preview Window Header */}
          <div className="px-4 py-3 border-b border-[#23252E] flex items-center justify-between bg-[#111216]">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="text-xs text-zinc-400 font-mono ml-2">Weekly Schedule — Computer Science (Year 3)</span>
            </div>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <Check className="w-3 h-3" /> Conflict-free
            </span>
          </div>

          {/* Clean Schedule Table Mockup */}
          <div className="p-4 overflow-x-auto">
            <div className="min-w-[620px] text-xs">
              <div className="grid grid-cols-6 gap-2 pb-2 mb-2 border-b border-[#23252E] font-medium text-zinc-400 text-center">
                <div className="text-left pl-2">Time</div>
                <div>Monday</div>
                <div>Tuesday</div>
                <div>Wednesday</div>
                <div>Thursday</div>
                <div>Friday</div>
              </div>

              {/* Rows */}
              <div className="space-y-2">
                {[
                  {
                    time: "09:00 - 10:00",
                    slots: [
                      { sub: "Algorithms", code: "CS301", teacher: "Dr. Smith", bg: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
                      { sub: "Data Structures", code: "CS201", teacher: "Prof. Miller", bg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" },
                      { sub: "Machine Learning", code: "AI301", teacher: "Dr. Adams", bg: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
                      { sub: "Free", free: true },
                      { sub: "Algorithms", code: "CS301", teacher: "Dr. Smith", bg: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
                    ],
                  },
                  {
                    time: "10:00 - 11:00",
                    slots: [
                      { sub: "Database Systems", code: "CS304", teacher: "Dr. Patel", bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
                      { sub: "Free", free: true },
                      { sub: "Algorithms", code: "CS301", teacher: "Dr. Smith", bg: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
                      { sub: "Deep Learning", code: "AI302", teacher: "Dr. Adams", bg: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
                      { sub: "Database Systems", code: "CS304", teacher: "Dr. Patel", bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
                    ],
                  },
                  {
                    time: "11:30 - 12:30",
                    slots: [
                      { sub: "Free", free: true },
                      { sub: "AI Lab", code: "AI301L", teacher: "Dr. Adams", bg: "bg-purple-500/10 text-purple-300 border-purple-500/20" },
                      { sub: "Free", free: true },
                      { sub: "Data Structures", code: "CS201", teacher: "Prof. Miller", bg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" },
                      { sub: "Seminar", code: "CS399", teacher: "Faculty", bg: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
                    ],
                  },
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-6 gap-2 items-center text-center">
                    <div className="text-left pl-2 font-mono text-[11px] text-zinc-500">
                      {row.time}
                    </div>
                    {row.slots.map((slot, j) => (
                      <div
                        key={j}
                        className={`p-2 rounded-md border text-left min-h-[46px] flex flex-col justify-center ${
                          slot.free
                            ? "border-dashed border-[#23252E] bg-transparent text-zinc-600 text-center"
                            : slot.bg
                        }`}
                      >
                        {slot.free ? (
                          <span className="text-[11px]">—</span>
                        ) : (
                          <>
                            <div className="font-semibold text-xs leading-tight truncate">{slot.sub}</div>
                            <div className="text-[10px] opacity-75 font-mono truncate">{slot.teacher}</div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppHero;
