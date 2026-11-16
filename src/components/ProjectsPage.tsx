import React, { useState } from "react";
import {
  LayoutGrid,
  FolderGit2,
  GitBranch,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Play,
  Sparkles,
  ChevronRight,
  ListTodo,
} from "lucide-react";
import { ButterflySwarm } from "./ButterflySwarm";
import { KarishmaMascot } from "./KarishmaMascot";
import projectsImg from "../assets/images/projects_panoramic_strip.jpg";

export interface ProjectItem {
  id: string;
  title: string;
  category: "mobile" | "ai" | "backend" | "design";
  desc: string;
  progress: number;
  badgeColor: string;
  tasksCount: number;
  completedTasks: number;
  lastActive: string;
}

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: "p1",
    title: "Karishma Native Android APK",
    category: "mobile",
    desc: "Capacitor runtime integration, hardware back button routing, safe-area insets, and dark status bar theme.",
    progress: 92,
    badgeColor: "var(--k0)",
    tasksCount: 12,
    completedTasks: 11,
    lastActive: "Today",
  },
  {
    id: "p2",
    title: "Banglish TTS & Voice Normalizer",
    category: "ai",
    desc: "Phonetic dictionary engine, vowel cadence restoration, and Web Speech API synthesis integration.",
    progress: 100,
    badgeColor: "var(--k1)",
    tasksCount: 8,
    completedTasks: 8,
    lastActive: "Nov 8, 2026",
  },
  {
    id: "p3",
    title: "Supabase & Postgres Resilient Store",
    category: "backend",
    desc: "Multi-layered persistence, user-partitioned conversation sessions, and zero-downtime in-memory fallback.",
    progress: 88,
    badgeColor: "var(--k3)",
    tasksCount: 15,
    completedTasks: 13,
    lastActive: "Nov 7, 2026",
  },
  {
    id: "p4",
    title: "Claymorphic Multi-View Design Suite",
    category: "design",
    desc: "Panoramic twilight atelier artworks, floating butterfly swarms, ripple interactions, and tactile pastel cards.",
    progress: 95,
    badgeColor: "var(--k4)",
    tasksCount: 10,
    completedTasks: 9,
    lastActive: "Just now",
  },
];

interface ProjectsPageProps {
  onSendToChat?: (prompt: string) => void;
  onToast?: (msg: string) => void;
}

export function ProjectsPage({ onSendToChat, onToast }: ProjectsPageProps) {
  const [projects, setProjects] = useState<ProjectItem[]>(DEFAULT_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const filtered = projects.filter(
    (p) => activeTab === "all" || p.category === activeTab
  );

  return (
    <section className="mp tp">
      {/* Floating Cloud Backdrops */}
      <div className="cloud mp-cl mp-c1" />
      <div className="cloud mp-cl mp-c2" />

      {/* Header */}
      <header className="mp-h mp-rise flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ "--i": 0 } as React.CSSProperties}>
        <div className="flex items-center gap-4">
          <div className="mp-tile" style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)" }}>
            <LayoutGrid className="i" />
          </div>
          <div>
            <h1>
              Projects &amp; Workspaces <Sparkles className="i tp-sparkle-inline" />
            </h1>
            <p>Organize chats, prompts, tasks and code assets by initiative with milestone tracking.</p>
          </div>
        </div>
        <div className="self-center md:self-auto flex items-center pr-2">
          <KarishmaMascot size="compact" className="compact" greeting="Let's build together! 🚀💜" />
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="tp-controls-bar mp-rise" style={{ "--i": 1 } as React.CSSProperties}>
        <div className="tp-categories-scroll">
          {[
            ["all", "All Workspaces"],
            ["mobile", "Mobile & Native"],
            ["ai", "AI & Reasoning"],
            ["backend", "Backend & SQL"],
            ["design", "UI & Design"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`tp-filter-btn ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
          <button
            className="tp-filter-btn active"
            style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => onToast?.("Projects is a UI preview; project creation is not included in this MVP.")}
          >
            <Plus className="i" style={{ width: 14, height: 14 }} /> New Workspace
          </button>
        </div>
      </div>

      {/* Section Header */}
      <h2 className="mp-sec mp-rise" style={{ "--i": 2 } as React.CSSProperties}>
        <FolderGit2 className="i" />
        Active Initiatives ({filtered.length})
      </h2>

      {/* Grid of Projects */}
      <div className="mp-g">
        {filtered.map((proj, i) => (
          <button
            key={proj.id}
            className="mp-c mp-rise"
            style={{ "--i": i + 3 } as React.CSSProperties}
            onClick={() => setSelectedProject(proj)}
          >
            <span className="mp-ic" style={{ background: proj.badgeColor }}>
              <LayoutGrid className="i" />
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span className="tp-card-tag">{proj.category.toUpperCase()}</span>
                <span className="tp-card-highlight">
                  {proj.completedTasks}/{proj.tasksCount} Tasks
                </span>
              </div>
              <b>{proj.title}</b>
              <span className="t">{proj.desc}</span>
              {/* Progress bar */}
              <div style={{ marginTop: 8, width: "100%", height: 6, borderRadius: 3, background: "var(--lav)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${proj.progress}%`,
                    height: "100%",
                    borderRadius: 3,
                    background: "linear-gradient(90deg, #c084fc, #38bdf8)",
                  }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Panoramic Animated Landscape Art */}
      <div className="tp-land mp-rise" style={{ "--i": 9 } as React.CSSProperties}>
        <img
          src={projectsImg}
          alt="Karishma's Architect Pavilion and Utopian Valley at sunrise"
          draggable={false}
          className="tp-land-img"
        />
        <i className="tp-crescent-moon-glow" />
        <i className="tp-hologram-pulse" />
        <i className="tp-floating-gear g1" />
        <i className="tp-floating-gear g2" />
        <i className="tp-lantern-glow l1" />
        <i className="tp-lantern-glow l2" />
        <i className="tp-sparkle-star s1" />
        <i className="tp-sparkle-star s2" />
        <i className="tp-sparkle-star s3" />
      </div>

      <ButterflySwarm />

      {/* Project Drawer Modal */}
      {selectedProject && (
        <div className="tp-modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="tp-modal-card card" onClick={(e) => e.stopPropagation()}>
            <div className="tp-modal-header">
              <div className="tp-modal-icon-wrap" style={{ background: selectedProject.badgeColor }}>
                <LayoutGrid className="i" />
              </div>
              <div>
                <h3>{selectedProject.title}</h3>
                <span className="tp-modal-cat-tag">
                  {selectedProject.category.toUpperCase()} • {selectedProject.progress}% complete
                </span>
              </div>
              <button className="tp-modal-close-btn" onClick={() => setSelectedProject(null)}>
                ✕
              </button>
            </div>
            <p className="tp-modal-desc">{selectedProject.desc}</p>
            <div className="tp-param-box">
              <label>Milestone Progress</label>
              <div className="tp-code-preview">
                {`Status: In progress\nActive Sprint Tasks: ${selectedProject.completedTasks} of ${selectedProject.tasksCount} done\nLast modified: ${selectedProject.lastActive}\nContext binding: Linked to Karishma session memory`}
              </div>
            </div>
            <div className="tp-modal-footer">
              <button
                className="tp-handoff-btn"
                onClick={() => {
                  onSendToChat?.(
                    `Let's review the "${selectedProject.title}" project. What are the key remaining tasks and next steps?`
                  );
                  setSelectedProject(null);
                }}
              >
                <Play className="i" /> Open in Workspace Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
