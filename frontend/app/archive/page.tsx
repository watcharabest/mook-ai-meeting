"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNavBar } from "@/app/components/TopNavBar";
import { Footer } from "@/app/components/Footer";

const archiveItems = [
  {
    id: 1,
    title: "Q3 Product Strategy Sync",
    date: "October 24, 2024",
    tags: ["Team Sync", "Strategy"],
    icon: "groups",
    color: "bg-secondary-container text-on-secondary-container",
  },
  {
    id: 2,
    title: "Client Briefing: Northstar",
    date: "October 22, 2024",
    tags: ["Client Call", "Design"],
    icon: "person",
    color: "bg-tertiary-container text-on-tertiary-container",
  },
  {
    id: 3,
    title: "Board Review: Q4 Financial Targets",
    date: "Oct 19",
    tags: ["Finance"],
    icon: "auto_awesome",
    color: "bg-primary text-on-primary",
    featured: true,
  },
  {
    id: 4,
    title: "Internal Retro: Project Apex",
    date: "October 15, 2024",
    tags: ["Retrospective", "Operations"],
    icon: "description",
    color: "bg-surface-container text-on-surface-variant",
  },
  {
    id: 5,
    title: "Interview: Senior Architect Candidate",
    date: "October 12, 2024",
    tags: ["Hiring", "Engineering"],
    icon: "record_voice_over",
    color: "bg-secondary-container text-on-secondary-container",
  },
];

export default function ArchivePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <TopNavBar title="Meeting Archive" />
      <div className="px-8 py-12 max-w-screen-2xl mx-auto w-full flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold font-[var(--font-manrope)] tracking-tight text-on-background mb-2">
              Meeting Archive
            </h1>
            <p className="text-on-surface-variant max-w-lg">
              Access and manage your library of intelligence. Every
              conversation, distilled and indexed for your convenience.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-container rounded-lg p-1">
              <button className="px-4 py-2 bg-white shadow-sm rounded-md text-sm font-semibold flex items-center gap-2 cursor-pointer">
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  grid_view
                </span>
                Grid
              </button>
              <button className="px-4 py-2 text-on-surface-variant hover:text-on-background text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-lg">list</span>
                List
              </button>
            </div>
            <button className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-lg text-sm font-semibold hover:bg-surface-container-highest transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-lg">
                filter_list
              </span>
              Filters
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {archiveItems.map((item) =>
            item.featured ? (
              <div
                key={item.id}
                className="group relative bg-primary text-on-primary p-8 rounded-3xl transition-all duration-300 hover:shadow-[0_12px_40px_rgba(68,100,100,0.2)] overflow-hidden cursor-pointer"
                onClick={() => router.push("/summary")}
              >
                <div className="absolute -right-10 -top-10 opacity-10">
                  <span className="material-symbols-outlined text-[160px]">
                    auto_awesome
                  </span>
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-8">
                    <span className="bg-on-primary/20 text-white text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full">
                      Featured insight
                    </span>
                  </div>
                  <h3 className="text-2xl font-black font-[var(--font-manrope)] mb-4 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-white/70 text-sm mb-auto line-clamp-3">
                    The session concluded with a unanimous decision to increase
                    R&D investment by 12% focusing on generative editorial
                    tools...
                  </p>
                  <div className="pt-8 flex items-center gap-4">
                    <span className="text-sm font-medium">{item.date}</span>
                    <div className="h-1 w-1 rounded-full bg-on-primary/40"></div>
                    <span className="text-sm font-medium">{item.tags[0]}</span>
                    <button className="ml-auto w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        play_arrow
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={item.id}
                className="group relative bg-surface-container-lowest p-8 rounded-3xl transition-all duration-300 hover:shadow-[0_12px_40px_rgba(43,52,55,0.05)] border border-transparent hover:border-outline-variant/10 cursor-pointer"
                onClick={() => router.push("/summary")}
              >
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`h-12 w-12 ${item.color.split(" ")[0]} rounded-2xl flex items-center justify-center`}
                  >
                    <span
                      className={`material-symbols-outlined ${item.color.split(" ")[1]}`}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 hover:bg-error-container/20 rounded-full text-error transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-xl">
                        delete
                      </span>
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 hover:bg-primary-container/30 rounded-full text-primary transition-colors cursor-pointer"
                      title="Download"
                    >
                      <span className="material-symbols-outlined text-xl">
                        download
                      </span>
                    </button>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold font-[var(--font-manrope)] mb-2 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs">
                      calendar_today
                    </span>
                    {item.date}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-8">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-surface-container-high text-on-surface-variant text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="pt-6 border-t border-outline-variant/10">
                  <div className="flex items-center justify-between group/link">
                    <span className="font-semibold text-primary">
                      View Summary
                    </span>
                    <span className="material-symbols-outlined group-hover/link:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </div>
            )
          )}
          {/* Upload prompt card */}
          <div
            onClick={() => router.push("/upload")}
            className="group relative border-2 border-dashed border-outline-variant/30 p-8 rounded-3xl flex flex-col items-center justify-center text-center hover:bg-surface-container/30 transition-colors cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant">
                history
              </span>
            </div>
            <h4 className="font-bold text-on-surface-variant mb-1">
              Old recordings?
            </h4>
            <p className="text-xs text-on-surface-variant/60 px-8">
              Drag and drop any legacy audio files to transcribe and archive them
              here.
            </p>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-outline-variant/10 pt-10">
          <div className="text-sm font-medium text-on-surface-variant">
            Showing{" "}
            <span className="text-on-background font-bold">5</span> of{" "}
            <span className="text-on-background font-bold">128</span>{" "}
            summaries
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white font-bold cursor-pointer">
              1
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors font-bold cursor-pointer">
              2
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors font-bold cursor-pointer">
              3
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
