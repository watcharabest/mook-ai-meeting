import Link from "next/link";
import { TopNavBar } from "@/app/components/TopNavBar";
import { Footer } from "@/app/components/Footer";

export default function SummaryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNavBar title="Product Strategy Sync" />
      <main className="p-8 lg:p-20 bg-background max-w-screen-2xl mx-auto w-full">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-2 text-on-surface-variant text-sm mb-4">
              <Link href="/">Dashboard</Link>
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
              <span className="text-on-background font-medium">
                Product Strategy Sync
              </span>
            </nav>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-on-background leading-tight">
              Product Strategy Sync: Q4 Planning
            </h1>
            <div className="flex items-center gap-4 mt-4 text-on-surface-variant font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">
                  calendar_today
                </span>{" "}
                Oct 24, 2024
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">
                  schedule
                </span>{" "}
                42 Minutes
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">
                  group
                </span>{" "}
                5 Participants
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-surface-container-high hover:bg-surface-container-highest px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined">content_copy</span>
              Copy Summary
            </button>
            <button className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-md shadow-primary/20 cursor-pointer">
              <span className="material-symbols-outlined">picture_as_pdf</span>
              Export as PDF
            </button>
          </div>
        </div>

        {/* Executive Overview + Action Items */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          <div className="lg:col-span-2 bg-surface-container-lowest p-10 rounded-[2rem] shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-8 bg-primary rounded-full"></span>
              <h2 className="text-2xl font-bold text-on-background">
                Executive Overview
              </h2>
            </div>
            <p className="text-on-surface-variant leading-relaxed text-lg mb-8">
              The session focused on aligning the engineering roadmap with the Q4
              marketing initiatives. Key discussions centered around the launch
              of the AI-powered curator module and addressing existing technical
              debt in the storage layer. The team reached a consensus on
              prioritizing performance over new secondary features for the first
              half of the quarter.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-surface-container-low rounded-2xl">
                <h3 className="font-bold text-on-background mb-2">
                  Key Themes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {["Scalability", "AI Integration", "UX Refinement"].map(
                    (theme) => (
                      <span
                        key={theme}
                        className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-lg text-sm font-medium"
                      >
                        {theme}
                      </span>
                    )
                  )}
                </div>
              </div>
              <div className="p-6 bg-surface-container-low rounded-2xl">
                <h3 className="font-bold text-on-background mb-2">
                  Sentiment Analysis
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    trending_up
                  </span>
                  <span className="font-semibold text-on-background">
                    Positive / Collaborative
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-tertiary-container text-on-tertiary-container p-10 rounded-[2rem] flex flex-col shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-3xl">
                task_alt
              </span>
              <h2 className="text-2xl font-bold">Action Items</h2>
            </div>
            <ul className="space-y-6 flex-1">
              {[
                {
                  title: "Update Roadmap",
                  desc: "Sarah to integrate AI module milestones into Jira by Friday.",
                },
                {
                  title: "Finalize UI Mockups",
                  desc: "Design team needs to provide the 'Dark Mode' specs for the dashboard.",
                },
                {
                  title: "Infrastructure Audit",
                  desc: "Marcus to run a load test on the new storage clusters.",
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <div className="min-w-[24px] h-6 rounded-full border-2 border-slate-400 flex items-center justify-center mt-1"></div>
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm opacity-80">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button className="mt-8 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
              <span className="material-symbols-outlined">sync</span>
              Sync to Notion
            </button>
          </div>
        </section>

        {/* Transcript */}
        <section className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-on-background mb-10">
            Full Transcript
          </h2>
          <div className="space-y-12">
            <div className="flex gap-8">
              <div className="hidden md:block w-16 text-on-surface-variant text-sm font-mono pt-1">
                02:14
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-on-background">
                    Sarah Johnson
                  </span>
                  <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                    Product Lead
                  </span>
                </div>
                <p className="text-on-background leading-relaxed text-lg">
                  Alright team, let&apos;s look at the Q4 roadmap. We need to be
                  realistic about the AI curator launch. Are we looking at a
                  November alpha or are we pushing to December?
                </p>
              </div>
            </div>
            <div className="flex gap-8 bg-tertiary-container/20 -mx-6 px-6 py-8 rounded-[2rem] border border-tertiary-container/30">
              <div className="hidden md:block w-16 text-on-surface-variant text-sm font-mono pt-1">
                05:30
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-on-background">
                      Marcus Chen
                    </span>
                    <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                      Engineering
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[16px]">
                      bolt
                    </span>{" "}
                    AI Insight
                  </span>
                </div>
                <p className="text-on-background leading-relaxed text-lg">
                  Technically, the core engine is 90% there. The bottleneck
                  right now is the storage layer&apos;s latency when processing
                  large audio files.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-20 text-center">
            <button className="text-on-surface-variant hover:text-on-background font-semibold flex items-center gap-2 mx-auto transition-colors cursor-pointer">
              <span className="material-symbols-outlined">expand_more</span>
              Show Full Transcript (3,420 words)
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
