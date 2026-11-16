import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Compass,
  Sparkles,
  Flame,
  Search,
  CloudSun,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Eye,
  Radio,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music,
  Disc3,
  Heart,
  Share2,
  ExternalLink,
  MessageCircle,
  TrendingUp,
  Newspaper,
  Film,
  X,
  Send,
  Check,
  Calendar,
  Clock,
  MapPin,
  Thermometer,
  Zap,
} from "lucide-react";
import { ButterflySwarm } from "./ButterflySwarm";
import { KarishmaMascot } from "./KarishmaMascot";
import exploreImg from "../assets/images/explore_panoramic_strip.jpg";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: "tech" | "world" | "science" | "culture" | "finance";
  categoryLabel: string;
  timeAgo: string;
  summary: string;
  readTime: string;
  badgeColor: string;
  gradientBg: string;
  fullStory: string;
}

export interface ReelItem {
  id: string;
  title: string;
  creator: string;
  views: string;
  initialLikes: number;
  songTitle: string;
  duration: string;
  gradient: string;
  tags: string[];
  description: string;
}

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
  genre: string;
  coverGradient: string;
  freqPattern: number[];
}

export interface WeatherData {
  city: string;
  country: string;
  tempC: number;
  condition: string;
  icon: "sun" | "cloud" | "rain";
  humidity: number;
  windKm: number;
  aqi: number;
  uv: number;
  sunset: string;
  advice: string;
  forecast: { day: string; tempC: number; icon: "sun" | "cloud" | "rain" }[];
}

/* ------------------------------------------------------------------ *
 * Curated Live Data
 * ------------------------------------------------------------------ */

const WEATHER_CITIES: Record<string, WeatherData> = {
  Kolkata: {
    city: "Kolkata",
    country: "India",
    tempC: 28,
    condition: "Tropical Twilight Breeze",
    icon: "cloud",
    humidity: 72,
    windKm: 14,
    aqi: 58,
    uv: 4,
    sunset: "5:18 PM",
    advice: "Warm, gentle evening in the city of joy. Perfect for a cup of masala chai and brainstorming creative ideas with Karishma! ☕✨",
    forecast: [
      { day: "Mon", tempC: 28, icon: "cloud" },
      { day: "Tue", tempC: 29, icon: "sun" },
      { day: "Wed", tempC: 27, icon: "rain" },
      { day: "Thu", tempC: 26, icon: "rain" },
      { day: "Fri", tempC: 28, icon: "cloud" },
    ],
  },
  Tokyo: {
    city: "Tokyo",
    country: "Japan",
    tempC: 17,
    condition: "Crisp Starry Evening",
    icon: "sun",
    humidity: 48,
    windKm: 12,
    aqi: 22,
    uv: 2,
    sunset: "4:42 PM",
    advice: "Clear skies over Shinjuku. Great night for focused coding, synthwave playlists, and quiet reflection. 🗼🌙",
    forecast: [
      { day: "Mon", tempC: 17, icon: "sun" },
      { day: "Tue", tempC: 18, icon: "sun" },
      { day: "Wed", tempC: 15, icon: "cloud" },
      { day: "Thu", tempC: 14, icon: "rain" },
      { day: "Fri", tempC: 16, icon: "sun" },
    ],
  },
  "San Francisco": {
    city: "San Francisco",
    country: "USA",
    tempC: 15,
    condition: "Mild Bay Fog & Sunshine",
    icon: "cloud",
    humidity: 64,
    windKm: 22,
    aqi: 28,
    uv: 3,
    sunset: "5:04 PM",
    advice: "Cool coastal breeze rolling in. A warm hoodie and tea will keep you cozy while we automate your tasks! 🌉💜",
    forecast: [
      { day: "Mon", tempC: 15, icon: "cloud" },
      { day: "Tue", tempC: 16, icon: "sun" },
      { day: "Wed", tempC: 17, icon: "sun" },
      { day: "Thu", tempC: 15, icon: "cloud" },
      { day: "Fri", tempC: 14, icon: "rain" },
    ],
  },
  London: {
    city: "London",
    country: "UK",
    tempC: 12,
    condition: "Gentle Autumn Drizzle",
    icon: "rain",
    humidity: 82,
    windKm: 18,
    aqi: 32,
    uv: 1,
    sunset: "4:22 PM",
    advice: "Classic misty London drizzle outside. Stay indoors, listen to our lo-fi playlist, and let me summarize your reading list! 🌧️📖",
    forecast: [
      { day: "Mon", tempC: 12, icon: "rain" },
      { day: "Tue", tempC: 11, icon: "rain" },
      { day: "Wed", tempC: 13, icon: "cloud" },
      { day: "Thu", tempC: 12, icon: "cloud" },
      { day: "Fri", tempC: 14, icon: "sun" },
    ],
  },
  "New York": {
    city: "New York",
    country: "USA",
    tempC: 14,
    condition: "Brisk Manhattan Twilight",
    icon: "sun",
    humidity: 52,
    windKm: 16,
    aqi: 38,
    uv: 3,
    sunset: "4:48 PM",
    advice: "The city that never sleeps is bustling. Keep your pacing steady and let me keep track of your active projects! 🏙️✨",
    forecast: [
      { day: "Mon", tempC: 14, icon: "sun" },
      { day: "Tue", tempC: 13, icon: "cloud" },
      { day: "Wed", tempC: 15, icon: "sun" },
      { day: "Thu", tempC: 11, icon: "rain" },
      { day: "Fri", tempC: 12, icon: "cloud" },
    ],
  },
};

const TRENDING_NEWS: NewsItem[] = [
  {
    id: "n1",
    title: "Next-Gen Reasoning Architecture Bridges Intuition and Logic in Complex Engineering",
    source: "TechRadar Pro",
    category: "tech",
    categoryLabel: "Tech & AI",
    timeAgo: "14m ago",
    summary:
      "A breakthrough multimodal reasoning framework demonstrates autonomous verification loops, drastically eliminating hallucinations in full-stack code and mathematical proofs.",
    readTime: "3 min read",
    badgeColor: "var(--k2)",
    gradientBg: "linear-gradient(135deg, #a855f7, #6366f1)",
    fullStory:
      "Researchers have unveiled an adaptive hybrid reasoning model that balances fast intuitive token generation with rigorous multi-step self-verification. By simulating internal peer critique before outputting conclusions, the model achieves unprecedented reliability across systems architecture and formal verification tasks.",
  },
  {
    id: "n2",
    title: "James Webb Telescope Discovers Atmospheric Water Vapor on Habitable-Zone Exoplanet",
    source: "Space Science Gazette",
    category: "science",
    categoryLabel: "Space & Science",
    timeAgo: "48m ago",
    summary:
      "Spectroscopic data from Webb reveals unmistakable water vapor and carbon signatures on LP 791-18d, a temperate rocky world located 86 light-years away.",
    readTime: "4 min read",
    badgeColor: "var(--k3)",
    gradientBg: "linear-gradient(135deg, #0284c7, #38bdf8)",
    fullStory:
      "Astronomers analyzing infrared transmission spectra have detected clouds and significant atmospheric column density on a nearby rocky planet. The discovery marks a landmark milestone in the quest to identify potentially habitable worlds beyond our solar system.",
  },
  {
    id: "n3",
    title: "The Renaissance of Claymorphism: How Tactile Pastel Interfaces Are Humanizing AI Tools",
    source: "Design & UX Weekly",
    category: "culture",
    categoryLabel: "Design & Culture",
    timeAgo: "1h ago",
    summary:
      "Move over sterile flat design. Designers worldwide are adopting warm claymorphic surfaces, tactile shadows, and pastel palettes to make daily interactions friendlier.",
    readTime: "2 min read",
    badgeColor: "var(--k1)",
    gradientBg: "linear-gradient(135deg, #ec4899, #f472b6)",
    fullStory:
      "Tactile depth, rounded squircle geometry, and soft ambient reflections are reclaiming the web. By marrying digital responsiveness with organic physical cues, applications like Karishma are demonstrating that modern software can feel welcoming, playful, and deeply calming.",
  },
  {
    id: "n4",
    title: "Global Clean Energy Grid Sets Record With 72% Renewable Generation in October",
    source: "Bloomberg Green",
    category: "world",
    categoryLabel: "World & Climate",
    timeAgo: "2h ago",
    summary:
      "Interconnected offshore wind corridors and advanced battery storage facilities enabled renewable sources to supply nearly three-quarters of regional European power demand.",
    readTime: "3 min read",
    badgeColor: "var(--k0)",
    gradientBg: "linear-gradient(135deg, #10b981, #059669)",
    fullStory:
      "A seasonal surge in North Sea offshore wind power coupled with grid-scale iron-air storage installations pushed renewable generation past historic milestones this month, providing resilient low-carbon baseload energy during peak autumn demand.",
  },
  {
    id: "n5",
    title: "Open-Source WebAssembly Runtimes Reach Native C++ Speed in Browser Environments",
    source: "Wired Tech",
    category: "tech",
    categoryLabel: "Tech & AI",
    timeAgo: "3h ago",
    summary:
      "SIMD optimizations and memory-efficient garbage collection allow complex neural networks and audio synthesizers to run smoothly at 60 FPS directly inside the browser.",
    readTime: "4 min read",
    badgeColor: "var(--k5)",
    gradientBg: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    fullStory:
      "WebAssembly 3.0 standards have unlocked SIMD parallelism and near-instant JIT execution across modern browsers. From local client-side encryption to live audio DSP, web apps now rival native desktop performance without requiring OS installations.",
  },
];

const TRENDING_REELS: ReelItem[] = [
  {
    id: "r1",
    title: "A day in the life of Karishma the robot 🤖💜",
    creator: "@karishma.ai",
    views: "1.4M",
    initialLikes: 142000,
    songTitle: "Tea & Chillhop • Karishma Beats",
    duration: "0:24",
    gradient: "linear-gradient(180deg, #c084fc 0%, #7c3aed 60%, #4c1d95 100%)",
    tags: ["#KarishmaAI", "#CuteRobot", "#Claymorphic", "#AILife"],
    description: "Brewing lavender cardamom tea, helping with code refactors, and listening to rain in the studio ✨",
  },
  {
    id: "r2",
    title: "POV: Coding at 2 AM in a rainy cyberpunk cafe 🌧️☕",
    creator: "@tokyo.wanderer",
    views: "890K",
    initialLikes: 98000,
    songTitle: "Midnight Monsoons • Sitar Lo-Fi",
    duration: "0:30",
    gradient: "linear-gradient(180deg, #38bdf8 0%, #0284c7 60%, #0f172a 100%)",
    tags: ["#LoFiCoding", "#MidnightVibes", "#RainAmbience", "#DevLife"],
    description: "The sound of rain against the neon glass window while debugging React state. Pure serenity.",
  },
  {
    id: "r3",
    title: "How claymorphic 3D UI is sculpted in real-time 🎨",
    creator: "@atelier.design",
    views: "640K",
    initialLikes: 71000,
    songTitle: "Claymorphic Dreams • Synthwave",
    duration: "0:18",
    gradient: "linear-gradient(180deg, #f472b6 0%, #db2777 60%, #831843 100%)",
    tags: ["#UIUX", "#Claymorphism", "#DesignInspo", "#CSSMagic"],
    description: "Stacking inset highlights, radial drop shadows, and soft lavender surfaces for that squishy tactile feel.",
  },
  {
    id: "r4",
    title: "When the autonomous agent writes unit tests with 100% coverage 🚀",
    creator: "@dev.speedrun",
    views: "1.1M",
    initialLikes: 115000,
    songTitle: "Cyber Butterfly • Future Bass",
    duration: "0:22",
    gradient: "linear-gradient(180deg, #34d399 0%, #059669 60%, #064e3b 100%)",
    tags: ["#TypeScript", "#CodingMeme", "#AIEdge", "#CleanCode"],
    description: "That feeling when all 42 tests pass on the first compile run without any console warnings!",
  },
];

const TRENDING_SONGS: SongTrack[] = [
  {
    id: "s1",
    title: "Midnight Monsoons",
    artist: "Karishma & Kolkata Lo-Fi Collective",
    durationSec: 194,
    genre: "Chillhop / Sitar Ambient",
    coverGradient: "linear-gradient(135deg, #a855f7, #ec4899)",
    freqPattern: [261.63, 329.63, 392.0, 493.88], // C major 7 / Am chords
  },
  {
    id: "s2",
    title: "Claymorphic Dreams",
    artist: "Atelier Synthwave Lab",
    durationSec: 168,
    genre: "Retro Synth & Ambient Piano",
    coverGradient: "linear-gradient(135deg, #38bdf8, #818cf8)",
    freqPattern: [293.66, 349.23, 440.0, 523.25], // Dm7 chords
  },
  {
    id: "s3",
    title: "Tea with Karishma",
    artist: "Cozy Robot Acoustic",
    durationSec: 135,
    genre: "Acoustic Warmth & Music Box",
    coverGradient: "linear-gradient(135deg, #f472b6, #fb923c)",
    freqPattern: [349.23, 440.0, 523.25, 659.25], // Fmaj7 chords
  },
  {
    id: "s4",
    title: "Neon Kolkata Twilight",
    artist: "Bengali Fusion Odyssey",
    durationSec: 200,
    genre: "Electro-Acoustic Fusion",
    coverGradient: "linear-gradient(135deg, #c084fc, #3b82f6)",
    freqPattern: [220.0, 261.63, 329.63, 392.0], // Am7 chords
  },
  {
    id: "s5",
    title: "Cyber Butterfly Serenade",
    artist: "Hologram Beats",
    durationSec: 185,
    genre: "Future Ambient Bass",
    coverGradient: "linear-gradient(135deg, #34d399, #06b6d4)",
    freqPattern: [392.0, 493.88, 587.33, 698.46], // G7 chords
  },
];

const VIRAL_HASHTAGS = [
  { tag: "#AICompanionLife", count: "2.4M", category: "AI & Future" },
  { tag: "#ClaymorphicUI", count: "1.8M", category: "Design" },
  { tag: "#KolkataTwilight", count: "950K", category: "Culture" },
  { tag: "#MidnightCoding", count: "780K", category: "Tech" },
  { tag: "#LoFiStudyBeats", count: "620K", category: "Music" },
  { tag: "#SpaceXLaunch", count: "510K", category: "Science" },
];

/* ------------------------------------------------------------------ *
 * Component Props
 * ------------------------------------------------------------------ */

interface ExplorePageProps {
  onSendToChat?: (prompt: string) => void;
  onToast?: (msg: string) => void;
}

export function ExplorePage({ onSendToChat, onToast }: ExplorePageProps) {
  // Navigation & filter state
  const [activeTab, setActiveTab] = useState<"all" | "news" | "reels" | "music" | "weather" | "topics">("all");
  const [searchQ, setSearchQ] = useState("");
  const [newsCategory, setNewsCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("Kolkata");
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");

  // Reels interactive viewer state
  const [activeReel, setActiveReel] = useState<ReelItem | null>(null);
  const [reelPlaying, setReelPlaying] = useState(true);
  const [reelLikes, setReelLikes] = useState<Record<string, { count: number; liked: boolean }>>(() => {
    const init: Record<string, { count: number; liked: boolean }> = {};
    TRENDING_REELS.forEach((r) => {
      init[r.id] = { count: r.initialLikes, liked: false };
    });
    return init;
  });
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<string[]>([
    "Karishma's little bow and tea cup are so adorable! 💜",
    "Where can I find this exact color palette? Stunning UI!",
    "Listening to this on repeat while finishing my project.",
  ]);

  // Real Web Audio Synthesizer for Trending Music Player
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);

  // Web Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const synthTimerRef = useRef<number | null>(null);

  // Active track
  const currentTrack = TRENDING_SONGS[currentTrackIndex];

  // News story modal
  const [activeNewsStory, setActiveNewsStory] = useState<NewsItem | null>(null);

  // Stop synthesizer on unmount
  useEffect(() => {
    return () => {
      stopSynthesizer();
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  // Web Audio Synthesizer: Generates cozy lo-fi chords in real time
  const startSynthesizer = (track: SongTrack) => {
    stopSynthesizer();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : volume * 0.12, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // Filter for warm lo-fi tone
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.connect(masterGain);

      // Create gentle polyphonic chord
      const freqs = track.freqPattern;
      const oscs: OscillatorNode[] = [];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        // Slight subtle vibrato
        osc.detune.setValueAtTime(idx * 4 - 6, ctx.currentTime);
        osc.connect(filter);
        osc.start();
        oscs.push(osc);
      });
      oscNodesRef.current = oscs;

      // Progress bar simulation
      setAudioProgress(0);
      synthTimerRef.current = window.setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            handleNextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, track.durationSec * 10);
    } catch {
      // Audio autoplay may be constrained; graceful state handling
    }
  };

  const stopSynthesizer = () => {
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    oscNodesRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    oscNodesRef.current = [];
  };

  const togglePlayMusic = (index?: number) => {
    if (typeof index === "number" && index !== currentTrackIndex) {
      setCurrentTrackIndex(index);
      setIsPlayingMusic(true);
      startSynthesizer(TRENDING_SONGS[index]);
      onToast?.(`Now Playing: ${TRENDING_SONGS[index].title} 🎵`);
      return;
    }

    if (isPlayingMusic) {
      stopSynthesizer();
      setIsPlayingMusic(false);
      onToast?.("Paused music");
    } else {
      setIsPlayingMusic(true);
      startSynthesizer(currentTrack);
      onToast?.(`Playing: ${currentTrack.title} 🎵`);
    }
  };

  const handleNextTrack = () => {
    const nextIdx = (currentTrackIndex + 1) % TRENDING_SONGS.length;
    setCurrentTrackIndex(nextIdx);
    if (isPlayingMusic) {
      startSynthesizer(TRENDING_SONGS[nextIdx]);
    }
    onToast?.(`Next: ${TRENDING_SONGS[nextIdx].title}`);
  };

  const handlePrevTrack = () => {
    const prevIdx = (currentTrackIndex - 1 + TRENDING_SONGS.length) % TRENDING_SONGS.length;
    setCurrentTrackIndex(prevIdx);
    if (isPlayingMusic) {
      startSynthesizer(TRENDING_SONGS[prevIdx]);
    }
    onToast?.(`Previous: ${TRENDING_SONGS[prevIdx].title}`);
  };

  // Toggle Reel Like
  const toggleReelLike = (reelId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReelLikes((prev) => {
      const current = prev[reelId] || { count: 1000, liked: false };
      const nextLiked = !current.liked;
      return {
        ...prev,
        [reelId]: {
          liked: nextLiked,
          count: current.count + (nextLiked ? 1 : -1),
        },
      };
    });
  };

  // Post comment in Reel Viewer
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setComments((prev) => [commentInput.trim(), ...prev]);
    setCommentInput("");
    onToast?.("Comment posted! 💜");
  };

  // Weather data for selected city
  const weather = WEATHER_CITIES[selectedCity] || WEATHER_CITIES.Kolkata;
  const displayTemp = (tempC: number) => {
    if (tempUnit === "F") {
      return `${Math.round((tempC * 9) / 5 + 32)}°F`;
    }
    return `${tempC}°C`;
  };

  // Filtered News
  const filteredNews = useMemo(() => {
    return TRENDING_NEWS.filter((n) => {
      const matchCat = newsCategory === "all" || n.category === newsCategory;
      const matchSearch =
        !searchQ.trim() ||
        n.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        n.summary.toLowerCase().includes(searchQ.toLowerCase()) ||
        n.source.toLowerCase().includes(searchQ.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [newsCategory, searchQ]);

  // Filtered Reels
  const filteredReels = useMemo(() => {
    return TRENDING_REELS.filter((r) => {
      return (
        !searchQ.trim() ||
        r.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        r.creator.toLowerCase().includes(searchQ.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(searchQ.toLowerCase()))
      );
    });
  }, [searchQ]);

  // Filtered Songs
  const filteredSongs = useMemo(() => {
    return TRENDING_SONGS.filter((s) => {
      return (
        !searchQ.trim() ||
        s.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.genre.toLowerCase().includes(searchQ.toLowerCase())
      );
    });
  }, [searchQ]);

  return (
    <section className="mp tp">
      {/* Floating Cloud Backdrops */}
      <div className="cloud mp-cl mp-c1" />
      <div className="cloud mp-cl mp-c2" />

      {/* Header with Karishma Mascot */}
      <header
        className="mp-h mp-rise flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ "--i": 0 } as React.CSSProperties}
      >
        <div className="flex items-center gap-4">
          <div className="mp-tile" style={{ background: "linear-gradient(135deg,#ec4899,#8b5cf6)" }}>
            <Compass className="i text-white" />
          </div>
          <div>
            <h1>
              Explore &amp; Discover <Sparkles className="i tp-sparkle-inline text-purple-400" />
            </h1>
            <p>Live weather, global trending news, viral reels, top chart songs &amp; real-time cultural buzz.</p>
          </div>
        </div>
        <div className="self-center md:self-auto flex items-center pr-2">
          <KarishmaMascot size="compact" className="compact" greeting="Here's what's trending worldwide today! 🌍✨" />
        </div>
      </header>

      {/* Breaking News Ticker */}
      <div className="exp-ticker mp-rise" style={{ "--i": 1 } as React.CSSProperties}>
        <span className="exp-ticker-live">
          <span className="exp-ticker-dot" /> LIVE TRENDING
        </span>
        <span className="truncate text-stone-700 dark:text-stone-300">
          🔥 <b>Breaking:</b> {TRENDING_NEWS[0].title}
        </span>
        <button
          className="ml-auto text-xs text-purple-600 dark:text-purple-300 font-bold hover:underline flex-shrink-0 cursor-pointer"
          onClick={() => {
            onSendToChat?.(`What are the key implications of this news: "${TRENDING_NEWS[0].title}"?`);
            onToast?.("Sent news query to Karishma Chat!");
          }}
        >
          Discuss with Karishma →
        </button>
      </div>

      {/* Search & Explore Category Navigation */}
      <div className="tp-controls-bar mp-rise" style={{ "--i": 2 } as React.CSSProperties}>
        <div className="tp-search-box">
          <Search className="i tp-search-icon" />
          <input
            type="text"
            placeholder="Search trending news, reels, songs, weather cities..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="tp-search-input"
          />
          {searchQ && (
            <button className="tp-clear-btn" onClick={() => setSearchQ("")}>
              <X className="i" />
            </button>
          )}
        </div>

        {/* Real-world Content Categories */}
        <div className="tp-categories-scroll">
          {(
            [
              ["all", "🌟 All Trending"],
              ["news", "📰 Trending News"],
              ["reels", "🎬 Viral Reels"],
              ["music", "🎵 Top Songs"],
              ["weather", "🌤️ Live Weather"],
              ["topics", "🔥 Viral Buzz"],
            ] as const
          ).map(([id, label]) => (
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

      {/* ============================================================= *
       * SECTION 1: LIVE WEATHER HUB
       * ============================================================= */}
      {(activeTab === "all" || activeTab === "weather") && (
        <div className="mb-8 mp-rise" style={{ "--i": 3 } as React.CSSProperties}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="mp-sec !m-0">
              <CloudSun className="i text-amber-500" />
              Live Weather &amp; Ambient Radar
            </h2>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl bg-black/5 dark:bg-white/10 p-1 border border-black/5 dark:border-white/10 text-xs font-bold">
                <button
                  className={`px-2.5 py-1 rounded-lg transition-all ${tempUnit === "C" ? "bg-purple-600 text-white shadow-xs" : "text-stone-600 dark:text-stone-400"}`}
                  onClick={() => setTempUnit("C")}
                >
                  °C
                </button>
                <button
                  className={`px-2.5 py-1 rounded-lg transition-all ${tempUnit === "F" ? "bg-purple-600 text-white shadow-xs" : "text-stone-600 dark:text-stone-400"}`}
                  onClick={() => setTempUnit("F")}
                >
                  °F
                </button>
              </div>
            </div>
          </div>

          {/* City Selector Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3">
            {Object.keys(WEATHER_CITIES).map((cName) => (
              <button
                key={cName}
                onClick={() => setSelectedCity(cName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCity === cName
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-white/70 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 border-stone-200/50 dark:border-stone-700/50 hover:bg-white"
                }`}
              >
                📍 {cName}
              </button>
            ))}
          </div>

          {/* Weather Hero Card */}
          <div className="exp-weather-card">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Main Weather Display */}
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-white shadow-md flex-shrink-0 animate-pulse">
                  {weather.icon === "sun" ? (
                    <Sun className="w-10 h-10" />
                  ) : weather.icon === "rain" ? (
                    <CloudRain className="w-10 h-10" />
                  ) : (
                    <CloudSun className="w-10 h-10" />
                  )}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-stone-900 dark:text-white">
                      {displayTemp(weather.tempC)}
                    </span>
                    <span className="text-sm font-semibold text-stone-500 dark:text-stone-400">
                      {weather.city}, {weather.country}
                    </span>
                  </div>
                  <div className="text-base font-bold text-purple-700 dark:text-purple-300 mt-0.5">
                    {weather.condition}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-3">
                    <span>💧 Humidity: {weather.humidity}%</span>
                    <span>💨 Wind: {weather.windKm} km/h</span>
                  </div>
                </div>
              </div>

              {/* Atmospheric Details Grid */}
              <div className="grid grid-cols-3 gap-3 text-center border-y lg:border-y-0 lg:border-x border-stone-200/60 dark:border-stone-700/60 py-3 lg:py-0 lg:px-4">
                <div className="p-2 rounded-2xl bg-white/40 dark:bg-stone-800/40">
                  <div className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-bold">
                    AQI Air Quality
                  </div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {weather.aqi}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">Healthy • Clean</div>
                </div>
                <div className="p-2 rounded-2xl bg-white/40 dark:bg-stone-800/40">
                  <div className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-bold">
                    UV Index
                  </div>
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {weather.uv}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">Moderate</div>
                </div>
                <div className="p-2 rounded-2xl bg-white/40 dark:bg-stone-800/40">
                  <div className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-bold">
                    Sunset Time
                  </div>
                  <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">
                    {weather.sunset}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">Golden Hour</div>
                </div>
              </div>

              {/* Karishma's AI Weather Advice */}
              <div className="flex flex-col justify-between h-full bg-white/50 dark:bg-stone-800/50 p-4 rounded-2xl border border-purple-200/40 dark:border-purple-900/30">
                <div className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                  <b>Karishma's Weather Tip:</b>
                  <p className="mt-1">{weather.advice}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold">
                    {weather.forecast.map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-stone-700/60 text-[10px]">
                        {f.day}: {displayTemp(f.tempC)}
                      </span>
                    ))}
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer flex-shrink-0"
                    onClick={() => {
                      onSendToChat?.(`What should I wear and plan today given ${weather.city}'s weather (${weather.tempC}°C, ${weather.condition})?`);
                      onToast?.("Sent weather question to Karishma!");
                    }}
                  >
                    Ask Karishma
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= *
       * SECTION 2: TRENDING REELS & SHORTS
       * ============================================================= */}
      {(activeTab === "all" || activeTab === "reels") && (
        <div className="mb-8 mp-rise" style={{ "--i": 4 } as React.CSSProperties}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="mp-sec !m-0">
              <Film className="i text-pink-500" />
              Trending Reels &amp; Creative Shorts
            </h2>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">
              Top Viral Clips Worldwide
            </span>
          </div>

          <div className="exp-reels-grid">
            {filteredReels.map((reel) => {
              const likeState = reelLikes[reel.id] || { count: reel.initialLikes, liked: false };
              return (
                <div
                  key={reel.id}
                  className="exp-reel-card group"
                  style={{ background: reel.gradient }}
                  onClick={() => {
                    setActiveReel(reel);
                    setReelPlaying(true);
                  }}
                >
                  {/* Backdrop Gradient Artwork & Shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30 pointer-events-none" />

                  {/* Top Badge: Duration & Audio */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 text-white text-xs">
                    <span className="px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md font-mono text-[10px]">
                      {reel.duration}
                    </span>
                    <button
                      className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md cursor-pointer transition-transform active:scale-90"
                      onClick={(e) => toggleReelLike(reel.id, e)}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${likeState.liked ? "fill-pink-500 text-pink-500" : "text-white"}`}
                      />
                    </button>
                  </div>

                  {/* Center Floating Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none group-hover:scale-110 transition-transform">
                    <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/50 text-white">
                      <Play className="w-5 h-5 ml-0.5 fill-white" />
                    </div>
                  </div>

                  {/* Bottom Metadata */}
                  <div className="absolute bottom-3 left-3 right-3 z-10 text-white">
                    <div className="text-[11px] font-bold text-pink-300 drop-shadow-sm truncate">
                      {reel.creator}
                    </div>
                    <div className="text-xs font-semibold leading-snug line-clamp-2 mt-0.5 drop-shadow-md">
                      {reel.title}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-white/80">
                      <span>👁️ {reel.views}</span>
                      <span className={likeState.liked ? "text-pink-300 font-bold" : ""}>
                        ♥ {likeState.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= *
       * SECTION 3: TRENDING SONGS & INTERACTIVE AUDIO PLAYER
       * ============================================================= */}
      {(activeTab === "all" || activeTab === "music") && (
        <div className="mb-8 mp-rise" style={{ "--i": 5 } as React.CSSProperties}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="mp-sec !m-0">
              <Music className="i text-purple-500" />
              Trending Music &amp; Lo-Fi Audio Lounge
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">
                Synthesized Melodies via Web Audio API
              </span>
            </div>
          </div>

          <div className="exp-music-player">
            {/* Active Song Control Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-5 pb-5 border-b border-stone-200/60 dark:border-stone-700/60">
              {/* Current Track Info with Animated Equalizer */}
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                  style={{ background: currentTrack.coverGradient }}
                >
                  <Disc3 className={`w-7 h-7 ${isPlayingMusic ? "animate-spin" : ""}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-stone-900 dark:text-white truncate">
                    {currentTrack.title}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-300 font-medium truncate">
                    {currentTrack.artist}
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {currentTrack.genre}
                  </div>
                </div>
              </div>

              {/* Player Controls */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3">
                  <button
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                    onClick={handlePrevTrack}
                    title="Previous Track"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button
                    className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
                    onClick={() => togglePlayMusic()}
                    title={isPlayingMusic ? "Pause Melody" : "Play Melody"}
                  >
                    {isPlayingMusic ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-white" />}
                  </button>
                  <button
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                    onClick={handleNextTrack}
                    title="Next Track"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                {/* Animated Equalizer Waveform */}
                <div className="flex items-end gap-1 h-5 mt-2">
                  {[...Array(12)].map((_, idx) => (
                    <span
                      key={idx}
                      className="exp-eq-bar"
                      style={{
                        animationPlayState: isPlayingMusic ? "running" : "paused",
                        animationDelay: `${idx * 0.1}s`,
                        height: isPlayingMusic ? undefined : "4px",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Volume & Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    setIsMuted(false);
                    if (gainNodeRef.current && audioCtxRef.current) {
                      gainNodeRef.current.gain.setValueAtTime(v * 0.12, audioCtxRef.current.currentTime);
                    }
                  }}
                  className="w-20 accent-purple-600 cursor-pointer"
                  title="Volume"
                />
                <button
                  className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
                  onClick={() => {
                    onSendToChat?.(`Recommend 3 songs with the same vibe and mood as "${currentTrack.title}" (${currentTrack.genre})`);
                    onToast?.("Asked Karishma for music recommendations! 🎧");
                  }}
                >
                  Ask Karishma
                </button>
              </div>
            </div>

            {/* Track Playlist Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredSongs.map((song, idx) => {
                const isSelected = idx === currentTrackIndex;
                return (
                  <div
                    key={song.id}
                    onClick={() => togglePlayMusic(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-purple-100/80 dark:bg-purple-950/40 border-purple-300/80 dark:border-purple-800/80 shadow-xs"
                        : "bg-white/50 dark:bg-stone-800/50 border-stone-200/40 dark:border-stone-700/40 hover:bg-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                        style={{ background: song.coverGradient }}
                      >
                        {isSelected && isPlayingMusic ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5 fill-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 dark:text-white truncate">
                          {song.title}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                          {song.artist}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-stone-500 font-medium">
                      {Math.floor(song.durationSec / 60)}:{(song.durationSec % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= *
       * SECTION 4: TRENDING GLOBAL & TECH NEWS
       * ============================================================= */}
      {(activeTab === "all" || activeTab === "news") && (
        <div className="mb-8 mp-rise" style={{ "--i": 6 } as React.CSSProperties}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h2 className="mp-sec !m-0">
              <Newspaper className="i text-indigo-500" />
              Trending News &amp; Breakthroughs ({filteredNews.length})
            </h2>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                ["all", "All News"],
                ["tech", "Tech & AI"],
                ["science", "Science"],
                ["culture", "Culture"],
                ["world", "World"],
              ].map(([cid, clabel]) => (
                <button
                  key={cid}
                  onClick={() => setNewsCategory(cid)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                    newsCategory === cid
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white/60 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 border-stone-200/50 hover:bg-white"
                  }`}
                >
                  {clabel}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNews.map((news) => (
              <div key={news.id} className="exp-news-card group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-white shadow-xs"
                      style={{ background: news.gradientBg }}
                    >
                      {news.categoryLabel}
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {news.timeAgo}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 dark:text-white leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                    {news.title}
                  </h3>

                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mt-2 line-clamp-3">
                    {news.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/50 dark:border-stone-700/50 flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-medium font-mono text-[11px]">
                    📰 {news.source} • {news.readTime}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-[11px] cursor-pointer transition-colors"
                      onClick={() => setActiveNewsStory(news)}
                    >
                      Read Story
                    </button>
                    <button
                      className="p-1 rounded-lg text-purple-600 hover:bg-purple-100/60 cursor-pointer"
                      title="Ask Karishma to analyze this"
                      onClick={() => {
                        onSendToChat?.(`Please give me an executive summary and analysis of this breaking news: "${news.title}" from ${news.source}.`);
                        onToast?.("Sent news story to Karishma Chat!");
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= *
       * SECTION 5: VIRAL BUZZ & HASHTAG RADAR
       * ============================================================= */}
      {(activeTab === "all" || activeTab === "topics") && (
        <div className="mb-8 mp-rise" style={{ "--i": 7 } as React.CSSProperties}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="mp-sec !m-0">
              <Flame className="i text-orange-500" />
              Viral Buzz &amp; Trending Topics
            </h2>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">
              Live Mentions Across the Web
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {VIRAL_HASHTAGS.map((item, idx) => (
              <button
                key={idx}
                className="p-3.5 rounded-2xl bg-white/70 dark:bg-stone-800/70 border border-stone-200/50 dark:border-stone-700/50 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 hover:-translate-y-1 transition-all text-left cursor-pointer group"
                onClick={() => {
                  onSendToChat?.(`What's currently happening with ${item.tag} and why is it trending with ${item.count} mentions?`);
                  onToast?.(`Exploring ${item.tag}!`);
                }}
              >
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  #{idx + 1} • {item.category}
                </div>
                <div className="text-xs font-bold text-purple-700 dark:text-purple-300 mt-1 truncate group-hover:underline">
                  {item.tag}
                </div>
                <div className="text-[11px] text-stone-500 font-semibold mt-1">
                  🔥 {item.count}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= *
       * BOTTOM PANORAMIC ART STRIP (Celestial Map Room & Observatory)
       * ============================================================= */}
      <div className="tp-land mp-rise" style={{ "--i": 9 } as React.CSSProperties}>
        <img
          src={exploreImg}
          alt="Karishma's Celestial Map Room and Astrolabe Observatory at Twilight"
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
        <span className="tp-land-badge">
          <Compass className="i" />
          Celestial Exploration Hub • Live Pulse &amp; Horizon
        </span>
      </div>

      <ButterflySwarm />

      {/* ============================================================= *
       * MODAL 1: REELS VIEWER MODAL
       * ============================================================= */}
      {activeReel && (
        <div className="tp-modal-overlay" onClick={() => setActiveReel(null)}>
          <div
            className="tp-modal-card card max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tp-modal-header">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                  style={{ background: activeReel.gradient }}
                >
                  🎬
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white">
                    {activeReel.title}
                  </h3>
                  <span className="text-xs text-purple-600 dark:text-purple-300 font-semibold">
                    {activeReel.creator} • {activeReel.songTitle}
                  </span>
                </div>
              </div>
              <button className="tp-modal-close-btn" onClick={() => setActiveReel(null)}>
                ✕
              </button>
            </div>

            {/* Reel Video Simulation Canvas */}
            <div
              className="relative w-full aspect-[9/12] rounded-3xl overflow-hidden shadow-inner flex flex-col justify-between p-5 text-white my-3"
              style={{ background: activeReel.gradient }}
            >
              <div className="flex items-center justify-between z-10">
                <span className="px-2.5 py-1 rounded-xl bg-black/40 backdrop-blur-md text-xs font-mono font-bold">
                  {activeReel.duration} • 4K HDR
                </span>
                <button
                  className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md cursor-pointer"
                  onClick={() => setReelPlaying(!reelPlaying)}
                >
                  {reelPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
                </button>
              </div>

              {/* Animated Floating Bubbles / Sparks in Reel */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md animate-ping" />
              </div>

              <div className="z-10 bg-black/35 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
                <p className="text-xs font-medium leading-relaxed">{activeReel.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {activeReel.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] font-bold text-pink-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Comments & Actions */}
            <div className="space-y-3 mt-3">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-300 px-1">
                <span>💬 Comments ({comments.length})</span>
                <button
                  className="text-purple-600 dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
                  onClick={() => {
                    onSendToChat?.(`What do you think about this viral video concept: "${activeReel.title}"?`);
                    setActiveReel(null);
                    onToast?.("Sent reel to Karishma for discussion!");
                  }}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Discuss with Karishma
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {comments.map((c, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800/60 text-xs text-stone-700 dark:text-stone-300 leading-relaxed"
                  >
                    {c}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Leave a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Post
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= *
       * MODAL 2: FULL NEWS STORY MODAL
       * ============================================================= */}
      {activeNewsStory && (
        <div className="tp-modal-overlay" onClick={() => setActiveNewsStory(null)}>
          <div className="tp-modal-card card max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="tp-modal-header">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                  style={{ background: activeNewsStory.gradientBg }}
                >
                  📰
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white leading-snug">
                    {activeNewsStory.title}
                  </h3>
                  <span className="text-xs text-purple-600 dark:text-purple-300 font-semibold">
                    {activeNewsStory.source} • {activeNewsStory.timeAgo}
                  </span>
                </div>
              </div>
              <button className="tp-modal-close-btn" onClick={() => setActiveNewsStory(null)}>
                ✕
              </button>
            </div>

            <div className="my-3 space-y-3">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 text-xs text-purple-900 dark:text-purple-200 leading-relaxed font-medium">
                <b>Executive Summary:</b> {activeNewsStory.summary}
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-stone-800/70 border border-stone-200/60 dark:border-stone-700/60 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {activeNewsStory.fullStory}
              </div>
            </div>

            <div className="tp-modal-footer flex items-center justify-between gap-3">
              <span className="text-xs text-stone-500 font-mono">
                Verified Global Reporting
              </span>
              <button
                className="tp-handoff-btn"
                onClick={() => {
                  onSendToChat?.(
                    `Analyze this news story from ${activeNewsStory.source}: "${activeNewsStory.title}". What are the biggest pros, cons, and future projections?`
                  );
                  setActiveNewsStory(null);
                  onToast?.("Sent news analysis request to Karishma!");
                }}
              >
                <Sparkles className="i" /> Analyze with Karishma
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
