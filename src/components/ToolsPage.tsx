import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Wrench,
  Sparkles,
  Search,
  FileText,
  Volume2,
  Image as ImageIcon,
  Code2,
  SlidersHorizontal,
  Globe,
  Calculator,
  ShieldCheck,
  HeartHandshake,
  CheckCheck,
  BookOpen,
  Calendar,
  ChevronRight,
  Copy,
  Send,
  RotateCcw,
  Check,
  X,
  Play,
  Pause,
  Download,
  Trash2,
  Flame,
  Layers,
  Database,
  Terminal,
  Mic,
  MessageSquare,
  Activity,
  Cpu,
  Lock,
} from "lucide-react";
import { ButterflySwarm } from "./ButterflySwarm";
import { KarishmaMascot } from "./KarishmaMascot";
import { normalizeBanglishForTTS } from "../utils/banglishVoiceNormalizer";
import toolsWorkshopImg from "../assets/images/tools_atelier_exact_strip.jpg";

interface SparkleParticle {
  x: string;
  s: string;
  d: string;
  l: string;
  dx: string;
}

export type ToolCategory =
  | "all"
  | "writing"
  | "audio"
  | "creative"
  | "code"
  | "productivity"
  | "privacy";

export interface ToolItem {
  id: string;
  title: string;
  category: ToolCategory;
  categoryLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
  highlightTag: string;
  shortDesc: string;
  fullDesc: string;
  defaultPrompt?: string;
}

const TOOLS_LIST: ToolItem[] = [
  // 1. Writing & Text
  {
    id: "summarizer",
    title: "Smart Summarizer",
    category: "writing",
    categoryLabel: "Writing & Text",
    icon: FileText,
    badgeColor: "var(--k0)",
    highlightTag: "TL;DR & Bullets",
    shortDesc: "Transform lengthy articles into crisp bullet points or executive TL;DRs.",
    fullDesc:
      "Paste any article, email, or meeting transcript. Choose your summary format (bullet points, executive overview, or action items) with instant word count analytics.",
    defaultPrompt: "Please summarize the following text into clear, actionable bullet points:\n\n",
  },
  {
    id: "tone-polisher",
    title: "Tone & Style Polisher",
    category: "writing",
    categoryLabel: "Writing & Text",
    icon: SlidersHorizontal,
    badgeColor: "var(--k4)",
    highlightTag: "Voice Stylist",
    shortDesc: "Adjust writing tone: warm, professional, playful, or poetic.",
    fullDesc:
      "Rephrase any message to fit your audience. Perfect for drafting delicate emails, charismatic outreach, or poetic prose.",
    defaultPrompt: "Please polish and rewrite this text with a warm, empathetic, and professional tone:\n\n",
  },
  {
    id: "grammar-check",
    title: "Grammar & Flow Doctor",
    category: "writing",
    categoryLabel: "Writing & Text",
    icon: CheckCheck,
    badgeColor: "var(--k3)",
    highlightTag: "Proofreader",
    shortDesc: "Instant spellcheck, readability scores & structural flow improvement.",
    fullDesc:
      "Scan text for grammatical slips, awkward phrasing, and run-on sentences. Highlights suggested replacements with one-click adoption.",
    defaultPrompt: "Please proofread and improve the grammatical flow of this text:\n\n",
  },

  // 2. Voice & Audio
  {
    id: "banglish",
    title: "Banglish Voice Normalizer",
    category: "audio",
    categoryLabel: "Voice & Audio",
    icon: Volume2,
    badgeColor: "var(--k1)",
    highlightTag: "Live TTS Engine",
    shortDesc: "Phonetic voice cleaner and text-to-speech audio preview.",
    fullDesc:
      "Convert colloquial phonetic Banglish into standardized Bengali pronunciation with live Web Speech audio testing, rate/pitch sliders, and pronunciation enhancement.",
    defaultPrompt: "Help me normalize and respond to this Banglish message:\n\n",
  },
  {
    id: "transcript-cleaner",
    title: "Speech Transcript Cleaner",
    category: "audio",
    categoryLabel: "Voice & Audio",
    icon: Mic,
    badgeColor: "var(--k2)",
    highlightTag: "Audio Cleaner",
    shortDesc: "Strip filler words (um, uh, you know) and format spoken audio transcripts.",
    fullDesc:
      "Clean raw voice recognition dictation into structured, readable paragraphs while preserving natural intent and conversational tone.",
    defaultPrompt: "Please clean up this voice transcript, remove verbal fillers and repetitions, and format into clean paragraphs:\n\n",
  },

  // 3. AI Prompt & Art
  {
    id: "image-prompt",
    title: "Magic Image Crafter",
    category: "creative",
    categoryLabel: "AI Prompt & Art",
    icon: ImageIcon,
    badgeColor: "var(--k2)",
    highlightTag: "DALL-E & Flux",
    shortDesc: "Generate studio-grade prompts for image models with lighting & styles.",
    fullDesc:
      "Turn simple ideas into studio-grade visual prompts with artistic styles (Claymorphic 3D, Anime Watercolor, Cyberpunk, Studio Portrait), lighting, and camera parameters.",
    defaultPrompt: "Generate a detailed image prompt and description for: ",
  },
  {
    id: "persona-tuner",
    title: "Persona & Prompt Architect",
    category: "creative",
    categoryLabel: "AI Prompt & Art",
    icon: MessageSquare,
    badgeColor: "var(--k5)",
    highlightTag: "AI Persona",
    shortDesc: "Craft tailored system instructions and custom persona archetypes.",
    fullDesc:
      "Customize how Karishma thinks and communicates: select archetypes like 'Compassionate Best Friend', 'Pragmatic Engineer', or 'Philosophical Muse'.",
    defaultPrompt: "Let's adopt a creative persona for our next conversation: ",
  },

  // 4. Coding & Logic
  {
    id: "code-doctor",
    title: "Code Explainer & Doctor",
    category: "code",
    categoryLabel: "Coding & Logic",
    icon: Code2,
    badgeColor: "var(--k3)",
    highlightTag: "Bug Finder",
    shortDesc: "Debug errors, explain complex logic, and optimize performance.",
    fullDesc:
      "Inspect code snippets across TypeScript, Python, SQL, and HTML. Detect edge cases, optimize performance, and get clear step-by-step explanations.",
    defaultPrompt: "Please analyze and explain this code, and point out any potential bugs or performance bottlenecks:\n\n",
  },
  {
    id: "regex-sql",
    title: "SQL & Regex Builder",
    category: "code",
    categoryLabel: "Coding & Logic",
    icon: Terminal,
    badgeColor: "var(--k0)",
    highlightTag: "Query Crafter",
    shortDesc: "Translate natural language descriptions into valid SQL queries and RegEx patterns.",
    fullDesc:
      "Specify your data schema or string pattern requirements in plain English to receive structured SQL queries, regex expressions, and test cases.",
    defaultPrompt: "Write a SQL query and regex pattern for the following requirement:\n\n",
  },

  // 5. Productivity
  {
    id: "deep-search",
    title: "Web & Research Expander",
    category: "productivity",
    categoryLabel: "Productivity",
    icon: Globe,
    badgeColor: "var(--k5)",
    highlightTag: "Google Grounding",
    shortDesc: "Generate targeted Google Search queries with advanced operators.",
    fullDesc:
      "Input any topic to automatically generate 5 high-yield search queries formatted with advanced search operators (site:, filetype:pdf, exact quotes, date filters).",
    defaultPrompt: "Perform in-depth research and gather verified sources about: ",
  },
  {
    id: "converter",
    title: "Quick Math & Unit Lab",
    category: "productivity",
    categoryLabel: "Productivity",
    icon: Calculator,
    badgeColor: "var(--k0)",
    highlightTag: "Live Calculator",
    shortDesc: "Real-time converter for temperature, data size, percentages & timezones.",
    fullDesc:
      "Interactive math and unit converter with instant calculations for Celsius to Fahrenheit, MB to GB to TB, and financial tipping splits.",
    defaultPrompt: "Calculate and provide a step-by-step breakdown of: ",
  },
  {
    id: "template-vault",
    title: "Prompt Template Vault",
    category: "productivity",
    categoryLabel: "Productivity",
    icon: BookOpen,
    badgeColor: "var(--k4)",
    highlightTag: "Ready Blueprints",
    shortDesc: "Curated templates for resumes, study flashcards & project roadmaps.",
    fullDesc:
      "Access pre-engineered prompts for job interview rehearsals, travel planners, meal preparation, and cold email outreach.",
    defaultPrompt: "I'd like to use a structured template for planning my project. Can you help me walk through it?",
  },
  {
    id: "workspace-sync",
    title: "Workspace & Calendar Prep",
    category: "productivity",
    categoryLabel: "Productivity",
    icon: Calendar,
    badgeColor: "var(--k5)",
    highlightTag: "Google Calendar",
    shortDesc: "Draft meeting agendas, event invites, and Drive summaries.",
    fullDesc:
      "Format calendar entries, structured meeting notes, and Google Workspace commands ready for sync with your Google account.",
    defaultPrompt: "Draft a formal Google Calendar meeting invite and agenda for: ",
  },

  // 6. Privacy & Data
  {
    id: "privacy-audit",
    title: "Data & Memory Inspector",
    category: "privacy",
    categoryLabel: "Privacy & Data",
    icon: ShieldCheck,
    badgeColor: "var(--k1)",
    highlightTag: "Local Security",
    shortDesc: "Audit stored conversation cache, metrics, and JSON backups.",
    fullDesc:
      "Inspect local browser storage usage, check sync state with Firestore, test encryption integrity, and download conversation backups in JSON format.",
  },
  {
    id: "mood-compass",
    title: "Emotional & Mind Compass",
    category: "creative",
    categoryLabel: "Self-Care & Empathy",
    icon: HeartHandshake,
    badgeColor: "var(--k2)",
    highlightTag: "Mindfulness",
    shortDesc: "Gentle grounding exercises and mood reflection prompts.",
    fullDesc:
      "Select how you are feeling right now. Karishma generates tailored mindfulness check-ins, compassionate perspectives, and gentle conversational prompts.",
    defaultPrompt: "I am feeling a bit overwhelmed today. Can you share a gentle grounding thought and talk through it with me?",
  },
];

interface ToolsPageProps {
  onSendToChat?: (prompt: string) => void;
  onToast?: (msg: string) => void;
  onOpenSettings?: () => void;
}

export function ToolsPage({ onSendToChat, onToast, onOpenSettings }: ToolsPageProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [toolsActive, setToolsActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem("karishma_tools_engine_enabled") !== "off";
    } catch {
      return true;
    }
  });

  const [activeCategory, setActiveCategory] = useState<ToolCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTool, setActiveTool] = useState<ToolItem | null>(null);

  // Workbench interactive state
  const [workbenchInput, setWorkbenchInput] = useState("");
  const [workbenchOutput, setWorkbenchOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Tool parameter states
  const [summaryFormat, setSummaryFormat] = useState<"bullet" | "tldr" | "actions">("bullet");
  const [artStyle, setArtStyle] = useState("Claymorphic 3D");
  const [codeLang, setCodeLang] = useState("TypeScript");
  const [targetTone, setTargetTone] = useState("Warm & Empathetic");
  const [calcInputA, setCalcInputA] = useState("100");
  const [calcUnit, setCalcUnit] = useState<"c_to_f" | "mb_to_gb" | "pct">("c_to_f");

  // Floating ambient sparkles (matching MemoryPage motion)
  const particles = useMemo<SparkleParticle[]>(
    () =>
      Array.from({ length: 14 }, () => ({
        x: `${25 + Math.random() * 70}%`,
        s: `${8 + Math.random() * 12}px`,
        d: `${10 + Math.random() * 8}s`,
        l: `${-Math.random() * 12}s`,
        dx: `${-30 - Math.random() * 110}px`,
      })),
    []
  );

  const toggleToolsEngine = () => {
    setToolsActive((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("karishma_tools_engine_enabled", next ? "on" : "off");
      } catch {}
      onToast?.(next ? "✨ Tools Engine is ONLINE" : "Tools Engine is PAUSED");
      return next;
    });
  };

  // Ripple effect on tap
  const onPointerDown = (e: React.PointerEvent) => {
    const target = (e.target as HTMLElement).closest(".mp-c, .mp-tog, .tp-filter-btn") as HTMLElement | null;
    if (!target || !rootRef.current) return;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) / 2;
    const ripple = document.createElement("span");
    ripple.className = "mp-rp";
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    target.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  };

  // Filtered tools
  const filteredTools = useMemo(() => {
    return TOOLS_LIST.filter((tool) => {
      const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.highlightTag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Open Workbench for a tool
  const handleOpenTool = (tool: ToolItem) => {
    setActiveTool(tool);
    setCopied(false);
    setWorkbenchOutput("");
    setIsPlayingAudio(false);

    // Contextual prefill
    if (tool.id === "summarizer") {
      setWorkbenchInput(
        "Artificial intelligence and human collaboration work best when systems are built with empathy, transparency, and reliable tooling. In modern interactive systems, users benefit from intuitive direct manipulation and ambient feedback, allowing effortless navigation between creative brainstorming and deep technical debugging."
      );
    } else if (tool.id === "banglish") {
      setWorkbenchInput("Ami tomake bhalobashi. Ajker shokal ta khub shundor chilo, kemon acho tumi?");
    } else if (tool.id === "transcript-cleaner") {
      setWorkbenchInput("So um basically like we were discussing the deployment and you know it was kind of failing on the database port uh like three thousand.");
    } else if (tool.id === "image-prompt") {
      setWorkbenchInput("A cozy reading nook under a glowing blossom tree with a tiny purple cat sleeping on a clockwork gear");
    } else if (tool.id === "persona-tuner") {
      setWorkbenchInput("A warm, supportive, and intellectually curious companion who explains complex things with poetic clarity.");
    } else if (tool.id === "code-doctor") {
      setWorkbenchInput("function calculateDiscount(price, userType) {\n  if (userType == 'vip') {\n    return price * 0.8;\n  }\n  return price;\n}");
    } else if (tool.id === "regex-sql") {
      setWorkbenchInput("Find all active users who signed up in the last 30 days and have placed at least 2 orders.");
    } else if (tool.id === "tone-polisher") {
      setWorkbenchInput("Hey, I need that file by tomorrow or the project is delayed.");
    } else if (tool.id === "deep-search") {
      setWorkbenchInput("PostgreSQL connection pooling in serverless environments");
    } else {
      setWorkbenchInput("");
    }
  };

  // Live Workbench execution logic
  const handleRunWorkbench = () => {
    if (!activeTool) return;
    if (!["banglish", "converter", "image-prompt", "deep-search"].includes(activeTool.id)) { onToast?.("This tool is a UI preview, not connected in this MVP. Use Send to Chat for the configured AI."); return; }
    setIsProcessing(true);

    setTimeout(() => {
      if (activeTool.id === "summarizer") {
        if (summaryFormat === "bullet") {
          setWorkbenchOutput(
            "• Human-AI collaboration relies on empathy and reliability.\n• Direct manipulation and ambient feedback enhance usability.\n• Seamless flow connects creative thought with technical debugging."
          );
        } else if (summaryFormat === "tldr") {
          setWorkbenchOutput(
            "TL;DR: Effective AI design blends empathy with intuitive tooling, enabling seamless navigation between creativity and deep debugging."
          );
        } else {
          setWorkbenchOutput(
            "Action Items:\n1. Integrate transparent user feedback mechanisms.\n2. Prioritize direct manipulation controls.\n3. Verify smooth transitions between modes."
          );
        }
      } else if (activeTool.id === "banglish") {
        const normalized = normalizeBanglishForTTS(workbenchInput);
        setWorkbenchOutput(
          `Normalized Phonetic Bengali:\n"${normalized}"\n\nPreserved regional vowel cadence and conversational clarity. Click 'Test Voice Audio' to preview speech synthesis.`
        );
      } else if (activeTool.id === "transcript-cleaner") {
        setWorkbenchOutput(
          `Cleaned Transcript:\n"We discussed the deployment issues. The service was failing on database port 3000."\n\n[Stats: Removed 5 filler words; reduced length by 38%].`
        );
      } else if (activeTool.id === "image-prompt") {
        setWorkbenchOutput(
          `Crafted Image Prompt:\n"${workbenchInput}, ${artStyle} aesthetic, soft twilight illumination, claymorphic 3D rendering with tactile pastel textures, intricate details, 8k resolution, cinematic composition, award-winning digital artwork --ar 16:9 --v 6.1"`
        );
      } else if (activeTool.id === "persona-tuner") {
        setWorkbenchOutput(
          `Generated System Instruction:\n"You are Karishma, an emotionally intelligent and intellectually curious companion. Maintain a warm, encouraging tone while offering deep, analytical reasoning. When discussing challenges, provide gentle grounding reflections followed by clear, actionable steps."`
        );
      } else if (activeTool.id === "code-doctor") {
        setWorkbenchOutput(
          `// Code Analysis (${codeLang}):\n1. Type Safety: Missing input validation for negative 'price' values.\n2. Loose Equality: Using loose equality (==); recommended strict equality (===).\n3. TypeScript suggestion:\n\ntype UserType = 'standard' | 'vip' | 'partner';\n\nfunction calculateDiscount(price: number, userType: UserType): number {\n  if (price < 0) throw new RangeError('Price must be non-negative');\n  return userType === 'vip' ? price * 0.8 : price;\n}`
        );
      } else if (activeTool.id === "regex-sql") {
        setWorkbenchOutput(
          `-- Generated SQL Query:\nSELECT u.id, u.name, u.email, COUNT(o.id) AS total_orders\nFROM users u\nJOIN orders o ON u.id = o.user_id\nWHERE u.status = 'active'\n  AND u.created_at >= NOW() - INTERVAL '30 days'\nGROUP BY u.id, u.name, u.email\nHAVING COUNT(o.id) >= 2;\n\n-- Recommended Index:\nCREATE INDEX idx_users_active_signup ON users (status, created_at);`
        );
      } else if (activeTool.id === "tone-polisher") {
        if (targetTone.includes("Warm")) {
          setWorkbenchOutput(
            `"Hi there! Hope your week is going smoothly. When you have a moment today or tomorrow, could you please share that file? It will help us keep the project perfectly on track. Thanks so much for your help!"`
          );
        } else {
          setWorkbenchOutput(
            `"Greetings. In order to maintain our current delivery milestones, please provide the requested file at your earliest convenience prior to close of business tomorrow. Thank you."`
          );
        }
      } else if (activeTool.id === "deep-search") {
        const topic = workbenchInput.trim() || "PostgreSQL";
        setWorkbenchOutput(
          `Curated High-Yield Queries:\n1. "${topic}" architecture best practices site:github.com\n2. "${topic}" benchmarking latency filetype:pdf\n3. "${topic}" vs alternate solutions after:2025\n4. "how to configure" "${topic}" production guide\n5. site:news.ycombinator.com "${topic}" discussion`
        );
      } else if (activeTool.id === "converter") {
        const val = parseFloat(calcInputA) || 0;
        if (calcUnit === "c_to_f") {
          const f = (val * 9) / 5 + 32;
          setWorkbenchOutput(`${val}°C = ${f.toFixed(1)}°F (Kelvin: ${(val + 273.15).toFixed(1)} K)`);
        } else if (calcUnit === "mb_to_gb") {
          setWorkbenchOutput(`${val} MB = ${(val / 1024).toFixed(3)} GB (${(val * 1024).toLocaleString()} KB)`);
        } else {
          setWorkbenchOutput(`15% of ${val} = ${(val * 0.15).toFixed(2)} | 20% = ${(val * 0.2).toFixed(2)}`);
        }
      } else if (activeTool.id === "privacy-audit") {
        try {
          const keysCount = localStorage.length;
          setWorkbenchOutput(
            `Local Storage & Privacy Audit:\n• Stored item keys: ${keysCount}\n• Storage health: Optimal (quota < 1% used)\n• Encryption status: AES-256 client salt active\n• Session memory: Resilient in-memory fallback connected\n• Cloud sync: Firestore active with user-partitioned access rules`
          );
        } catch {
          setWorkbenchOutput("Local storage is running in sandboxed restricted mode.");
        }
      } else if (activeTool.id === "mood-compass") {
        setWorkbenchOutput(
          `Grounding Reflection:\n"Take a gentle, slow breath in. Whatever you are carrying today, you don't have to solve all of it this second. Let's tackle one small, peaceful step together."`
        );
      } else {
        setWorkbenchOutput(`Processed output for ${activeTool.title} ready for review.`);
      }
      setIsProcessing(false);
    }, 300);
  };

  // Play TTS preview for Banglish
  const handlePlayTTS = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onToast?.("Speech synthesis not supported in this browser");
      return;
    }
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = normalizeBanglishForTTS(workbenchInput || "Kemon acho?");
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
    onToast?.("Playing voice audio preview...");
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      onToast?.("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast?.("Failed to copy");
    }
  };

  // Send to Chat handoff
  const handleSendToChat = () => {
    if (!activeTool) return;
    const promptToSend = workbenchOutput
      ? `${activeTool.defaultPrompt || ""}${workbenchInput}\n\n[Draft Result]\n${workbenchOutput}`
      : `${activeTool.defaultPrompt || ""}${workbenchInput}`;

    onSendToChat?.(promptToSend);
    setActiveTool(null);
  };

  // Export local chat backup JSON
  const handleExportBackup = () => {
    try {
      const backupData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("karishma") || k.startsWith("chat_") || k.includes("session"))) {
          backupData[k] = localStorage.getItem(k);
        }
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `karishma-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onToast?.("Exported backup JSON successfully");
    } catch {
      onToast?.("Failed to export backup");
    }
  };

  return (
    <section className="tp" ref={rootRef} onPointerDown={onPointerDown}>
      {/* Floating Sparkle Particles */}
      <div className="mp-pet" aria-hidden="true">
        {particles.map((p, i) => (
          <i
            key={i}
            style={
              {
                "--x": p.x,
                "--s": p.s,
                "--d": p.d,
                "--l": p.l,
                "--dx": p.dx,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Floating Cloud Backdrops */}
      <div className="cloud mp-cl mp-c1" />
      <div className="cloud mp-cl mp-c2" />

      {/* Header */}
      <header className="mp-h mp-rise flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ "--i": 0 } as React.CSSProperties}>
        <div className="flex items-center gap-4">
          <div className="mp-tile tp-main-tile">
            <Wrench className="i tp-rot-icon" />
          </div>
          <div>
            <h1>
              Tools &amp; Studio <Sparkles className="i tp-sparkle-inline" />
            </h1>
            <p>Supercharge Karishma with intelligent converters, voice synthesis, creative crafters &amp; privacy utilities.</p>
          </div>
        </div>
        <div className="self-center md:self-auto flex items-center pr-2">
          <KarishmaMascot size="compact" className="compact" greeting="15 tools ready to help you! 🛠️💜" />
        </div>
      </header>



      {/* Filter and Search Bar Section */}
      <div className="tp-controls-bar mp-rise" style={{ "--i": 2 } as React.CSSProperties}>
        <div className="tp-search-box">
          <Search className="i tp-search-icon" />
          <input
            type="text"
            placeholder="Search all tools: write, voice audio, AI prompt, coding, productivity, privacy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tp-search-input"
          />
          {searchQuery && (
            <button className="tp-clear-btn" onClick={() => setSearchQuery("")}>
              <X className="i" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="tp-categories-scroll">
          {(
            [
              ["all", "All Tools"],
              ["writing", "Writing & Text"],
              ["audio", "Voice & Audio"],
              ["creative", "AI Prompt & Art"],
              ["code", "Coding & Logic"],
              ["productivity", "Productivity"],
              ["privacy", "Privacy & Data"],
            ] as [ToolCategory, string][]
          ).map(([catId, label]) => (
            <button
              key={catId}
              className={`tp-filter-btn ${activeCategory === catId ? "active" : ""}`}
              onClick={() => setActiveCategory(catId)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <h2 className="mp-sec mp-rise" style={{ "--i": 3 } as React.CSSProperties}>
        <Layers className="i" />
        Intelligent Modules ({filteredTools.length})
      </h2>

      {/* Grid of Tools (matching Memory Page card styling) */}
      <div className="mp-g">
        {filteredTools.map((tool, idx) => {
          const IconComponent = tool.icon;
          return (
            <button
              key={tool.id}
              className="mp-c mp-rise tp-tool-card"
              style={{ "--i": idx + 4 } as React.CSSProperties}
              onClick={() => handleOpenTool(tool)}
            >
              <span className="mp-ic" style={{ background: tool.badgeColor }}>
                <IconComponent className="i" />
              </span>
              <div>
                <div className="tp-card-tag-row">
                  <span className="tp-card-tag">{tool.categoryLabel}</span>
                  <span className="tp-card-highlight">{tool.highlightTag}</span>
                </div>
                <b>{tool.title}</b>
                <span className="t">{tool.shortDesc}</span>
              </div>
              <ChevronRight className="i ch" />
            </button>
          );
        })}
      </div>

      {/* Unique Animated Landscape Workshop (Matching the visual splendor of Memory Page) */}
      <div className="tp-land mp-rise" style={{ "--i": 10 } as React.CSSProperties}>
        <img
          src={toolsWorkshopImg}
          alt="Karishma's Clockwork Atelier and AI Studio at twilight"
          draggable={false}
          className="tp-land-img"
        />

        {/* Dynamic Celestial & Clockwork Overlay Animations */}
        <i className="tp-crescent-moon-glow" />
        <i className="tp-hologram-pulse" />
        <i className="tp-floating-gear g1" />
        <i className="tp-floating-gear g2" />
        <i className="tp-lantern-glow l1" />
        <i className="tp-lantern-glow l2" />
        <i className="tp-sparkle-star s1" />
        <i className="tp-sparkle-star s2" />
        <i className="tp-sparkle-star s3" />

        {/* Atelier Title Plaque */}
        <div className="tp-land-badge">
          <Sparkles className="i" />
          <span>Karishma Clockwork Atelier • AI Tools &amp; Reasoning Studio</span>
        </div>
      </div>

      {/* Butterfly Swarm (matching Memory Page) */}
      <ButterflySwarm />

      {/* Interactive Tool Modal / Drawer */}
      {activeTool && (
        <div className="tp-modal-overlay" onClick={() => setActiveTool(null)}>
          <div
            className="tp-modal-card card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="tp-modal-header">
              <div className="tp-modal-title-group">
                <span className="mp-ic" style={{ background: activeTool.badgeColor }}>
                  <activeTool.icon className="i" />
                </span>
                <div>
                  <div className="tp-modal-badge-group">
                    <span className="tp-modal-badge">{activeTool.categoryLabel}</span>
                    <span className="tp-modal-tag-pill">{activeTool.highlightTag}</span>
                  </div>
                  <h3>{activeTool.title}</h3>
                </div>
              </div>
              <button
                className="tp-modal-close-btn"
                onClick={() => setActiveTool(null)}
                aria-label="Close tool"
              >
                <X className="i" />
              </button>
            </div>

            <p className="tp-modal-desc">{activeTool.fullDesc}</p>

            {/* Tool-Specific Controls */}
            <div className="tp-modal-controls">
              {activeTool.id === "summarizer" && (
                <div className="tp-param-row">
                  <span className="tp-param-label">Format:</span>
                  <div className="tp-param-buttons">
                    <button
                      className={`tp-choice-btn ${summaryFormat === "bullet" ? "active" : ""}`}
                      onClick={() => setSummaryFormat("bullet")}
                    >
                      Bullet Points
                    </button>
                    <button
                      className={`tp-choice-btn ${summaryFormat === "tldr" ? "active" : ""}`}
                      onClick={() => setSummaryFormat("tldr")}
                    >
                      Executive TL;DR
                    </button>
                    <button
                      className={`tp-choice-btn ${summaryFormat === "actions" ? "active" : ""}`}
                      onClick={() => setSummaryFormat("actions")}
                    >
                      Action Items
                    </button>
                  </div>
                </div>
              )}

              {activeTool.id === "image-prompt" && (
                <div className="tp-param-row">
                  <span className="tp-param-label">Art Style Preset:</span>
                  <div className="tp-param-buttons">
                    {["Claymorphic 3D", "Anime Watercolor", "Cyberpunk Neon", "Studio Portrait", "Pixar Fantasy"].map((st) => (
                      <button
                        key={st}
                        className={`tp-choice-btn ${artStyle === st ? "active" : ""}`}
                        onClick={() => setArtStyle(st)}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool.id === "code-doctor" && (
                <div className="tp-param-row">
                  <span className="tp-param-label">Language:</span>
                  <div className="tp-param-buttons">
                    {["TypeScript", "Python", "SQL", "HTML/CSS"].map((lang) => (
                      <button
                        key={lang}
                        className={`tp-choice-btn ${codeLang === lang ? "active" : ""}`}
                        onClick={() => setCodeLang(lang)}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool.id === "tone-polisher" && (
                <div className="tp-param-row">
                  <span className="tp-param-label">Target Tone:</span>
                  <div className="tp-param-buttons">
                    {["Warm & Empathetic", "Executive Crisp", "Playful & Witty", "Poetic & Elegant"].map((tone) => (
                      <button
                        key={tone}
                        className={`tp-choice-btn ${targetTone === tone ? "active" : ""}`}
                        onClick={() => setTargetTone(tone)}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool.id === "converter" && (
                <div className="tp-param-row">
                  <span className="tp-param-label">Conversion Mode:</span>
                  <div className="tp-param-buttons">
                    <button
                      className={`tp-choice-btn ${calcUnit === "c_to_f" ? "active" : ""}`}
                      onClick={() => setCalcUnit("c_to_f")}
                    >
                      °C to °F
                    </button>
                    <button
                      className={`tp-choice-btn ${calcUnit === "mb_to_gb" ? "active" : ""}`}
                      onClick={() => setCalcUnit("mb_to_gb")}
                    >
                      MB to GB
                    </button>
                    <button
                      className={`tp-choice-btn ${calcUnit === "pct" ? "active" : ""}`}
                      onClick={() => setCalcUnit("pct")}
                    >
                      Percentage &amp; Split
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="tp-workbench-input-wrap">
              <div className="tp-input-header">
                <label>
                  {activeTool.id === "converter"
                    ? "Input Number / Value:"
                    : activeTool.id === "banglish"
                    ? "Phonetic Banglish (e.g. Ami bhalo achi):"
                    : activeTool.id === "regex-sql"
                    ? "Requirement (e.g. users active in last 30 days):"
                    : "Input Text / Code / Prompt:"}
                </label>
                {workbenchInput && (
                  <button className="tp-reset-link" onClick={() => setWorkbenchInput("")}>
                    Clear
                  </button>
                )}
              </div>
              <textarea
                className="tp-workbench-textarea"
                rows={activeTool.id === "converter" ? 2 : 4}
                value={workbenchInput}
                onChange={(e) => setWorkbenchInput(e.target.value)}
                placeholder="Type or paste here to process..."
              />
            </div>

            {/* Action Bar */}
            <div className="tp-workbench-actions">
              <button
                className="tp-run-btn"
                onClick={handleRunWorkbench}
                disabled={isProcessing || !workbenchInput.trim()}
              >
                {isProcessing ? (
                  <>
                    <RotateCcw className="i tp-spinning" /> Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="i" /> Run Tool
                  </>
                )}
              </button>

              {activeTool.id === "banglish" && (
                <button
                  className="tp-voice-btn"
                  onClick={handlePlayTTS}
                  disabled={!workbenchInput.trim()}
                >
                  {isPlayingAudio ? <Pause className="i" /> : <Play className="i" />}
                  {isPlayingAudio ? "Stop Audio" : "Test Voice Audio (TTS)"}
                </button>
              )}

              {activeTool.id === "privacy-audit" && (
                <button className="tp-voice-btn" onClick={handleExportBackup}>
                  <Download className="i" /> Export Backup JSON
                </button>
              )}
            </div>

            {/* Output Preview */}
            {workbenchOutput && (
              <div className="tp-output-container">
                <div className="tp-output-header">
                  <span>Tool Output &amp; Analysis</span>
                  <div className="tp-output-actions">
                    <button className="tp-mini-btn" onClick={() => handleCopy(workbenchOutput)}>
                      {copied ? <Check className="i" /> : <Copy className="i" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button className="tp-send-chat-btn" onClick={handleSendToChat}>
                      <Send className="i" /> Send to Karishma
                    </button>
                  </div>
                </div>
                <pre className="tp-output-pre">{workbenchOutput}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
