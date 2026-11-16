import React from "react";
import {
  MessageCircle,
  Bot,
  Sparkles,
  Brain,
  Folder,
  LayoutGrid,
  Wrench,
  Compass,
  Settings,
} from "lucide-react";

/** Shared small pieces for the claymorphic shell (mockup "Karishma Ai 4.html"). */

export type UIView =
  | "Chat"
  | "Memory"
  | "Agents"
  | "Studio"
  | "Files"
  | "Projects"
  | "Tools"
  | "Explore";

/** Butterfly brand mark (also used as the chat avatar and decorative flyers). */
export const ButterflySvg = ({ style }: { style?: React.CSSProperties }) => (
  <svg viewBox="0 0 48 48" style={style} aria-hidden="true">
    <defs>
      <linearGradient id="bw" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: "var(--b1)" }} />
        <stop offset="1" style={{ stopColor: "var(--b2)" }} />
      </linearGradient>
    </defs>
    <path d="M24 24C18 10 6 8 5 15c-1 8 8 11 19 9Z" fill="url(#bw)" />
    <path d="M24 24C30 10 42 8 43 15c1 8-8 11-19 9Z" fill="url(#bw)" />
    <path d="M24 26C14 26 8 34 12 40c4 4 10-1 12-14Z" style={{ fill: "var(--b3)" }} />
    <path d="M24 26c10 0 16 8 12 14-4 4-10-1-12-14Z" style={{ fill: "var(--b4)" }} />
    <rect x="22.5" y="14" width="3" height="22" rx="1.5" style={{ fill: "var(--b5)" }} />
  </svg>
);

/** Placeholder avatar used when the signed-in user has no photo. */
export const AvatarFallback = () => (
  <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
    <rect width="40" height="40" fill="#cfd8f5" />
    <path d="M4 40c1-9 8-12 16-12s15 3 16 12Z" fill="#d94b4b" />
    <rect x="16" y="24" width="8" height="6" fill="#d9a07f" />
    <ellipse cx="20" cy="17" rx="8" ry="9.5" fill="#e3b08f" />
    <path d="M11.5 16c0-8 5-10 9-10s8.5 2 8.5 10c-1-4-4-6-8.5-6s-7 2-9 6Z" fill="#2b2230" />
    <path d="M12.5 19c1 8 4 11 7.5 11s6.5-3 7.5-11c-1 3-4 5-7.5 5s-6.5-2-7.5-5Z" fill="#2b2230" />
    <path d="M17 24.5q3 2 6 0" stroke="#fff" strokeWidth="1.2" fill="none" />
  </svg>
);

export interface NavItem {
  view: UIView;
  icon: React.ComponentType<{ className?: string }>;
  /** When set, clicking opens an existing panel instead of switching views. */
  panel?: "history" | "settings";
}

export const NAV_ITEMS: NavItem[] = [
  { view: "Chat", icon: MessageCircle },
  { view: "Agents", icon: Bot },
  { view: "Studio", icon: Sparkles },
  { view: "Files", icon: Folder },
  { view: "Projects", icon: LayoutGrid },
  { view: "Tools", icon: Wrench },
  { view: "Explore", icon: Compass },
  { view: "Memory", icon: Brain }, // full Memory page (mockup v5)
  { view: "Chat", icon: Settings, panel: "settings" }, // rendered as "Settings"
];

export const VIEW_BLURB: Record<string, string> = {
  Agents: "Create task agents that work for you.",
  Studio: "Make images, documents and more.",
  Files: "Your uploaded files will appear here.",
  Projects: "Group chats and files by project.",
  Tools: "Connect tools to extend Karishma.",
  Explore: "Live weather, trending news, viral reels & top songs.",
};

export interface QuickCard {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  prefill: string;
}

export const QUICK_CARDS: QuickCard[] = [
  { label: "Ask Anything", icon: MessageCircle, bg: "var(--k0)", prefill: "Ask me anything: " },
  { label: "Write & Create", icon: Sparkles, bg: "var(--k1)", prefill: "Help me write: " },
  { label: "Code & Develop", icon: Wrench, bg: "var(--k2)", prefill: "Help me with this code:\n" },
  { label: "Study & Learn", icon: Compass, bg: "var(--k3)", prefill: "Teach me about: " },
  { label: "Plan & Organize", icon: LayoutGrid, bg: "var(--k4)", prefill: "Help me plan: " },
  { label: "More Tools", icon: Bot, bg: "var(--k5)", prefill: "" },
];

export const WISDOM_LIST = [
  "Small steps, taken daily, build big things.",
  "Ask the question you're afraid is too simple.",
  "Rest is part of the work.",
  "Curiosity is a skill you can practice.",
];

export const QUICK_TOOLS = ["Summarize", "Translate", "Explain code", "Brainstorm"];
