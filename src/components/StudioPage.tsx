import React, { useState } from "react";
import {
  Sparkles,
  Palette,
  Image as ImageIcon,
  Type,
  Music,
  Download,
  Copy,
  Check,
  Send,
  Sliders,
  Layers,
  Wand2,
} from "lucide-react";
import { ButterflySwarm } from "./ButterflySwarm";
import { KarishmaMascot } from "./KarishmaMascot";
import studioImg from "../assets/images/studio_panoramic_strip.jpg";

export interface StudioPreset {
  id: string;
  title: string;
  category: "art" | "writing" | "sound" | "diffusion";
  desc: string;
  badgeColor: string;
  promptTemplate: string;
}

const STUDIO_PRESETS: StudioPreset[] = [
  {
    id: "watercolor",
    title: "Makoto Shinkai Watercolor",
    category: "art",
    desc: "Dreamy atmospheric anime lighting with glowing clouds and golden hour twilight reflections.",
    badgeColor: "var(--k1)",
    promptTemplate: "Makoto Shinkai aesthetic, breathtaking twilight sky, radiant sunset clouds, cinematic lighting, watercolor anime style, 8k masterpiece --ar 16:9",
  },
  {
    id: "claymorphic",
    title: "Tactile Claymorphic 3D",
    category: "art",
    desc: "Playful rounded 3D clay figurines with soft studio lighting and tactile pastel textures.",
    badgeColor: "var(--k0)",
    promptTemplate: "Claymorphic 3D style, smooth rounded matte plasticine surfaces, soft pastel lighting, isometric perspective, cute minimalist design, blender render",
  },
  {
    id: "cyber-neon",
    title: "Chibi Cyberpunk Atelier",
    category: "art",
    desc: "Holographic retro-futuristic steampunk workshop with glowing circuits and brass details.",
    badgeColor: "var(--k4)",
    promptTemplate: "Cozy cyberpunk workshop at night, glowing teal and magenta neon glyphs, intricate vintage clockwork brass gears, rain-slicked glass, studio quality",
  },
  {
    id: "poetry-bangla",
    title: "Bengali Lyrical Ghazal",
    category: "writing",
    desc: "Craft soulful Banglish and Bengali romantic poems with Tagore-inspired cadence.",
    badgeColor: "var(--k2)",
    promptTemplate: "Write a soulful and evocative Bengali lyrical poem (in Banglish and Bengali script) about raindrops, evening tea, and nostalgic memories:",
  },
  {
    id: "executive-brief",
    title: "Executive Strategic One-Pager",
    category: "writing",
    desc: "Distill complex software architectures and product roadmaps into crisp C-suite memos.",
    badgeColor: "var(--k3)",
    promptTemplate: "Structure an executive one-page briefing with Context, Strategic Pillars, Key Trade-offs, and Immediate Action Items for: ",
  },
  {
    id: "ambient-audio",
    title: "Binaural Lo-Fi Soundscape",
    category: "sound",
    desc: "Design detailed auditory environments for deep focus, meditation, and calm coding.",
    badgeColor: "var(--k5)",
    promptTemplate: "Describe a detailed immersive binaural soundscape prompt for a cozy rainy teahouse in the mountains with crackling cedar fireplace:",
  },
];

interface StudioPageProps {
  onSendToChat?: (prompt: string) => void;
  onToast?: (msg: string) => void;
}

export function StudioPage({ onSendToChat, onToast }: StudioPageProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedPreset, setSelectedPreset] = useState<StudioPreset | null>(null);
  const [customIdea, setCustomIdea] = useState("");
  const [copied, setCopied] = useState(false);

  const filtered = STUDIO_PRESETS.filter(
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
          <div className="mp-tile" style={{ background: "linear-gradient(135deg,#f472b6,#ec4899)" }}>
            <Palette className="i" />
          </div>
          <div>
            <h1>
              Creative Studio <Sparkles className="i tp-sparkle-inline" />
            </h1>
            <p>Compose stunning visual art prompts, poetic writing, and multimedia concepts alongside Karishma.</p>
          </div>
        </div>
        <div className="self-center md:self-auto flex items-center pr-2">
          <KarishmaMascot size="compact" className="compact" greeting="Let's make magic! 🎨✨" />
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="tp-controls-bar mp-rise" style={{ "--i": 1 } as React.CSSProperties}>
        <div className="tp-categories-scroll">
          {[
            ["all", "All Mediums"],
            ["art", "Visual & Diffusion"],
            ["writing", "Lyrical & Prose"],
            ["sound", "Audio & Soundscapes"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`tp-filter-btn ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <h2 className="mp-sec mp-rise" style={{ "--i": 2 } as React.CSSProperties}>
        <Wand2 className="i" />
        Studio Presets &amp; Canvases ({filtered.length})
      </h2>

      {/* Grid of Studio Cards */}
      <div className="mp-g">
        {filtered.map((item, i) => (
          <button
            key={item.id}
            className="mp-c mp-rise"
            style={{ "--i": i + 3 } as React.CSSProperties}
            onClick={() => {
              setSelectedPreset(item);
              setCustomIdea("");
            }}
          >
            <span className="mp-ic" style={{ background: item.badgeColor }}>
              <Palette className="i" />
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span className="tp-card-tag">{item.category}</span>
              </div>
              <b>{item.title}</b>
              <span className="t">{item.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Panoramic Animated Landscape Art */}
      <div className="tp-land mp-rise" style={{ "--i": 9 } as React.CSSProperties}>
        <img
          src={studioImg}
          alt="Karishma's Floating Art Studio in the sunset clouds"
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

      {/* Studio Modal */}
      {selectedPreset && (
        <div className="tp-modal-overlay" onClick={() => setSelectedPreset(null)}>
          <div className="tp-modal-card card" onClick={(e) => e.stopPropagation()}>
            <div className="tp-modal-header">
              <div className="tp-modal-icon-wrap" style={{ background: selectedPreset.badgeColor }}>
                <Palette className="i" />
              </div>
              <div>
                <h3>{selectedPreset.title}</h3>
                <span className="tp-modal-cat-tag">{selectedPreset.category}</span>
              </div>
              <button className="tp-modal-close-btn" onClick={() => setSelectedPreset(null)}>
                ✕
              </button>
            </div>
            <p className="tp-modal-desc">{selectedPreset.desc}</p>
            <div className="tp-param-box">
              <label>Your Concept / Custom Seed Idea</label>
              <input
                type="text"
                className="tp-param-input"
                placeholder="e.g. A serene greenhouse on Mars with neon butterflies"
                value={customIdea}
                onChange={(e) => setCustomIdea(e.target.value)}
              />
            </div>
            <div className="tp-param-box">
              <label>Studio Prompt Template</label>
              <div className="tp-code-preview">
                {customIdea ? `${customIdea}, ${selectedPreset.promptTemplate}` : selectedPreset.promptTemplate}
              </div>
            </div>
            <div className="tp-modal-footer">
              <button
                className="tp-copy-btn"
                onClick={() => {
                  const text = customIdea
                    ? `${customIdea}, ${selectedPreset.promptTemplate}`
                    : selectedPreset.promptTemplate;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  onToast?.("Prompt copied to clipboard!");
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="i" /> : <Copy className="i" />} Copy
              </button>
              <button
                className="tp-handoff-btn"
                onClick={() => {
                  const prompt = customIdea
                    ? `[Studio Prompt Execution]\n${customIdea}\n\nStyle Guide:\n${selectedPreset.promptTemplate}`
                    : `[Studio Prompt Execution]\n${selectedPreset.promptTemplate}`;
                  onSendToChat?.(prompt);
                  setSelectedPreset(null);
                }}
              >
                <Send className="i" /> Create in Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
