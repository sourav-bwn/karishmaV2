import React, { useState } from "react";
import {
  Bot,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  Check,
  Search,
  ExternalLink,
  Cpu,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import { ButterflySwarm } from "./ButterflySwarm";
import { KarishmaMascot } from "./KarishmaMascot";
import agentsImg from "../assets/images/agents_panoramic_strip.jpg";

export interface AgentItem {
  id: string;
  name: string;
  role: string;
  desc: string;
  color: string;
  iconName: string;
  systemPrompt: string;
  category: "research" | "productivity" | "coding" | "creativity";
  status: "idle" | "running" | "ready";
}

const AGENTS_LIST: AgentItem[] = [
  {
    id: "deep-research",
    name: "Athena Deep Research",
    role: "Autonomous Web & Data Synthesis Agent",
    desc: "Executes multi-step web queries, cross-checks real citations, and compiles executive briefing dossiers.",
    color: "var(--k0)",
    iconName: "Search",
    systemPrompt: "You are Athena, an elite autonomous research agent. Conduct systematic investigations with verifiable source citations and structured outlines.",
    category: "research",
    status: "ready",
  },
  {
    id: "code-architect",
    name: "Daedalus Code Architect",
    role: "Full-Stack Refactor & Bug Doctor",
    desc: "Parses complex repositories, plans zero-regression refactors, and drafts production TypeScript & SQL schemas.",
    color: "var(--k3)",
    iconName: "Cpu",
    systemPrompt: "You are Daedalus, an architectural software engineer. Analyze logic, prevent race conditions, and recommend robust implementations.",
    category: "coding",
    status: "ready",
  },
  {
    id: "creative-muse",
    name: "Kalliope Creative Muse",
    role: "Storyteller & Persona Director",
    desc: "Co-creates vivid worldbuilding, compelling story arcs, poetic Bengali verses, and aesthetic visual concepts.",
    color: "var(--k1)",
    iconName: "Sparkles",
    systemPrompt: "You are Kalliope, a poetic companion and creative director. Nurture imaginative narratives with emotional warmth and tactile detail.",
    category: "creativity",
    status: "ready",
  },
  {
    id: "ops-sentinel",
    name: "Chronos Workflow Sentinel",
    role: "Daily Planner & Habit Engine",
    desc: "Orchestrates your day, prioritizes complex backlogs, and automates task breakdowns with gentle reminders.",
    color: "var(--k4)",
    iconName: "Zap",
    systemPrompt: "You are Chronos, a pragmatic productivity strategist. Deconstruct ambitious goals into calm, actionable steps.",
    category: "productivity",
    status: "ready",
  },
  {
    id: "privacy-warden",
    name: "Aegis Privacy Warden",
    role: "Local Token & PII Sanitizer",
    desc: "Audits prompt payloads, redacts sensitive identifiers client-side, and guarantees private local execution.",
    color: "var(--k2)",
    iconName: "Shield",
    systemPrompt: "You are Aegis, a zero-trust privacy auditor. Scan and redact personal identifiable information before transmission.",
    category: "research",
    status: "ready",
  },
  {
    id: "multi-model",
    name: "Hermes Cross-Model Dispatcher",
    role: "Intelligent Routing & Fallback Orchestrator",
    desc: "Dynamically balances requests between Gemini 2.5 Flash, Nemotron, and OpenRouter with automatic failover.",
    color: "var(--k5)",
    iconName: "Layers",
    systemPrompt: "You are Hermes, a low-latency model routing agent. Ensure instantaneous recovery and cost-effective completions.",
    category: "productivity",
    status: "ready",
  },
];

interface AgentsPageProps {
  onSendToChat?: (prompt: string) => void;
  onToast?: (msg: string) => void;
}

export function AgentsPage({ onSendToChat, onToast }: AgentsPageProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [activeAgentStatus, setActiveAgentStatus] = useState<Record<string, boolean>>({
    "deep-research": true,
    "code-architect": true,
    "creative-muse": true,
  });

  // Coming-soon preview: every card, tab and toggle stays visible but nothing activates.
  const [soonKey, setSoonKey] = useState<string | null>(null);
  const showSoon = (key: string) => {
    setSoonKey(key);
    window.setTimeout(() => setSoonKey((k) => (k === key ? null : k)), 1600);
  };

  const filtered = AGENTS_LIST;

  return (
    <section className="mp tp agents-soon">
      {/* Floating Cloud Backdrops */}
      <div className="cloud mp-cl mp-c1" />
      <div className="cloud mp-cl mp-c2" />

      {/* Header */}
      <header className="mp-h mp-rise flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ "--i": 0 } as React.CSSProperties}>
        <div className="flex items-center gap-4">
          <div className="mp-tile" style={{ background: "linear-gradient(135deg,#c084fc,#818cf8)" }}>
            <Bot className="i" />
          </div>
          <div>
            <h1>
              Autonomous Agents <Sparkles className="i tp-sparkle-inline" />
            </h1>
            <p>Autonomous agents are coming soon. This is a preview of what is planned.</p>
          </div>
        </div>
        <div className="self-center md:self-auto flex items-center pr-2">
          <KarishmaMascot size="compact" className="compact" greeting="Agents are coming soon!" />
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="tp-controls-bar mp-rise" style={{ "--i": 1 } as React.CSSProperties}>
        <div className="tp-categories-scroll">
          {[
            ["all", "All Agents"],
            ["research", "Research & Web"],
            ["coding", "Coding & Logic"],
            ["creativity", "Creativity & Muse"],
            ["productivity", "Workflow & Ops"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-disabled="true"
              title="Coming soon"
              className={`tp-filter-btn soon-item ${soonKey === "tab-" + id ? "show-soon" : ""}`}
              data-soon="Coming soon"
              onClick={() => showSoon("tab-" + id)}
            >
              <span className="soon-x" aria-hidden="true">✕</span> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <h2 className="mp-sec mp-rise" style={{ "--i": 2 } as React.CSSProperties}>
        <Cpu className="i" />
        Planned agents ({filtered.length})
      </h2>

      <p className="soon-note mp-rise" style={{ "--i": 2 } as React.CSSProperties}>✕ Coming soon - not available yet. Descriptions below are planned, not live.</p>

      {/* Grid of Agents */}
      <div className="mp-g">
        {filtered.map((agent, i) => {
          const isActive = !!activeAgentStatus[agent.id];
          return (
            <button
              key={agent.id}
              type="button"
              aria-disabled="true"
              title="Coming soon"
              className={`mp-c mp-rise soon-item ${soonKey === agent.id ? "show-soon" : ""}`}
              data-soon="Coming soon"
              style={{ "--i": i + 3 } as React.CSSProperties}
              onClick={() => showSoon(agent.id)}
            >
              <span className="mp-ic" style={{ background: agent.color }}>
                <Bot className="i" />
              </span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span className="tp-card-tag">✕ Coming soon</span>
                  <span className="tp-card-highlight">{agent.category}</span>
                </div>
                <b>{agent.name}</b>
                <span className="t">{agent.desc}</span>
              </div>
              <div
                style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}
              >
                <div className="mp-tog off" style={{ scale: "0.85" }}>
                  <span />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Panoramic Animated Landscape Art */}
      <div className="tp-land mp-rise" style={{ "--i": 9 } as React.CSSProperties}>
        <img
          src={agentsImg}
          alt="Karishma's Autonomous Agents Sanctuary at twilight with companion robots"
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

      {/* Drawer / Workbench Modal */}
      {selectedAgent && (
        <div className="tp-modal-overlay" onClick={() => setSelectedAgent(null)}>
          <div className="tp-modal-card card" onClick={(e) => e.stopPropagation()}>
            <div className="tp-modal-header">
              <div className="tp-modal-icon-wrap" style={{ background: selectedAgent.color }}>
                <Bot className="i" />
              </div>
              <div>
                <h3>{selectedAgent.name}</h3>
                <span className="tp-modal-cat-tag">{selectedAgent.role}</span>
              </div>
              <button className="tp-modal-close-btn" onClick={() => setSelectedAgent(null)}>
                ✕
              </button>
            </div>
            <p className="tp-modal-desc">{selectedAgent.desc}</p>
            <div className="tp-param-box">
              <label>System Mission Directive</label>
              <div className="tp-code-preview">{selectedAgent.systemPrompt}</div>
            </div>
            <div className="tp-modal-footer">
              <button
                className="tp-handoff-btn"
                onClick={() => {
                  onSendToChat?.(
                    `[Autonomous Agent Dispatch: ${selectedAgent.name}]\n${selectedAgent.systemPrompt}\n\nKarishma, please initialize this agent and stand by for my instruction.`
                  );
                  setSelectedAgent(null);
                }}
              >
                <Play className="i" /> Launch in Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
