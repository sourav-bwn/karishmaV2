import React, { useState, useEffect, useRef, useCallback } from "react";
import Markdown from "react-markdown";
import { readNotes, memoryStorageKey } from "./lib/memory";

import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Shield,
  RefreshCw,
  Trash2,
  Download,
  Check,
  CircleAlert,
  CircleHelp,
  Globe,
  FileText,
  User,
  Send,
  Square,
  Sparkles,
  ChevronRight,
  ChevronDown,
  LogOut,
  Settings,
  X,
  Brain,
  Zap,
  Smile,
  Bell,
  Paperclip,
  Search,
  MessageCircle,
  ChevronLeft,
  History,
  Palette,
  Sun,
  Moon,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  Mail,
  Instagram,
  Plus,
  Image as ImageIcon,
  Camera,
  Folder,
  ShieldCheck,
} from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import LoginPage from "./components/LoginPage";
import AccountPage from "./components/AccountPage";
import { selfHealingSystem, getCustomApiHeaders } from "./lib/selfHealing";
import {
  isNativePlatform,
  isGoogleAuthAvailable,
  renderGoogleButton,
  nativeGoogleIdToken,
  nativeGoogleSignOut,
} from "./lib/googleAuth";
import { SelfHealingStatusModal } from "./components/SelfHealingStatusModal";
import {
  subscribeToUserConversations,
  getCleanUserId,
  saveConversationToCloud,
  deleteConversationFromCloud,
  syncAllLocalSessionsToCloud,
  flushPendingSyncQueue as flushFirebaseQueue,
  mergeSyncMessages,
  SyncChatSession
} from "./lib/firebase";
import { normalizeBanglishForTTS } from "./utils/banglishVoiceNormalizer";
import "./styles/karishma-ui.css";
import { KarishmaMascot } from "./components/KarishmaMascot";
import { MemoryPage } from "./components/MemoryPage";
import { ToolsPage } from "./components/ToolsPage";
import { AgentsPage } from "./components/AgentsPage";
import { StudioPage } from "./components/StudioPage";
import { FilesPage } from "./components/FilesPage";
import { ProjectsPage } from "./components/ProjectsPage";
import { ExplorePage } from "./components/ExplorePage";
import { AttachmentPreview } from "./components/AttachmentPreview";
import { authClient as neonAuthClient } from "./lib/neonAuth";
import {
  ButterflySvg,
  AvatarFallback,
  NAV_ITEMS,
  VIEW_BLURB,
  QUICK_CARDS,
  WISDOM_LIST,
  QUICK_TOOLS,
  type UIView,
} from "./components/KarishmaBits";

export const safeLocalStorageGet = (key: string): string | null => {
  if (!key || typeof key !== "string") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const safeLocalStorageSet = (key: string, value: string): void => {
  if (!key || typeof key !== "string") return;
  try {
    localStorage.setItem(key, value ?? "");
  } catch (e) {
    console.warn("localStorage write failed (QuotaExceeded or restricted storage):", e);
  }
};

export const safeLocalStorageRemove = (key: string): void => {
  if (!key || typeof key !== "string") return;
  try {
    localStorage.removeItem(key);
  } catch { }
};

export const getUserStorageKey = (
  prefix: string,
  user: { id?: string; email?: string } | null,
  isGuest: boolean
): string | null => {
  if (!prefix) return null;
  if (safeLocalStorageGet("best_friend_retention_policy") === "session" && /saved_chats|chat_history|sync_queue/.test(prefix)) return null;
  const rawId = user?.id?.trim() || (user?.email?.trim() ? `usr_${user.email.trim()}` : "");
  if (rawId) {
    const uid = rawId.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
    return `${prefix}_user_${uid}`;
  }
  if (isGuest) {
    let guestUid = safeLocalStorageGet("best_friend_guest_uid");
    if (!guestUid) {
      guestUid = "guest_" + Math.random().toString(36).substring(2, 10);
      safeLocalStorageSet("best_friend_guest_uid", guestUid);
    }
    return `${prefix}_guest_${guestUid}`;
  }
  return null;
};

const HistoryMenuIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    className={className}
  >
    <line x1="6" y1="10" x2="18" y2="10" />
    <line x1="6" y1="16" x2="12" y2="16" />
  </svg>
);

/**
 * "Continue with Google" control used by the auth gate and the account drawer.
 *
 * Web: renders Google's official GIS button (their branding rules require it)
 * into a container div; the ID token arrives via callback.
 * Native (Android APK): renders an app-styled card that runs the OS-level
 * Google flow through @capacitor-firebase/authentication.
 * Both paths hand the same ID token to `onCredential`.
 */
const GoogleSignIn = ({ onCredential, onError, disabled }: { onCredential: (idToken: string) => void; onError: (message: string) => void; disabled?: boolean }) => {
  const webButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isNativePlatform() && isGoogleAuthAvailable()) {
      renderGoogleButton(
        webButtonRef.current!,
        (idToken) => { if (!cancelled) onCredential(idToken); }
      ).catch((err) => { if (!cancelled) onError(err?.message || "Google sign-in failed to load."); });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isGoogleAuthAvailable()) {
    return (
      <div className="w-full p-4 bg-[#FAF8F5] border border-[#EBE6DD] rounded-2xl flex items-center gap-4 text-left">
        <div className="w-11 h-11 bg-[#FAF0E6] rounded-xl flex items-center justify-center shrink-0">
          <CircleAlert className="w-5 h-5 text-[#D96B43]" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-[#2C2A29]">Google sign-in unavailable</div>
          <div className="text-xs text-[#8C857E]">Guest-only MVP. Use Continue as Guest below.</div>
        </div>
      </div>
    );
  }

  if (isNativePlatform()) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={async () => {
          try {
            const idToken = await nativeGoogleIdToken();
            onCredential(idToken);
          } catch (err: any) {
            onError(err?.message || "Google sign-in failed.");
          }
        }}
        className="w-full p-4 bg-white hover:bg-[#FAF8F5] border border-[#DFD9D0] hover:border-[#D96B43] rounded-2xl transition-all cursor-pointer flex items-center gap-4 text-left group disabled:opacity-50"
      >
        <div className="w-11 h-11 bg-white border border-[#EBE6DD] rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <GoogleLogo />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-[#2C2A29]">Continue with Google</div>
          <div className="text-xs text-[#8C857E]">Sign in or create an account instantly</div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#8C857E] group-hover:text-[#D96B43] group-hover:translate-x-0.5 transition-all" />
      </button>
    );
  }

  return <div ref={webButtonRef} className="w-full flex justify-center min-h-[44px] items-center" />;
};

/** Google "G" mark (brand guidelines: four-color logo on a white chip). */
const GoogleLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

export interface AIModel {
  id: string;
  name: string;
  desc: string;
  speed: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface AIProvider {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  models: AIModel[];
}

export const MODEL_PROVIDERS: AIProvider[] = [
  {
    id: "nemotron",
    name: "Nemotron",
    tagline: "NVIDIA High-Performance Reasoning",
    badge: "PRIMARY",
    icon: Brain,
    models: [
      { id: "nvidia/nemotron-3-ultra-550b-a55b", name: "Nemotron 3 Ultra 550B", desc: "Flagship frontier reasoning & orchestration", speed: "High", icon: Brain },
      { id: "nvidia/nemotron-3-super-120b-a12b", name: "Nemotron 3 Super 120B", desc: "High-throughput complex agentic reasoning", speed: "High", icon: Brain },
      { id: "nvidia/nemotron-nano-3-30b-a3b", name: "Nemotron Nano 3 30B", desc: "Fast efficient Mixture-of-Experts", speed: "Very High", icon: Zap },
      { id: "nvidia/nemotron-3.5-lightning-30b-a3b", name: "Nemotron 3.5 Lightning 30B", desc: "Ultra-fast low-latency reasoning", speed: "Ultra", icon: Zap },
      { id: "nvidia/nemotron-3.5-bolt-e4b", name: "Nemotron 3.5 Bolt E4B", desc: "Ultra-compact fast edge inference", speed: "Ultra", icon: Zap },
      { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", name: "Nemotron 3 Nano Omni 30B", desc: "Multimodal perception & omni-reasoning", speed: "High", icon: Globe },
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    tagline: "Google AI & Multimodal Models",
    badge: "GOOGLE",
    icon: Sparkles,
    models: [
      { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", desc: "Fast & intelligent multimodal chat", speed: "Very High", icon: Zap },
      { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", desc: "Advanced reasoning & frontier intelligence", speed: "High", icon: Brain },
      { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", desc: "High-speed multimodal reasoning", speed: "Very High", icon: Zap },
      { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", desc: "Ultra-fast low-latency chat", speed: "Ultra", icon: Zap },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", desc: "High precision deep reasoning", speed: "High", icon: Brain },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Lightweight efficient model", speed: "Very High", icon: Zap },
    ],
  },
  // NOTE: GPT/Llama via OpenRouter removed — Nemotron is NVIDIA-direct only.
  // Re-add only if OPENROUTER_API_KEY is configured again.
];

export const CONFIGURED_MODELS = MODEL_PROVIDERS.flatMap((p) => p.models);

const getShortModelName = (modelId: string) => {
  const found = CONFIGURED_MODELS.find(m => m.id === modelId);
  return found ? found.name : modelId;
};

interface AttachmentData {
  name: string;
  type: string;
  dataUrl: string;
  size?: number;
  isImage?: boolean;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export interface SpeechLanguageOption {
  code: string;
  label: string;
  native: string;
  flag: string;
}

export const SPEECH_LANGUAGES: SpeechLanguageOption[] = [
  { code: "bn-IN", label: "Bengali (India)", native: "বাংলা (ভারত)", flag: "🇮🇳" },
  { code: "en-IN", label: "English (India)", native: "English (India)", flag: "🇮🇳" },
  { code: "hi-IN", label: "Hindi (India)", native: "हिन्दी (भारत)", flag: "🇮🇳" },
  { code: "en-US", label: "English (US)", native: "English (US)", flag: "🇺🇸" },
];

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  reasoning?: string;
  citations?: Array<{ title: string; uri: string }>;
  isEncrypted?: boolean;
  reactions?: string[];
  feedback?: "like" | "dislike" | null;
  modelUsed?: string;
  imageAttachment?: AttachmentData;
  generatedImage?: {
    url: string;
    prompt: string;
  };
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  updatedAt?: string;
  messages: Message[];
  mode?: string;
}

function App() {
  const [userName, setUserName] = useState(() => {
    const name = localStorage.getItem("best_friend_user_name") || "";
    return name;
  });
  const [userNickname, setUserNickname] = useState(() => {
    return localStorage.getItem("best_friend_nickname") || localStorage.getItem("best_friend_user_name") || "";
  });
  const [userFullName, setUserFullName] = useState(() => {
    return localStorage.getItem("best_friend_full_name") || "";
  });

  // Profile Edit state inside Account Panel
  const [editFullName, setEditFullName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [showEditNames, setShowEditNames] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Secure Encryption state
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("BEST_FRIEND_E2EE_KEY");
  const [showDecrypted, setShowDecrypted] = useState(true);

  // Multi-Factor Authentication (MFA) state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaStep, setMfaStep] = useState<"idle" | "setup" | "verify" | "active">("idle");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [mfaChallengePassed, setMfaChallengePassed] = useState(true);
  const [mfaChallengeInput, setMfaChallengeInput] = useState("");

  // Privacy and retention state
  const [retentionPolicy, setRetentionPolicy] = useState<"session" | "local">("local");
  const [dataSharing, setDataSharing] = useState(false);

  // UI States
  const [showKeyEditor, setShowKeyEditor] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showModelSwitcher, setShowModelSwitcher] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [loggedInUser, setLoggedInUser] = useState<{ id?: string, fullName?: string, nickname?: string, name?: string, email: string, avatarUrl?: string } | null>(null);
  const [sessionChecking, setSessionChecking] = useState(true);

  // Mandatory Authentication step state
  //
  // These two initializers are the app's entry gate, so they use the safe
  // wrappers rather than raw localStorage: a throw inside a useState initializer
  // (private mode, WebView with storage disabled) would abort the very first
  // render and blank the whole app, not just the auth screen.
  const [authCompleted, setAuthCompleted] = useState(() => safeLocalStorageGet("best_friend_is_guest") === "true");
  const [isGuest, setIsGuest] = useState(() => {
    return safeLocalStorageGet("best_friend_is_guest") === "true";
  });

  // Shared sign-in completion. Exchanges a backend session ({user, token}) for
  // the same localStorage state the password login used to write, so the rest
  // of the app (per-user storage keys, cloud history load) needs no changes.
  const applyAuthSuccess = useCallback((data: { user: any; token?: string }) => {
    const userData = { ...data.user };
    localStorage.setItem("mock_logged_in_user", JSON.stringify(userData));
    localStorage.setItem("best_friend_is_guest", "false");
    localStorage.setItem("auth_step_completed", "true");
    if (userData.nickname) {
      setUserNickname(userData.nickname);
      localStorage.setItem("best_friend_nickname", userData.nickname);
    }
    if (userData.fullName) {
      setUserFullName(userData.fullName);
      localStorage.setItem("best_friend_full_name", userData.fullName);
    }
    const convName = userData.nickname || userData.fullName || userData.email?.split("@")[0] || "Friend";
    setUserName(convName);
    localStorage.setItem("best_friend_user_name", convName);

    setLoggedInUser(userData);
    setIsGuest(false);
    setAuthCompleted(true);

    // Clean slate before the cloud history load for the signed-in account.
    setChatHistoryList([]);
    setMessages([]);
    setCurrentChatId(crypto.randomUUID());
  }, []);

  // Only a server-verified HttpOnly cookie restores a signed-in account.
  // The local profile cache is display data, never proof of authentication.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    fetch("/api/auth/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", signal: controller.signal })
      .then(async res => {
        if (!res.ok) { safeLocalStorageRemove("mock_logged_in_user"); return; }
        const data = await res.json();
        if (data.success && data.user) {
          safeLocalStorageSet("mock_logged_in_user", JSON.stringify(data.user));
          safeLocalStorageSet("best_friend_is_guest", "false");
          setLoggedInUser(data.user); setIsGuest(false); setAuthCompleted(true);
        }
      })
      .catch(() => { safeLocalStorageRemove("mock_logged_in_user"); })
      .finally(() => { clearTimeout(timer); setSessionChecking(false); });
    return () => { clearTimeout(timer); controller.abort(); };
  }, []);

  // Google Sign-In: the ID token from GIS (web) or the native plugin (APK) is
  // verified and exchanged for a session by POST /api/auth/google. Signup is
  // implicit -- the backend creates the account on first sign-in.
  const handleGoogleCredential = useCallback(async (credential?: string, accessToken?: string) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, accessToken }),
      });
      // The backend always answers with JSON, but a misconfigured frontend
      // (e.g. this app hosted on a static host without the backend mounted)
      // gets an HTML/plain-text 404 instead. Parse defensively so the panel
      // shows the real problem rather than a cryptic JSON syntax error.
      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(
          res.ok
            ? "The server returned an unreadable sign-in response."
            : `Sign-in service unreachable (HTTP ${res.status}). Check the API base URL configuration.`
        );
      }
      if (!res.ok) throw new Error(data?.error || "Google sign-in failed.");
      if (!data.success || !data.user) throw new Error("Unexpected sign-in response.");
      applyAuthSuccess({ user: data.user, token: data.token });
    } catch (err: any) {
      setAuthError(err.message || "Google sign-in failed.");
    } finally {
      setAuthLoading(false);
    }
  }, [applyAuthSuccess]);

  // Shared POST helper for the password login / register forms on the login
  // page. The backend always answers with JSON, but a misconfigured frontend
  // (e.g. hosted on a static host without the backend mounted) gets an
  // HTML/plain-text 404 instead -- parse defensively so the form shows the
  // real problem rather than a cryptic JSON syntax error.
  const postAuthJson = useCallback(async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      throw new Error(
        res.ok
          ? "The server returned an unreadable response."
          : `Authentication service unreachable (HTTP ${res.status}). Check the API base URL configuration.`
      );
    }
    return { ok: res.ok, data };
  }, []);

  const handlePasswordLogin = useCallback(async (identifier: string, password: string) => {
    setAuthError("Use the Google button to sign in. Email/password login is not available."); return;
    setAuthLoading(true);
    setAuthError("");
    try {
      if (import.meta.env.VITE_NEON_AUTH_URL && identifier.includes("@")) {
        const result = await neonAuthClient.signIn.email({
          email: identifier.trim().toLowerCase(),
          password,
        });
        if (result.data?.user) {
          const user = result.data.user;
          applyAuthSuccess({
            user: {
              id: user.id,
              email: user.email,
              name: user.name || identifier.split("@")[0],
              fullName: user.name || "",
              nickname: "",
            },
            token: (result.data as any).token || (result.data as any).session?.token || "neon-auth-token",
          });
          return;
        } else if (result.error && !result.error.message?.includes("fetch")) {
          throw new Error(result.error.message || "Invalid email or password.");
        }
      }

      // Accounts key on email; the field keeps the mockup's "Email or
      // Username" placeholder and is passed through as the email identifier.
      const { ok, data } = await postAuthJson("/api/auth/login", { email: identifier, password });
      if (!ok) throw new Error(data?.error || "Login failed.");
      if (!data.success || !data.user || !data.token) throw new Error("Unexpected login response.");
      applyAuthSuccess({ user: data.user, token: data.token });
    } catch (err: any) {
      setAuthError(err.message || "Login failed.");
    } finally {
      setAuthLoading(false);
    }
  }, [applyAuthSuccess, postAuthJson]);

  const handleRegister = useCallback(async (fullName: string, email: string, password: string) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      if (import.meta.env.VITE_NEON_AUTH_URL) {
        const result = await neonAuthClient.signUp.email({
          email: email.trim().toLowerCase(),
          password,
          name: fullName.trim(),
        });
        if (result.error) {
          throw new Error(result.error.message || "Registration failed.");
        }
        if (result.data?.user) {
          const user = result.data.user;
          applyAuthSuccess({
            user: {
              id: user.id,
              email: user.email,
              name: user.name || fullName,
              fullName: user.name || fullName,
              nickname: "",
            },
            token: (result.data as any).token || (result.data as any).session?.token || "neon-auth-token",
          });
          return;
        }
      }

      const { ok, data } = await postAuthJson("/api/auth/register", { fullName, email, password });
      if (!ok) throw new Error(data?.error || "Account creation failed.");
      if (!data.success || !data.user || !data.token) throw new Error("Unexpected registration response.");
      applyAuthSuccess({ user: data.user, token: data.token });
    } catch (err: any) {
      setAuthError(err.message || "Account creation failed.");
    } finally {
      setAuthLoading(false);
    }
  }, [applyAuthSuccess, postAuthJson]);

  // Guest entry from the login page. React state is set BEFORE any storage
  // call. localStorage throws in private mode, when a WebView has storage
  // disabled, or on quota exhaustion -- and a raw throw here used to abort
  // this handler after setLoggedInUser(null) but before setAuthCompleted(true),
  // stranding the user on the login screen. State first, then best-effort
  // persistence via the file's own safe wrappers, means the tap always works.
  const handleGuestContinue = useCallback(() => {
    const guestName =
      (userName ||
        safeLocalStorageGet("best_friend_user_name") ||
        safeLocalStorageGet("best_friend_nickname") ||
        "").trim() || "Guest";

    setLoggedInUser(null);
    setIsGuest(true);
    setAuthCompleted(true);
    setUserName(guestName);
    setUserNickname(guestName);
    setChatHistoryList([]);
    setMessages([]);
    setCurrentChatId(crypto.randomUUID());
    setAuthError("");

    safeLocalStorageRemove("mock_logged_in_user");
    safeLocalStorageSet("best_friend_is_guest", "true");
    safeLocalStorageSet("auth_step_completed", "true");
    safeLocalStorageSet("onboarding_completed", "true");
    safeLocalStorageSet("best_friend_user_name", guestName);
    safeLocalStorageSet("best_friend_nickname", guestName);
  }, [userName]);

  // Sync names with loggedInUser
  useEffect(() => {
    if (loggedInUser) {
      const nick = loggedInUser.nickname?.trim();
      const full = loggedInUser.fullName?.trim();

      if (nick) {
        setUserNickname(nick);
        localStorage.setItem("best_friend_nickname", nick);
      }
      if (full) {
        setUserFullName(full);
        localStorage.setItem("best_friend_full_name", full);
      }

      // Rule: Do not use Full Name as conversational name unless user has not provided a Nickname.
      const conversationalName = nick || full || loggedInUser.email?.split("@")[0] || "Friend";
      setUserName(conversationalName);
      localStorage.setItem("best_friend_user_name", conversationalName);
    }
  }, [loggedInUser?.id, loggedInUser?.nickname, loggedInUser?.fullName, loggedInUser?.email]);

  // Chat History & Real-Time Sync state
  const [currentChatId, setCurrentChatId] = useState<string>(() => crypto.randomUUID());
  const prevUserKeyRef = useRef<string | null>(null);
  const [chatHistoryList, setChatHistoryList] = useState<ChatSession[]>([]);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "failed">("synced");
  const [pendingSyncQueue, setPendingSyncQueue] = useState<ChatSession[]>(() => {
    try {
      const raw = localStorage.getItem("best_friend_sync_queue");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [showSelfHealingModal, setShowSelfHealingModal] = useState(false);
  const [selfHealingNotification, setSelfHealingNotification] = useState<string | null>(null);

  // Model state
  const [selectedModel, setSelectedModel] = useState("server-configured model");
  const [publicDemo, setPublicDemo] = useState(false);
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem("karishma_mvp_access_token") || "");
  const [connectionInfo, setConnectionInfo] = useState("Checking server configuration...");
  useEffect(() => { fetch("/api/config").then(r=>r.json()).then(c=>{ setPublicDemo(Boolean(c.publicDemo)); setSelectedModel(c.model || "not configured"); setConnectionInfo(`${c.mode}: ${c.model || "no model"}. ${c.configured ? "Configured, not yet verified by a real reply." : "No model configured."} Browser-only storage, no cloud account.`); }).catch(()=>setConnectionInfo("Backend unavailable. Build the app and run npm start.")); }, []);


  // Attachment state
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentData | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // AI Image Illustration Transformation state
  const [isTransformingIllustration, setIsTransformingIllustration] = useState(false);
  const [transformedIllustrationUrl, setTransformedIllustrationUrl] = useState<string | null>(null);
  const [illustrationError, setIllustrationError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Response Mode state
  const [responseMode, setResponseMode] = useState<"detailed" | "quick">(() => {
    const stored = localStorage.getItem("best_friend_response_mode");
    return stored === "quick" ? "quick" : "detailed";
  });

  // Theme state: "normal" | "light" | "dark"
  const [themeMode, setThemeMode] = useState<"normal" | "light" | "dark">(() => {
    const stored = localStorage.getItem("best_friend_theme");
    if (stored === "light" || stored === "dark" || stored === "normal") {
      return stored;
    }
    return "normal";
  });

  // Theme plumbing for the claymorphic shell: the shell reads [data-theme],
  // while the overlay panels keep using the legacy theme-* classes.
  // "normal" resolves against the OS preference and keeps following it live.
  const [resolvedDark, setResolvedDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = themeMode === "normal" ? (mq.matches ? "dark" : "light") : themeMode;
      const root = document.documentElement;
      root.classList.remove("theme-normal", "theme-light", "theme-dark");
      root.classList.add(`theme-${resolved}`);
      root.dataset.theme = resolved;
      setResolvedDark(resolved === "dark");
    };
    apply();
    mq.addEventListener("change", apply);
    localStorage.setItem("best_friend_theme", themeMode);
    return () => mq.removeEventListener("change", apply);
  }, [themeMode]);

  // Pre-fetch Web Speech API voices
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);


  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ---- Claymorphic shell (karishma-ui) state & handlers ----
  const [activeView, setActiveView] = useState<UIView>("Chat");
  const [sideCollapsed, setSideCollapsed] = useState(() => safeLocalStorageGet("karishma_side_collapsed") === "1");
  const [s2Collapsed, setS2Collapsed] = useState(() => safeLocalStorageGet("karishma_s2_collapsed") === "1");
  const [colorMode, setColorMode] = useState<"pink" | "blue">(() => (safeLocalStorageGet("karishma_color") === "blue" ? "blue" : "pink"));
  const [toastMsg, setToastMsg] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    document.documentElement.dataset.color = colorMode;
    safeLocalStorageSet("karishma_color", colorMode);
  }, [colorMode]);
  // Mockup v5 draws .mem on .main and .vmem on body while the Memory view is up
  useEffect(() => {
    document.body.classList.toggle("vmem", activeView === "Memory");
    document.body.classList.toggle("vtools", activeView === "Tools" || activeView === "Agents" || activeView === "Studio" || activeView === "Files" || activeView === "Projects" || activeView === "Explore");
    return () => {
      document.body.classList.remove("vmem");
      document.body.classList.remove("vtools");
    };
  }, [activeView]);
  useEffect(() => { safeLocalStorageSet("karishma_side_collapsed", sideCollapsed ? "1" : "0"); }, [sideCollapsed]);
  useEffect(() => { safeLocalStorageSet("karishma_s2_collapsed", s2Collapsed ? "1" : "0"); }, [s2Collapsed]);

  // Auto-grow the composer textarea (mockup fit() helper)
  useEffect(() => {
    const el = chatInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [userInput]);

  const uiToast = (t: string) => {
    setToastMsg(t);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(""), 1800);
  };

  // Smooth recolor for theme/color flips (mockup swap() helper)
  useEffect(() => {
    if (["Agents", "Studio", "Files", "Projects", "Tools", "Explore"].includes(activeView)) uiToast("Original UI preview: this screen contains sample content. Chat and Memory are the working MVP features.");
  }, [activeView]);

  const swapUi = (fn: () => void) => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { fn(); return; }
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition) { doc.startViewTransition(fn); return; }
    const h = document.documentElement;
    h.classList.add("kt");
    fn();
    setTimeout(() => h.classList.remove("kt"), 800);
  };

  const toggleTheme = () => {
    const next = resolvedDark ? "light" : "dark";
    swapUi(() => setThemeMode(next));
  };

  const toggleColor = () => {
    const next = colorMode === "pink" ? "blue" : "pink";
    swapUi(() => setColorMode(next));
    uiToast(next === "blue" ? "Blue theme" : "Pink theme");
  };

  // Ctrl/Cmd+K focuses the chat search field
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Start a fresh conversation
  const startNewChat = () => {
    setShowAccount(false);
    setActiveView("Chat");
    setMessages([]);
    setCurrentChatId(crypto.randomUUID());
    lastSavedSigRef.current = "";
    setUserInput("");
    setSelectedAttachment(null);
    setChatError(null);
    const activeChatIdKey = getUserStorageKey("best_friend_active_chat_id", loggedInUser, isGuest);
    if (activeChatIdKey) safeLocalStorageSet(activeChatIdKey, "");
  };

  // Open a previous conversation from the right panel / search
  const openSession = (sessionId: string) => {
    setShowAccount(false);
    const session = chatHistoryList.find(c => c.id === sessionId);
    if (!session) return;
    setActiveView("Chat");
    const msgs = session.messages || [];
    setCurrentChatId(session.id);
    setMessages(msgs);
    lastSavedSigRef.current = `${session.id}:${msgs.length}:${msgs[msgs.length - 1]?.id || ""}:${msgs[msgs.length - 1]?.text || ""}`;
    const activeChatIdKey = getUserStorageKey("best_friend_active_chat_id", loggedInUser, isGuest);
    if (activeChatIdKey) safeLocalStorageSet(activeChatIdKey, session.id);
  };


  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const currentReactions = m.reactions || [];
        if (currentReactions.includes(emoji)) {
          return { ...m, reactions: currentReactions.filter(r => r !== emoji) };
        } else {
          return { ...m, reactions: [...currentReactions, emoji] };
        }
      }
      return m;
    }));
  };

  // Message actions & Regeneration state
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechHeartbeatRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSendingRef = useRef<boolean>(false);
  const [regenerateTargetMsg, setRegenerateTargetMsg] = useState<Message | null>(null);
  const [regenModel, setRegenModel] = useState<string>("nvidia/nemotron-3-ultra-550b-a55b");
  const [keepOriginalInHistory, setKeepOriginalInHistory] = useState<boolean>(true);

  const stopAllAudio = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (speechHeartbeatRef.current) {
      clearInterval(speechHeartbeatRef.current);
      speechHeartbeatRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    activeUtteranceRef.current = null;
    setSpeakingMsgId(null);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopAllAudio();
    isSendingRef.current = false;
    setIsTyping(false);
  };

  // Voice Input (Speech-to-Text) state & handlers
  const [speechLang, setSpeechLang] = useState<string>(() => {
    const stored = localStorage.getItem("best_friend_speech_lang");
    if (stored && SPEECH_LANGUAGES.some(l => l.code === stored)) {
      return stored;
    }
    return "bn-IN";
  });
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechInterimText, setSpeechInterimText] = useState<string>("");
  const [speechAutoSend, setSpeechAutoSend] = useState<boolean>(() => {
    return localStorage.getItem("best_friend_speech_autosend") === "true";
  });
  const [showSpeechLangMenu, setShowSpeechLangMenu] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const speechBaseTextRef = useRef<string>("");
  const isSpeechActiveRef = useRef<boolean>(false);

  // ---------------------------------------------------------------------
  // Android hardware / gesture back button.
  //
  // src/lib/native.ts fires a cancelable "karishma:androidback" event from the
  // Capacitor shell. Calling preventDefault() tells it we consumed the press;
  // otherwise it falls back to history, then to press-again-to-exit.
  //
  // This adds no UI and does nothing in a browser, where the event never fires.
  // ---------------------------------------------------------------------
  useEffect(() => {
    const handleAndroidBack = (event: Event) => {
      // Ordered topmost-first, matching the render/z-index order below.
      const closers: Array<[boolean, () => void]> = [
        [showAttachmentMenu, () => setShowAttachmentMenu(false)],
        [showSpeechLangMenu, () => setShowSpeechLangMenu(false)],
        [showSelfHealingModal, () => setShowSelfHealingModal(false)],
        [Boolean(regenerateTargetMsg), () => setRegenerateTargetMsg(null)],
        [showModelSwitcher, () => setShowModelSwitcher(false)],
        [showEditNames, () => setShowEditNames(false)],
        [showClearConfirm, () => setShowClearConfirm(false)],
        [showPrivacyNotice, () => setShowPrivacyNotice(false)],
        [showKeyEditor, () => setShowKeyEditor(false)],
        [showAccount, () => setShowAccount(false)],
        [showSettings, () => setShowSettings(false)],
        [showHistoryPanel, () => setShowHistoryPanel(false)],
      ];

      const target = closers.find(([isOpen]) => isOpen);
      if (target) {
        target[1]();
        event.preventDefault();
      }
    };

    window.addEventListener("karishma:androidback", handleAndroidBack);
    return () => window.removeEventListener("karishma:androidback", handleAndroidBack);
  }, [
    showAttachmentMenu,
    showSpeechLangMenu,
    showSelfHealingModal,
    regenerateTargetMsg,
    showModelSwitcher,
    showEditNames,
    showClearConfirm,
    showPrivacyNotice,
    showKeyEditor,
    showAccount,
    showSettings,
    showHistoryPanel,
  ]);

  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    isSpeechActiveRef.current = false;
    setIsListening(false);
    setSpeechInterimText("");
  }, []);

  const startVoiceInput = useCallback((overrideLang?: string) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      setTimeout(() => setSpeechError(null), 6000);
      return;
    }

    // Stop any existing session
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    setSpeechError(null);
    setSpeechInterimText("");

    // Capture the existing text in input box as base text
    speechBaseTextRef.current = userInput ? (userInput.endsWith(" ") ? userInput : userInput + " ") : "";

    try {
      const recognition = new SpeechRecognition();
      const targetLang = overrideLang || speechLang;
      recognition.lang = targetLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isSpeechActiveRef.current = true;
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = 0; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const recognizedCurrent = finalTranscript ? finalTranscript + (interimTranscript ? " " + interimTranscript : "") : interimTranscript;
        const newText = (speechBaseTextRef.current + recognizedCurrent).trim();

        if (newText) {
          setUserInput(newText);
        }
        setSpeechInterimText(interimTranscript || finalTranscript);
      };

      recognition.onerror = (event: any) => {
        const err = event.error;
        console.warn("Speech recognition event error:", err);
        if (err === "no-speech") {
          return;
        }
        if (err === "not-allowed" || err === "service-not-allowed") {
          setSpeechError("Microphone permission denied. Please allow microphone access in browser settings.");
        } else if (err === "network") {
          setSpeechError("Network issue with speech service. Please verify your connection.");
        } else if (err === "audio-capture") {
          setSpeechError("No microphone detected or microphone is busy.");
        } else if (err !== "aborted") {
          setSpeechError(`Voice input error: ${err}`);
        }
        isSpeechActiveRef.current = false;
        setIsListening(false);
        setSpeechInterimText("");
        setTimeout(() => setSpeechError(null), 5000);
      };

      recognition.onend = () => {
        if (isSpeechActiveRef.current) {
          try {
            recognition.start();
            return;
          } catch {
            // ignore restart error and reset
          }
        }
        isSpeechActiveRef.current = false;
        setIsListening(false);
        setSpeechInterimText("");
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("SpeechRecognition startup error:", err);
      isSpeechActiveRef.current = false;
      setIsListening(false);
      setSpeechError(err?.message || "Failed to start speech recognition.");
      setTimeout(() => setSpeechError(null), 5000);
    }
  }, [speechLang, userInput]);

  const toggleVoiceInput = useCallback(() => {
    if (isListening || isSpeechActiveRef.current) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  }, [isListening, startVoiceInput, stopVoiceInput]);

  const handleSetSpeechLanguage = useCallback((newLang: string) => {
    setSpeechLang(newLang);
    localStorage.setItem("best_friend_speech_lang", newLang);
    setShowSpeechLangMenu(false);

    if (isListening || isSpeechActiveRef.current) {
      stopVoiceInput();
      setTimeout(() => {
        startVoiceInput(newLang);
      }, 150);
    }
  }, [isListening, startVoiceInput, stopVoiceInput]);

  // Clean up speech recognition on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Complete Privacy & Account Data Cleanup on Logout
  const handleLogout = useCallback(async () => {
    try {
      const result = await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", keepalive: true });
      if (!result.ok) throw new Error();
    } catch { setAuthError("Could not sign out. Reconnect and try again."); alert("Could not sign out. Reconnect and try again."); return; }

    // Best-effort: also end the OS-level Google session on the APK so the
    // next sign-in re-shows the account picker instead of silently reusing it.
    nativeGoogleSignOut();
    neonAuthClient.signOut().catch(() => { });

    // 1. Cancel active AI generation, speech synthesis, and audio playback
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    stopVoiceInput();
    setIsTyping(false);
    setSpeakingMsgId(null);

    // 2. Immediately clear in-memory conversations, active messages, attachments & inputs
    prevUserKeyRef.current = "logged_out";
    setChatHistoryList([]);
    setMessages([]);
    setCurrentChatId(crypto.randomUUID());
    setUserInput("");
    setSelectedAttachment(null);
    setChatError(null);
    setCopiedMsgId(null);
    setRegenerateTargetMsg(null);

    // 3. Reset input file element refs if present
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";

    // 4. Clear user names, profiles, and personalized memories in memory
    setUserName("");
    setUserNickname("");
    setUserFullName("");
    setEditFullName("");
    setEditNickname("");
    setProfileLoading(false);
    setProfileError("");
    setProfileSuccess("");

    // 5. Reset authentication & session state
    setLoggedInUser(null);
    setIsGuest(false);
    setAuthCompleted(false);
    setAuthError("");

    // 6. Reset UI popups & modals
    setShowAccount(false);
    setShowEditNames(false);
    setShowHistoryPanel(false);
    setShowSettings(false);
    setShowModelSwitcher(false);
    setShowClearConfirm(false);
    setShowPrivacyNotice(false);

    // 7. Reset background sync & self-healing queues
    setPendingSyncQueue([]);
    setSyncStatus("synced");

    // Keep per-account and guest browser data, but remove active identity.
    for (const key of ["mock_logged_in_user", "auth_step_completed", "best_friend_is_guest", "best_friend_user_name", "best_friend_nickname", "best_friend_full_name"]) safeLocalStorageRemove(key);

    // 9. Present clean logged-out welcome state
    setMessages([
      {
        id: "welcome-logout",
        role: "model",
        text: "You have logged out successfully. Please log in or continue as guest to start chatting.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, []);

  const isGeneratingOrSpeaking = isTyping || speakingMsgId !== null;

  const firstUserMsgIdx = messages.findIndex((m) => m.role === "user");
  const hasKarishmaReplied =
    firstUserMsgIdx !== -1 &&
    messages.slice(firstUserMsgIdx + 1).some((m) => m.role === "model");

  const cleanTextForSpeech = (rawText: string): string => {
    if (!rawText || typeof rawText !== "string") return "";

    let text = rawText;

    // 1. Remove code blocks (```...```)
    text = text.replace(/```[\s\S]*?```/g, " ");

    // 2. Extract content from inline code (`code` -> code)
    text = text.replace(/`([^`]+)`/g, "$1");

    // 3. Extract text from markdown links ([label](url) -> label)
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // 4. Remove URLs
    text = text.replace(/https?:\/\/\S+|www\.\S+/g, " ");

    // 5. Remove markdown formatting tags (*, _, #, ~, >, etc.)
    text = text.replace(/[#*_~>\\]/g, " ");

    // 6. Remove all emojis and unicode pictographs
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FA95}]|[\u{1F650}-\u{1F67F}]|[\u{200D}]|[\u{20E3}]|[\u{FE0F}]/gu;
    text = text.replace(emojiRegex, " ");

    // 7. Strip brackets and code symbols to spaces without stripping words or standard punctuation
    text = text.replace(/[{}[\]()<>\/\\|@$%^&+=~_\u2013\u2014]/g, " ");

    // 8. Normalize multiple punctuation marks
    text = text.replace(/!+/g, ".");
    text = text.replace(/।+/g, ".");
    text = text.replace(/\?+/g, "?");
    text = text.replace(/\.+/g, ".");
    text = text.replace(/,\s*,+/g, ",");

    // 9. Normalize whitespace
    text = text.replace(/\s+/g, " ").trim();

    return text;
  };

  const speakWithWebSpeech = (messageId: string, cleanText: string, rawText: string, hasBengali: boolean) => {
    if (!("speechSynthesis" in window)) {
      setSpeakingMsgId(null);
      return;
    }

    // Stop any ongoing speech and clear heartbeats
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (speechHeartbeatRef.current) {
      clearInterval(speechHeartbeatRef.current);
      speechHeartbeatRef.current = null;
    }
    window.speechSynthesis.cancel();
    activeUtteranceRef.current = null;

    if (!cleanText) {
      setSpeakingMsgId(null);
      return;
    }

    // 1. Warm, natural young adult female baseline parameters
    let basePitch = 1.05;
    let baseRate = 0.90;

    if (/[😢😭🥺😔💔😟]/u.test(rawText)) {
      basePitch = 1.00;
      baseRate = 0.85;
    } else if (/[😂🤣😜🤪😝]/u.test(rawText)) {
      basePitch = 1.08;
      baseRate = 0.94;
    } else if (/[😊🙂😄😁😃🌟✨]/u.test(rawText)) {
      basePitch = 1.06;
      baseRate = 0.90;
    } else if (/[❤️🥰😍💖💕💗]/u.test(rawText)) {
      basePitch = 1.05;
      baseRate = 0.88;
    }

    // 2. Strict Female-Only Voice Selection
    const voices = window.speechSynthesis.getVoices();

    const malePattern = /\b(male|guy|man|boy|mr|sir|david|mark|george|alex|daniel|fred|james|richard|stephen|brian|russell|oliver|ryan|thomas|paul|arthur|liam|noah|william|jack|charles|henry|edward|john|robert|michael|ravi|rishi|pradeep|madhav|suman|amit|manish|aravind|subir|rahul|deepak|anand|vikram|karan|rohit|raj|tarun|sanjay|ajay|albert|bruce|ralph|tom|shaun|junior|kangkang|pavel|stefan|diego|jorge|carlos|juan|mateo|santiago|lucas|leon|felix|yannick|hans|klaus|desktop)\b|[-_](m0|m1|m2|male)/i;
    const femalePattern = /\b(female|woman|girl|lady|samiksha|tanisha|ananya|moyna|puja|shruti|neerja|swara|veena|raveena|heera|priya|kavya|aditi|sangeeta|kajal|jenny|aria|sonia|ava|samantha|serena|victoria|karen|moira|fiona|tessa|zira|hazel|susan|stephanie|alva|allison|kendra|kimberly|joanna|ivy|salli|chloe|olivia|mia|sophia|emma|isabella|amelia|kalyani|kalpana|geeta|sita|radha)\b|[-_](f0|f1|f2|bnf|ene|fem|female)/i;

    const strictlyFemaleVoices = voices.filter(v => {
      const name = (v.name || "").toLowerCase();
      return femalePattern.test(name) && !malePattern.test(name);
    });

    const nonMaleVoices = voices.filter(v => {
      const name = (v.name || "").toLowerCase();
      return !malePattern.test(name);
    });

    const candidatePool = strictlyFemaleVoices.length > 0 ? strictlyFemaleVoices : (nonMaleVoices.length > 0 ? nonMaleVoices : voices);

    let chosenVoice: SpeechSynthesisVoice | undefined;
    let targetLang = hasBengali ? "bn-IN" : "en-IN";

    if (hasBengali) {
      chosenVoice =
        strictlyFemaleVoices.find(v => (/bn-in|bn-bd|bn/i.test(v.lang) || /bengali|bangla/i.test(v.name))) ||
        candidatePool.find(v => (/bn-in|bn-bd|bn/i.test(v.lang) || /bengali|bangla/i.test(v.name))) ||
        strictlyFemaleVoices.find(v => /neerja|swara|veena|raveena|priya|aditi/i.test(v.name)) ||
        strictlyFemaleVoices[0] ||
        candidatePool[0];
    } else {
      chosenVoice =
        strictlyFemaleVoices.find(v => /neerja.*natural|neerja|swara.*natural|swara/i.test(v.name)) ||
        strictlyFemaleVoices.find(v => (/en-in|hi-in/i.test(v.lang) && femalePattern.test(v.name))) ||
        strictlyFemaleVoices.find(v => /jenny|aria|sonia|ava|samantha|serena|victoria/i.test(v.name)) ||
        strictlyFemaleVoices[0] ||
        candidatePool.find(v => /en-in|en-gb|en-us/i.test(v.lang)) ||
        candidatePool[0];
    }

    if (!chosenVoice || !femalePattern.test(chosenVoice.name || "")) {
      basePitch = Math.max(basePitch, 1.15);
    }

    // 3. Sentence Boundary Splitting for natural pacing and buffer protection
    const rawChunks = cleanText
      .split(/(?<=[.?!;\n])\s+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const chunks: string[] = [];
    for (const chunk of rawChunks) {
      if (chunk.length > 200) {
        // Subdivide long sentences on commas or spaces so browser TTS never chokes
        const subParts = chunk.split(/(?<=[,])\s+/);
        for (const sub of subParts) {
          if (sub.trim()) chunks.push(sub.trim());
        }
      } else {
        chunks.push(chunk);
      }
    }

    if (chunks.length === 0) {
      setSpeakingMsgId(null);
      return;
    }

    setSpeakingMsgId(messageId);

    // Keep-alive heartbeat to prevent Chromium from pausing after 15s
    speechHeartbeatRef.current = setInterval(() => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 5000);

    let currentChunkIndex = 0;
    let isCancelled = false;

    const speakNextChunk = () => {
      if (isCancelled || currentChunkIndex >= chunks.length) {
        if (speechHeartbeatRef.current) {
          clearInterval(speechHeartbeatRef.current);
          speechHeartbeatRef.current = null;
        }
        activeUtteranceRef.current = null;
        setSpeakingMsgId(null);
        return;
      }

      const chunkText = chunks[currentChunkIndex];
      const utterance = new SpeechSynthesisUtterance(chunkText);
      activeUtteranceRef.current = utterance; // Prevent garbage collection mid-speech

      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang || targetLang;
      } else {
        utterance.lang = targetLang;
      }

      let chunkPitch = basePitch + (currentChunkIndex % 2 === 0 ? 0.01 : -0.01);
      if (chunkText.endsWith("?")) {
        chunkPitch += 0.03;
      }

      utterance.pitch = Math.min(Math.max(chunkPitch, 0.94), 1.18);
      utterance.rate = Math.min(Math.max(baseRate, 0.82), 0.96);

      utterance.onend = () => {
        currentChunkIndex++;
        if (currentChunkIndex < chunks.length && !isCancelled) {
          setTimeout(speakNextChunk, 120);
        } else {
          if (speechHeartbeatRef.current) {
            clearInterval(speechHeartbeatRef.current);
            speechHeartbeatRef.current = null;
          }
          activeUtteranceRef.current = null;
          setSpeakingMsgId(null);
        }
      };

      utterance.onerror = (e: any) => {
        // If canceled/interrupted by user, stop; otherwise continue to next chunk so text is never skipped
        if (e.error === "canceled" || e.error === "interrupted") {
          isCancelled = true;
          if (speechHeartbeatRef.current) {
            clearInterval(speechHeartbeatRef.current);
            speechHeartbeatRef.current = null;
          }
          activeUtteranceRef.current = null;
          setSpeakingMsgId(null);
        } else {
          currentChunkIndex++;
          if (currentChunkIndex < chunks.length) {
            setTimeout(speakNextChunk, 50);
          } else {
            if (speechHeartbeatRef.current) {
              clearInterval(speechHeartbeatRef.current);
              speechHeartbeatRef.current = null;
            }
            activeUtteranceRef.current = null;
            setSpeakingMsgId(null);
          }
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextChunk();
  };

  const handleReadAloud = (messageId: string, rawText: string) => {
    // If currently speaking this message, toggle off
    if (speakingMsgId === messageId) {
      stopAllAudio();
      return;
    }

    // Stop any ongoing speech or audio
    stopAllAudio();

    // Clean text for TTS
    const cleanText = cleanTextForSpeech(rawText);
    if (!cleanText) return;

    const hasBengali = /[\u0980-\u09FF]/.test(cleanText);
    speakWithWebSpeech(messageId, cleanText, rawText, hasBengali);
  };

  const handleToggleFeedback = (messageId: string, type: "like" | "dislike") => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const nextFeedback = m.feedback === type ? null : type;
        return { ...m, feedback: nextFeedback };
      }
      return m;
    }));
  };

  const handleCopyMessage = (messageId: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedMsgId(messageId);
    setTimeout(() => {
      setCopiedMsgId(prev => (prev === messageId ? null : prev));
    }, 2000);
  };

  const handleOpenRegenerateModal = (msg: Message) => {
    setRegenerateTargetMsg(msg);
    setRegenModel(msg.modelUsed || selectedModel || "gemini-3.6-flash");
    setKeepOriginalInHistory(true);
  };

  const executeRegeneration = async () => {
    if (isSendingRef.current || isTyping || !regenerateTargetMsg) return;
    isSendingRef.current = true;
    const targetMsg = regenerateTargetMsg;
    const chosenModel = regenModel;
    const keepOriginal = keepOriginalInHistory;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setRegenerateTargetMsg(null);
    setIsTyping(true);

    try {
      const targetIdx = messages.findIndex(m => m.id === targetMsg.id);
      let contextHistory = messages;
      if (targetIdx !== -1) {
        contextHistory = messages.slice(0, targetIdx);
      }

      const messagesPayload = contextHistory.slice(-10).map(m => ({
        role: m.role,
        text: m.text
      }));

      const newMsgId = "friend-" + Date.now();
      let hasStreamedContent = false;

      const result = await selfHealingSystem.selfHealChatCall(
        messagesPayload,
        chosenModel,
        responseMode,
        userName,
        undefined,
        undefined,
        controller.signal,
        (delta) => {
          hasStreamedContent = true;
          setMessages(prev => {
            const existing = prev.find(m => m.id === newMsgId);
            if (!existing) {
              const streamedMsg: Message = {
                id: newMsgId,
                role: "model",
                text: delta.text || "",
                reasoning: delta.reasoning || "",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isEncrypted: encryptionEnabled,
                modelUsed: chosenModel,
              };
              const idx = prev.findIndex(m => m.id === targetMsg.id);
              if (idx === -1) return [...prev, streamedMsg];
              const nextState = [...prev];
              if (keepOriginal) nextState.splice(idx + 1, 0, streamedMsg);
              else nextState[idx] = streamedMsg;
              return nextState;
            }
            return prev.map(m => {
              if (m.id !== newMsgId) return m;
              return {
                ...m,
                text: delta.text ? m.text + delta.text : m.text,
                reasoning: delta.reasoning ? (m.reasoning || "") + delta.reasoning : m.reasoning,
              };
            });
          });
        }
      );

      if (result) {
        setMessages(prev => {
          const existing = prev.find(m => m.id === newMsgId);
          if (!existing) {
            const newFriendMessage: Message = {
              id: newMsgId,
              role: "model",
              text: result.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              citations: result.citations,
              isEncrypted: encryptionEnabled,
              modelUsed: result.recoveredByModel || chosenModel,
              reasoning: result.reasoning,
            };
            const idx = prev.findIndex(m => m.id === targetMsg.id);
            if (idx === -1) return [...prev, newFriendMessage];
            const nextState = [...prev];
            if (keepOriginal) nextState.splice(idx + 1, 0, newFriendMessage);
            else nextState[idx] = newFriendMessage;
            return nextState;
          }
          return prev.map(m => {
            if (m.id !== newMsgId) return m;
            return {
              ...m,
              text: result.text || m.text,
              citations: result.citations,
              reasoning: result.reasoning || m.reasoning,
              modelUsed: result.recoveredByModel || chosenModel,
            };
          });
        });
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.message === "Generation cancelled by user.") {
        return;
      }
      console.error(err);
      setChatError(err.message || "Failed to regenerate response.");
    } finally {
      isSendingRef.current = false;
      setIsTyping(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };
  // Helper to load user-namespaced local chats
  const loadLocalUserChats = useCallback((user: { id?: string; email?: string } | null, guestFlag: boolean): ChatSession[] => {
    try {
      const storageKey = getUserStorageKey("best_friend_saved_chats", user, guestFlag);
      if (!storageKey) return [];

      const savedChatsEnc = safeLocalStorageGet(storageKey);
      if (!savedChatsEnc) return [];

      const parsed = savedChatsEnc.startsWith("[")
        ? JSON.parse(savedChatsEnc)
        : JSON.parse(decodeURIComponent(atob(savedChatsEnc)));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  // Welcome message and settings initialization on load
  useEffect(() => {
    // Purge unnamespaced legacy keys to prevent cross-account pollution
    safeLocalStorageRemove("best_friend_saved_chats");
    safeLocalStorageRemove("best_friend_chat_history");
    safeLocalStorageRemove("best_friend_sync_queue");

    const storedPolicy = safeLocalStorageGet("best_friend_retention_policy");
    const storedMfa = safeLocalStorageGet("best_friend_mfa_enabled");
    const storedKey = safeLocalStorageGet("best_friend_encryption_key");

    if (storedPolicy) setRetentionPolicy(storedPolicy as any);
    if (storedKey) setEncryptionKey(storedKey);
    if (false) {
      setMfaEnabled(true);
      setMfaChallengePassed(false);
    }

    setMessages([]);
  }, []);


  // Browser-local persistence adapter. No encryption or cloud service.
  const loggedInUserRef = useRef(loggedInUser);
  loggedInUserRef.current = loggedInUser;
  const isGuestRef = useRef(isGuest);
  isGuestRef.current = isGuest;
  const prepareSessionPayload = useCallback((session: ChatSession): ChatSession => session, []);

  // Save a session to Firebase Cloud Database with Self-Healing Recovery
  const syncSessionToCloud = useCallback(async (sessionToSync: ChatSession): Promise<boolean> => {
    const payload = prepareSessionPayload(sessionToSync);
    setSyncStatus("syncing");

    try {
      const targetUser = loggedInUserRef.current;
      const success = await selfHealingSystem.selfHealSaveToCloud(targetUser, payload as SyncChatSession);
      if (success) {
        setSyncStatus("synced");
        const queueKey = getUserStorageKey("best_friend_sync_queue", targetUser, isGuestRef.current);
        if (queueKey) {
          setPendingSyncQueue(prev => {
            const updated = prev.filter(s => s.id !== sessionToSync.id);
            localStorage.setItem(queueKey, JSON.stringify(updated));
            return updated;
          });
        }
        // Also sync to backend server DB as backup if logged in
        if (targetUser?.id) {
          fetch("/api/history/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: targetUser.id, session: payload })
          }).catch(() => { });
        }
        return true;
      } else {
        setSyncStatus("failed");
        return false;
      }
    } catch (err) {
      console.warn("Cloud save failed, queuing for offline retry:", err);
      setSyncStatus("failed");
      return false;
    }
  }, [prepareSessionPayload]);

  // Flush pending sync queue when connection restores
  const flushPendingSyncQueue = useCallback(async () => {
    setSyncStatus("syncing");
    try {
      const ok = await flushFirebaseQueue(loggedInUserRef.current);
      if (ok) {
        setSyncStatus("synced");
      } else {
        setSyncStatus("failed");
      }
    } catch (err) {
      console.warn("Failed to flush pending sync queue:", err);
      setSyncStatus("failed");
    }
  }, []);

  // Real-time synchronization subscription with Firebase Firestore & Account Data Isolation
  useEffect(() => {
    const userAccountKey = loggedInUser ? (loggedInUser.id || loggedInUser.email || "user") : (isGuest ? "guest" : "logged_out");
    const activeChatIdKey = getUserStorageKey("best_friend_active_chat_id", loggedInUser, isGuest);

    setSyncStatus("syncing");

    // Remove legacy unnamespaced keys to ensure zero cross-user pollution
    localStorage.removeItem("best_friend_saved_chats");
    localStorage.removeItem("best_friend_chat_history");
    localStorage.removeItem("best_friend_sync_queue");

    const storageKey = getUserStorageKey("best_friend_saved_chats", loggedInUser, isGuest);

    // Load initial local cache for THIS active user or guest
    const initialLocal = loadLocalUserChats(loggedInUser, isGuest);

    // On both initial load and account switches, restore only that identity's cache.
    if (prevUserKeyRef.current !== userAccountKey) {
      prevUserKeyRef.current = userAccountKey;
      setChatHistoryList(initialLocal);
      const savedId = activeChatIdKey ? safeLocalStorageGet(activeChatIdKey) : null;
      const target = initialLocal.find(s => s.id === savedId) || initialLocal[0];
      const nextId = target?.id || crypto.randomUUID();
      setCurrentChatId(nextId);
      setMessages(target?.messages || []);
      lastSavedSigRef.current = target ? `${target.id}:${target.messages.length}:${target.messages.at(-1)?.id || ""}:${target.messages.at(-1)?.text || ""}` : "";
      if (activeChatIdKey) safeLocalStorageSet(activeChatIdKey, nextId);
    } else if (initialLocal.length > 0) {
      setChatHistoryList(initialLocal);
    }

    // Fetch history from backend Express server if authenticated
    if (loggedInUser?.id) {
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUser.id })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.sessions)) {
            const serverSessions: ChatSession[] = data.sessions;
            setChatHistoryList(prev => {
              const map = new Map<string, ChatSession>();
              serverSessions.forEach(s => map.set(s.id, s));
              prev.forEach(s => {
                if (!map.has(s.id)) map.set(s.id, s);
              });
              const merged = Array.from(map.values());
              merged.sort((a, b) => new Date(b.updatedAt || b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
              if (storageKey) {
                try {
                  const encoded = btoa(encodeURIComponent(JSON.stringify(merged)));
                  localStorage.setItem(storageKey, encoded);
                } catch { }
              }
              return merged;
            });
          }
        })
        .catch(() => { });
    }

    // Subscribe to Firestore real-time updates for THIS user (or guest)
    const unsubscribe = subscribeToUserConversations(
      loggedInUser,
      (cloudSessions) => {
        setSyncStatus("synced");

        const processedSessions: ChatSession[] = cloudSessions.map((cloudSession) => {
          const decMsgs = cloudSession.messages || [];
          return {
            id: cloudSession.id,
            title: cloudSession.title,
            timestamp: cloudSession.timestamp,
            updatedAt: cloudSession.updatedAt,
            messages: decMsgs,
            mode: cloudSession.mode || "normal"
          };
        });

        processedSessions.sort((a, b) => new Date(b.updatedAt || b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

        if (storageKey) {
          try {
            const encoded = btoa(encodeURIComponent(JSON.stringify(processedSessions)));
            localStorage.setItem(storageKey, encoded);
          } catch { }
        }

        setChatHistoryList(processedSessions);
      },
      (err) => {
        console.warn("Real-time cloud sync error:", err);
        setSyncStatus("failed");
      }
    );

    const handleOnlineOrFocus = () => {
      flushPendingSyncQueue();
    };

    window.addEventListener("online", handleOnlineOrFocus);
    window.addEventListener("focus", handleOnlineOrFocus);

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
      window.removeEventListener("online", handleOnlineOrFocus);
      window.removeEventListener("focus", handleOnlineOrFocus);
    };
  }, [loggedInUser?.id, loggedInUser?.email, isGuest, encryptionKey]);

  // Immediate save on message sent/received
  const lastSavedSigRef = useRef<string>("");
  useEffect(() => {
    if (messages.length === 0 || !currentChatId) return;

    const firstUserMsg = messages.find(m => m.role === "user")?.text;
    if (!firstUserMsg) return; // Don't save empty/welcome-only temporary states as history items

    const msgSig = `${currentChatId}:${messages.length}:${messages[messages.length - 1]?.id || ""}:${messages[messages.length - 1]?.text || ""}`;
    if (lastSavedSigRef.current === msgSig) return;
    lastSavedSigRef.current = msgSig;

    const cleanFirstMsg = firstUserMsg.trim();
    const title = cleanFirstMsg.slice(0, 40) + (cleanFirstMsg.length > 40 ? "..." : "");

    const activeSession: ChatSession = {
      id: currentChatId,
      title,
      timestamp: new Date().toISOString(),
      messages
    };

    const activeChatIdKey = getUserStorageKey("best_friend_active_chat_id", loggedInUserRef.current, isGuestRef.current);
    if (activeChatIdKey) {
      safeLocalStorageSet(activeChatIdKey, currentChatId);
    }

    setChatHistoryList(prev => {
      const idx = prev.findIndex(c => c.id === currentChatId);
      if (idx >= 0) {
        if (
          prev[idx].messages.length === messages.length &&
          prev[idx].title === title &&
          JSON.stringify(prev[idx].messages) === JSON.stringify(messages)
        ) {
          return prev;
        }
        let newList = [...prev];
        newList[idx] = { ...newList[idx], title, messages };
        const storageKey = getUserStorageKey("best_friend_saved_chats", loggedInUserRef.current, isGuestRef.current);
        if (storageKey) {
          try {
            const encoded = btoa(encodeURIComponent(JSON.stringify(newList)));
            safeLocalStorageSet(storageKey, encoded);
          } catch { }
        }
        return newList;
      } else {
        let newList = [activeSession, ...prev];
        const storageKey = getUserStorageKey("best_friend_saved_chats", loggedInUserRef.current, isGuestRef.current);
        if (storageKey) {
          try {
            const encoded = btoa(encodeURIComponent(JSON.stringify(newList)));
            safeLocalStorageSet(storageKey, encoded);
          } catch { }
        }
        return newList;
      }
    });

    syncSessionToCloud(activeSession);
  }, [messages, currentChatId, syncSessionToCloud]);

  // Delete chat from local state and cloud database
  const handleDeleteChat = async (sessionIdToDelete: string) => {
    setChatHistoryList(prev => prev.filter(c => c.id !== sessionIdToDelete));
    if (currentChatId === sessionIdToDelete) {
      setCurrentChatId(crypto.randomUUID());
      setMessages([]);
    }

    // Delete from Firebase Cloud Database with Self-Healing Recovery
    await selfHealingSystem.selfHealDeleteFromCloud(loggedInUser, sessionIdToDelete);

    if (loggedInUser?.id) {
      try {
        await fetch("/api/history/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: loggedInUser.id, sessionId: sessionIdToDelete })
        });
      } catch (e) {
        console.error("Failed to delete chat from cloud:", e);
      }
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Simple encryption/decryption visual simulation representing client-side AES-256
  const getCiphertext = (_text: string) => "Encryption is not implemented in this MVP.";

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (35MB)
    if (file.size > 35 * 1024 * 1024) {
      setChatError(`File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select a file under 35 MB.`);
      e.target.value = "";
      return;
    }

    // Check if image or document
    const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg|bmp|heic|heif)$/i.test(file.name);

    // Read file as Data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      if (isImage && !file.type.includes("svg")) {
        // Compress/resize image for smoother transmission
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1600;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
            setSelectedAttachment({
              name: file.name,
              type: "image/jpeg",
              dataUrl: compressedDataUrl,
              size: Math.round(compressedDataUrl.length * 0.75),
              isImage: true,
            });
            setChatError(null);
            return;
          }

          // Use self-healing file repair
          const healedAttachment = selfHealingSystem.selfHealFile(file, result);
          setSelectedAttachment(healedAttachment);
          setChatError(null);
        };
        img.src = result;
      } else {
        // Document or vector image with self-healing repair
        const healedAttachment = selfHealingSystem.selfHealFile(file, result);
        setSelectedAttachment(healedAttachment);
        setChatError(null);
      }
    };
    reader.onerror = () => {
      setChatError("Failed to read the selected file. Please try selecting it again.");
    };
    reader.readAsDataURL(file);

    // Reset file input value so same file can be re-selected if removed
    e.target.value = "";
    // Reset any previous illustration preview when a new file is uploaded
    setTransformedIllustrationUrl(null);
    setIllustrationError(null);
  };

  // Helper to normalize and ensure valid Data URL image source
  const normalizeImageDataUrl = (raw: string, fallbackMime = "image/png"): string => {
    if (!raw || typeof raw !== "string") return "";
    const trimmed = raw.trim();
    if (trimmed.startsWith("data:image/")) {
      return trimmed;
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
      return trimmed;
    }
    // Clean raw base64 string
    const cleanBase64 = trimmed.replace(/\s+/g, "");
    return `data:${fallbackMime};base64,${cleanBase64}`;
  };

  // Helper to download any image URL (data URL or external URL) as an actual binary file
  const downloadImageFile = async (url: string, defaultFilename = `image-${Date.now()}.png`) => {
    if (!url) return;
    try {
      if (url.startsWith("data:")) {
        const parts = url.split(";base64,");
        const contentType = parts[0].replace("data:", "") || "image/png";
        const base64Data = parts[1] || "";
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          byteArrays.push(new Uint8Array(byteNumbers));
        }
        const blob = new Blob(byteArrays, { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        const ext = contentType.split("/")[1]?.replace("+xml", "") || "png";
        const cleanName = defaultFilename.includes(".") ? defaultFilename : `${defaultFilename}.${ext}`;
        link.download = cleanName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      } else {
        // External URL: fetch blob to trigger real file download
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = defaultFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      }
    } catch (err) {
      console.error("Image file download error:", err);
      // Fallback
      const link = document.createElement("a");
      link.href = url;
      link.download = defaultFilename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // AI Image-to-Illustration Generator (Original Hand-Drawn Japanese Animated-Film Style)
  const handleGenerateIllustration = async () => {
    if (!selectedAttachment || !selectedAttachment.dataUrl) return;
    setIsTransformingIllustration(true);
    setIllustrationError(null);
    setChatError(null);

    try {
      const res = await fetch("/api/transform-illustration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getCustomApiHeaders(),
        },
        body: JSON.stringify({
          imageBase64: selectedAttachment.dataUrl,
          mimeType: selectedAttachment.type || "image/jpeg",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate Ghibli art illustration. Please try again.");
      }

      if (data.url) {
        const normalizedUrl = normalizeImageDataUrl(data.url, "image/png");
        setTransformedIllustrationUrl(normalizedUrl);
      } else {
        throw new Error("No illustration image returned from server.");
      }
    } catch (err: any) {
      console.error("Illustration generation error:", err);
      setIllustrationError(err.message || "Failed to generate Ghibli art illustration. Please try again.");
    } finally {
      setIsTransformingIllustration(false);
    }
  };

  // Download / Save Generated Illustration as real image file
  const handleDownloadIllustration = async () => {
    if (!transformedIllustrationUrl) return;
    await downloadImageFile(transformedIllustrationUrl, `ghibli-art-${Date.now()}.png`);
  };

  // Send message to Express API
  const handleSendMessage = async (textToSend?: string) => {
    if (isSendingRef.current || isTyping) {
      return;
    }

    const rawText = textToSend || userInput;
    const attachmentToSend = selectedAttachment;
    if (attachmentToSend) { uiToast("This MVP is text-only. Remove the attachment to send a chat."); return; }

    if (!rawText.trim() && !attachmentToSend) return;

    isSendingRef.current = true;
    setChatError(null);
    if (!textToSend) setUserInput("");
    setSelectedAttachment(null);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = "user-" + Date.now();

    const isImg = attachmentToSend?.isImage || (attachmentToSend?.type && attachmentToSend.type.startsWith("image/"));
    const defaultLabel = attachmentToSend ? (isImg ? "📷 [Attached Image]" : `📁 [Attached File: ${attachmentToSend.name}]`) : "";

    const newUserMessage: Message = {
      id: userMsgId,
      role: "user",
      text: rawText || defaultLabel,
      timestamp,
      isEncrypted: encryptionEnabled,
      imageAttachment: attachmentToSend || undefined,
    };

    const targetChatId = currentChatId;
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsTyping(true);

    const responseMsgId = "friend-" + Date.now();
    let hasStreamedContent = false;

    try {
      const contextHistory = updatedMessages;
      const messagesPayload = contextHistory.slice(-10).map(m => ({
        role: m.role,
        text: m.text
      }));

      const result = await selfHealingSystem.selfHealChatCall(
        messagesPayload,
        selectedModel,
        responseMode,
        userName,
        attachmentToSend,
        (fallbackModel) => {
          setSelectedModel(fallbackModel);
          safeLocalStorageSet("best_friend_selected_model", fallbackModel);
          setSelfHealingNotification(`Self-Healed: Switched automatically to backup model ${fallbackModel}`);
          setTimeout(() => setSelfHealingNotification(null), 4000);
        },
        controller.signal,
        (delta) => {
          hasStreamedContent = true;
          setMessages(prev => {
            const existing = prev.find(m => m.id === responseMsgId);
            if (!existing) {
              const streamedMsg: Message = {
                id: responseMsgId,
                role: "model",
                text: delta.text || "",
                reasoning: delta.reasoning || "",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isEncrypted: encryptionEnabled,
                modelUsed: selectedModel,
              };
              return [...prev, streamedMsg];
            }
            return prev.map(m => {
              if (m.id !== responseMsgId) return m;
              return {
                ...m,
                text: delta.text ? m.text + delta.text : m.text,
                reasoning: delta.reasoning ? (m.reasoning || "") + delta.reasoning : m.reasoning,
              };
            });
          });
        }
      );

      // Finalize the completed message
      setMessages(prev => {
        const existing = prev.find(m => m.id === responseMsgId);
        if (!existing) {
          const newFriendMessage: Message = {
            id: responseMsgId,
            role: "model",
            text: result.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            citations: result.citations,
            generatedImage: result.generatedImage,
            reasoning: result.reasoning,
            modelUsed: result.recoveredByModel || selectedModel,
            isEncrypted: encryptionEnabled
          };
          return [...prev, newFriendMessage];
        }
        return prev.map(m => {
          if (m.id !== responseMsgId) return m;
          return {
            ...m,
            text: result.text || m.text,
            citations: result.citations,
            generatedImage: result.generatedImage,
            reasoning: result.reasoning || m.reasoning,
            modelUsed: result.recoveredByModel || selectedModel,
          };
        });
      });
    } catch (err: any) {
      if (err.name === "AbortError" || err.message === "Generation cancelled by user.") {
        return;
      }
      console.error("Self-Healing Chat Error:", err);
      if (!hasStreamedContent) {
        setMessages(prev => prev.filter(m => m.id !== responseMsgId));
      }
      setChatError(err.message || "Failed to process message safely. Please try again.");
    } finally {
      isSendingRef.current = false;
      setIsTyping(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  // Preserve the security UI, but never simulate MFA success.
  const startMfaSetup = () => uiToast("MFA is not implemented in this personal MVP. No security setting was changed.");
  const handleVerifyMfaCode = () => uiToast("MFA verification is not implemented in this MVP.");
  const handleDisableMfa = () => { setMfaEnabled(false); setMfaStep("idle"); };
  const handleMfaChallengeSubmit = () => uiToast("There is no MFA or cloud account in this MVP. Continue as Guest.");

  // Wipe chat memory safely
  const wipeAllData = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "model",
        text: "hey! cache is totally cleared. fresh slate! what's on your mind?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setCurrentChatId(crypto.randomUUID());
    setChatHistoryList([]);
    localStorage.removeItem("best_friend_saved_chats");
    localStorage.removeItem("best_friend_chat_history");
    sessionStorage.removeItem("best_friend_chat_history");
    for (const key of [getUserStorageKey("best_friend_saved_chats", loggedInUser, isGuest), getUserStorageKey("best_friend_active_chat_id", loggedInUser, isGuest), getUserStorageKey("best_friend_sync_queue", loggedInUser, isGuest), "karishma_mvp_history_" + getCleanUserId(loggedInUser), memoryStorageKey()]) { if (key) localStorage.removeItem(key); }
    localStorage.removeItem("best_friend_user_name");
    setUserName("");
    setShowClearConfirm(false);
  };

  // Download encrypted conversation backup bundle
  const handleExportBackup = () => {
    const dataBundle = {
      app: "karishmaV2", timestamp: new Date().toISOString(), storage: "This browser only. Export is not encrypted.",
      chats: chatHistoryList, currentConversation: messages,
      memory: readNotes()
    };

    const blob = new Blob([JSON.stringify(dataBundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `best-friend-privacy-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (sessionChecking) return <div className="auth" role="status">Checking your session...</div>;

  if (!authCompleted) {
    return (
      <LoginPage
        userName={userName || ""}
        authLoading={authLoading}
        authError={authError}
        onLogin={handlePasswordLogin}
        onRegister={handleRegister}
        onGoogleCredential={handleGoogleCredential}
        onGoogleError={(msg) => setAuthError(msg)}
        onGuest={handleGuestContinue}
        colorMode={colorMode}
        onToggleColor={toggleColor}
        isDark={resolvedDark}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="h-screen h-dvh w-full flex flex-col font-sans overflow-hidden">


      {/* Main Container Wrapper */}
      <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">



        {/* MFA Authentication Wall Screen (If locked) */}
        {!mfaChallengePassed && mfaEnabled && (
          <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full bg-white border border-[#EBE6DD] rounded-3xl p-8 shadow-sm text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-[#FAF0E6] flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-[#D96B43]" />
              </div>
              <h2 className="text-xl font-bold text-[#2C2A29] mb-2">Secure Chat Locked</h2>
              <p className="text-sm text-[#5C5753] mb-6">
                Your profile is securely locked with Multi-Factor Authentication. Please enter your 6-digit verification code to resume the session.
              </p>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit security code"
                    value={mfaChallengeInput}
                    onChange={(e) => setMfaChallengeInput(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center tracking-[0.5em] text-xl font-bold py-3 border border-[#EBE6DD] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D96B43] focus:border-transparent bg-[#FAF8F5]"
                  />
                  <p className="text-[11px] text-[#8C857E] mt-1.5">
                    💡 Testing note: You can enter <b>123456</b> or any 6 digits to pass.
                  </p>
                </div>

                {mfaError && (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg flex items-center gap-1.5 justify-center">
                    <CircleAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>{mfaError}</span>
                  </div>
                )}

                <button
                  onClick={handleMfaChallengeSubmit}
                  className="w-full bg-[#D96B43] hover:bg-[#C85C34] text-white font-medium py-3 rounded-xl transition-all cursor-pointer"
                >
                  Verify Identity & Unlock Chat
                </button>

                <div className="pt-4 border-t border-[#FAF8F5]">
                  <button
                    onClick={() => {
                      // Allow clearing stored keys to bypass if recovery is needed
                      localStorage.removeItem("best_friend_mfa_enabled");
                      setMfaEnabled(false);
                      setMfaChallengePassed(true);
                    }}
                    className="text-xs text-[#8C857E] hover:text-[#D96B43] underline transition-all cursor-pointer"
                  >
                    Bypass / Reset MFA Security Lock
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Normal application interface — claymorphic shell */}
        {mfaChallengePassed && (
          <div className="kshell">

            {/* ---------------- Left sidebar ---------------- */}
            <aside className={`side card ${sideCollapsed ? "col" : ""}`}>
              <div className="brand flex items-center gap-3">
                <div className="relative w-11 h-11 flex-shrink-0 rounded-2xl overflow-hidden shadow-sm bg-gradient-to-tr from-purple-200 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/30 flex items-center justify-center border border-purple-300/40">
                  <img
                    src="/karishma-mascot.webp"
                    alt="Karishma Robot"
                    className="w-full h-full object-cover object-top scale-125 translate-y-0.5"
                  />
                </div>
                <div><b>Karishma AI</b><small>Your AI Companion</small></div>
              </div>
              <button className="newc" onClick={startNewChat}>
                <Plus className="i" /><span className="lbl">New Chat</span>
              </button>
              <nav className="knav">
                {NAV_ITEMS.map((item, idx) => {
                  const label = item.panel === "history" ? "Memory" : item.panel === "settings" ? "Settings" : item.view;
                  const isActive = !item.panel && activeView === item.view;
                  const Icon = item.icon;
                  return (
                    <button
                      key={`${item.view}-${idx}`}
                      className={isActive ? "on" : ""}
                      onClick={() => {
                        setShowAccount(false);
                        if (item.panel === "history") setShowHistoryPanel(true);
                        else if (item.panel === "settings") setShowSettings(true);
                        else setActiveView(item.view);
                      }}
                    >
                      <Icon className="i" /><span className="lbl">{label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className={`me ${showAccount ? "on" : ""}`}>
                <div
                  className="av"
                  onClick={() => setShowAccount(true)}
                  style={{ cursor: "pointer" }}
                  title="Account"
                >
                  {loggedInUser?.avatarUrl ? (
                    <img src={loggedInUser.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <AvatarFallback />
                  )}
                </div>
                <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setShowAccount(true)}>
                  <b>{loggedInUser?.nickname || loggedInUser?.fullName || loggedInUser?.name || userName || "Guest"}</b>
                  <small>{loggedInUser ? "Free Plan" : "Guest Mode"}</small>
                </div>
                <button
                  className="rb"
                  style={{ width: 34, height: 34 }}
                  onClick={() => setSideCollapsed(v => !v)}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="i" style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </aside>

            {/* ---------------- Main column ---------------- */}
            <main className={`main card ${showAccount ? "onacct" : ""} ${!showAccount && activeView === "Memory" ? "mem" : ""} ${!showAccount && activeView !== "Chat" && activeView !== "Memory" ? "tools-mode" : ""}`}>
              <div className="cloud c1" /><div className="cloud c2" />
              <div className="fly" style={{ width: 34, left: "62%", top: 90 }}><ButterflySvg style={{ width: "100%", height: "auto" }} /></div>
              <div className="fly" style={{ width: 24, left: "9%", top: 230, animationDelay: "-2s" }}><ButterflySvg style={{ width: "100%", height: "auto" }} /></div>

              <div className="top">
                {showAccount ? (
                  <button
                    className="newc"
                    style={{ padding: "8px 18px", borderRadius: "18px", fontSize: "14px" }}
                    onClick={() => setShowAccount(false)}
                    title="Return to Chat"
                  >
                    <ChevronLeft className="i" style={{ width: 18, height: 18 }} />
                    <span>Back to Chat</span>
                  </button>
                ) : (
                  <label className="search">
                    <Search className="i" />
                    <input
                      ref={searchRef}
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const q = searchQ.trim().toLowerCase();
                          const first = chatHistoryList.find(c => (c.messages?.length || 0) > 0 && (!q || c.title.toLowerCase().includes(q)));
                          if (first) openSession(first.id);
                        }
                      }}
                      placeholder="Search chats"
                      aria-label="Search chats"
                    />
                    <kbd className="kb">Ctrl K</kbd>
                  </label>
                )}
                <div className="sp" />
                {loggedInUser?.id && syncStatus !== "synced" && (
                  <button
                    className="synp"
                    onClick={() => flushPendingSyncQueue()}
                    title={syncStatus === "failed" ? "Cloud save failed. Click to retry." : "Syncing your chats…"}
                  >
                    {syncStatus === "failed" ? "Sync failed — retry" : "Syncing…"}
                  </button>
                )}
                <div style={{ position: "relative", flex: "none" }}>
                    <button
                      className="langbtn"
                      onClick={(e) => { e.stopPropagation(); setShowSpeechLangMenu((prev) => !prev); }}
                      title="Change voice language"
                      aria-label="Language"
                    >
                      Language
                    </button>

                    <AnimatePresence>
                      {showSpeechLangMenu && (
                        <motion.div
                          key="speech-lang-backdrop"
                          className="fixed inset-0 z-30"
                          onClick={() => setShowSpeechLangMenu(false)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                      {showSpeechLangMenu && (
                        <motion.div
                          key="speech-lang-panel"
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="langpanel absolute top-full right-0 max-sm:left-0 max-sm:right-auto mt-2 z-40 border rounded-2xl shadow-xl p-2 min-w-[210px]"
                        >
                          <div className="px-2.5 py-1.5 border-b border-[#EBE6DD] mb-1">
                            <p className="text-[11px] font-bold text-[#2C2A29] flex items-center gap-1.5">
                              <Mic className="w-3.5 h-3.5 text-[#D96B43]" />
                              Voice Input Language
                            </p>
                            <p className="text-[10px] text-[#8C857E]">Select recognition language</p>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {SPEECH_LANGUAGES.map((lang) => (
                              <button
                                key={lang.code}
                                type="button"
                                onClick={() => handleSetSpeechLanguage(lang.code)}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${speechLang === lang.code ? "bg-[#FAF0E6] text-[#D96B43] font-bold" : "text-[#2C2A29] hover:bg-[#FAF8F5]"
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{lang.flag}</span>
                                  <div>
                                    <p className="leading-tight">{lang.label}</p>
                                    <p className="text-[10px] text-[#8C857E]">{lang.native}</p>
                                  </div>
                                </div>
                                {speechLang === lang.code && <Check className="w-3.5 h-3.5 text-[#D96B43] shrink-0" />}
                              </button>
                            ))}
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-[#EBE6DD] px-2.5">
                            <label className="flex items-center gap-2 text-[11px] text-[#8C857E] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={speechAutoSend}
                                onChange={(e) => {
                                  setSpeechAutoSend(e.target.checked);
                                  localStorage.setItem("best_friend_speech_autosend", String(e.target.checked));
                                }}
                                className="rounded border-[#EBE6DD] text-[#D96B43] focus:ring-[#D96B43] cursor-pointer"
                              />
                              <span>Auto-send on silence</span>
                            </label>
                          </div>
                          {publicDemo && <div className="mt-1.5 pt-1.5 border-t px-2.5 text-[11px]"><a href="/privacy.html" target="_blank" rel="noreferrer" className="underline">AI provider and privacy info</a></div>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                </div>
                <div className="seg">
                  <button
                    className={responseMode === "quick" ? "on" : ""}
                    onClick={() => {
                      setResponseMode("quick");
                      localStorage.setItem("best_friend_response_mode", "quick");
                    }}
                  >
                    Quick
                  </button>
                  <button
                    className={responseMode === "detailed" ? "on" : ""}
                    onClick={() => {
                      setResponseMode("detailed");
                      localStorage.setItem("best_friend_response_mode", "detailed");
                    }}
                  >
                    Detailed
                  </button>
                </div>
                <button className="rb" onClick={() => uiToast("No new notifications")} aria-label="Notifications" title="Notifications">
                  <Bell className="i" />
                </button>
                <button className="rb" onClick={toggleColor} aria-label="Switch color theme: pink or blue" title="Pink / Blue">
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#ff7ac3 50%,#2b74f5 50%)", boxShadow: "inset -2px -2px 4px rgba(0,0,0,.2), inset 2px 2px 3px rgba(255,255,255,.6)", display: "block" }} />
                </button>
                <button className="rb" onClick={toggleTheme} aria-label="Switch theme" title="Light / Dark">
                  {resolvedDark ? <Sun className="i" /> : <Moon className="i" />}
                </button>
              </div>

              <div className="stage">
                {showAccount ? (
                  <AccountPage
                    user={loggedInUser}
                    isGuest={isGuest}
                    userName={userName}
                    userNickname={userNickname}
                    userFullName={userFullName}
                    onClose={() => setShowAccount(false)}
                    onNewChat={() => {
                      setShowAccount(false);
                      startNewChat();
                    }}
                    onNavigate={(view) => {
                      setShowAccount(false);
                      setActiveView(view);
                    }}
                    onOpenMemory={() => {
                      setShowAccount(false);
                      setShowHistoryPanel(true);
                    }}
                    onOpenSettings={() => {
                      setShowAccount(false);
                      setShowSettings(true);
                    }}
                    onLogout={handleLogout}
                    onUpdateUser={(updatedUser) => {
                      setLoggedInUser(updatedUser);
                      localStorage.setItem("mock_logged_in_user", JSON.stringify(updatedUser));
                      if (updatedUser.nickname) {
                        setUserNickname(updatedUser.nickname);
                        localStorage.setItem("best_friend_nickname", updatedUser.nickname);
                      }
                      if (updatedUser.fullName) {
                        setUserFullName(updatedUser.fullName);
                        localStorage.setItem("best_friend_full_name", updatedUser.fullName);
                      }
                      const conv = updatedUser.nickname || updatedUser.fullName || "Friend";
                      setUserName(conv);
                      localStorage.setItem("best_friend_user_name", conv);
                    }}
                    onSwitchAccount={() => {
                      setShowAccount(false);
                      handleLogout();
                    }}
                    onToast={uiToast}
                  />
                ) : (
                  <>
                    {activeView === "Chat" && messages.length === 0 && (
                      <div className="hero">
                        <KarishmaMascot userName={userName} />
                        <div>
                          <h1>Hey, <span>{userName || "friend"}</span>! 💜</h1>
                          <p>I'm Karishma, your AI best friend. How can I help you today?</p>
                        </div>
                      </div>
                    )}

                    {activeView === "Chat" && messages.length > 0 && (
                      <div className="thread">
                        {messages.map((m) => {
                          const isUser = m.role === "user";
                          const shouldMask = encryptionEnabled && !showDecrypted;
                          return (
                            <div key={m.id} className={`row ${isUser ? "u" : "k"}`}>
                              {!isUser && (
                                <div className="ka overflow-hidden relative" title="Karishma">
                                  <img
                                    src="/karishma-mascot.webp"
                                    alt="Karishma"
                                    className="w-full h-full object-cover object-top scale-125"
                                  />
                                </div>
                              )}
                              <div style={isUser ? { maxWidth: "100%" } : { flex: 1, minWidth: 0 }}>
                                <div className="bub">
                                  {/* Attached image or document inside user bubble */}
                                  {m.imageAttachment?.dataUrl && (
                                    m.imageAttachment.isImage || m.imageAttachment.type?.startsWith("image/") ? (
                                      <img
                                        src={m.imageAttachment.dataUrl}
                                        alt={m.imageAttachment.name}
                                        className="w-full max-h-56 object-cover rounded-xl mb-2"
                                      />
                                    ) : (
                                      <span style={{ display: "block", marginBottom: 6, background: "rgba(255,255,255,.25)", borderRadius: 12, padding: "3px 10px", fontSize: 12 }}>
                                        📁 {m.imageAttachment.name}{m.imageAttachment.size ? ` • ${formatFileSize(m.imageAttachment.size)}` : ""}
                                      </span>
                                    )
                                  )}

                                  {shouldMask ? (
                                    <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 12, wordBreak: "break-all", opacity: .9 }}>
                                      <b>🔐 CLIENT-SIDE ENCRYPTED</b>
                                      <div>{getCiphertext(m.text)}</div>
                                    </div>
                                  ) : (
                                    <>
                                      {!isUser && m.reasoning && (
                                        <details className="mb-2 text-xs rounded-xl p-2.5 bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 select-none cursor-pointer">
                                          <summary className="font-medium text-stone-500 dark:text-stone-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5 outline-none">
                                            <Brain style={{ width: 13, height: 13 }} />
                                            <span>Thought Process (Nemotron Reasoning)</span>
                                          </summary>
                                          <div className="mt-2 text-stone-600 dark:text-stone-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed border-t border-black/5 dark:border-white/5 pt-2">
                                            {m.reasoning}
                                          </div>
                                        </details>
                                      )}
                                      <Markdown
                                        components={{
                                          p: ({ children }) => <div className="mb-1.5 last:mb-0">{children}</div>,
                                          img: ({ node, src, alt, ...props }) => {
                                            const srcStr = typeof src === "string" ? src : "";
                                            if (!srcStr || srcStr.trim() === "") return null;
                                            return (
                                              <div className="my-3 group relative inline-block max-w-sm overflow-hidden rounded-2xl shadow-md">
                                                <img
                                                  src={src}
                                                  alt={alt || "Generated Image"}
                                                  referrerPolicy="no-referrer"
                                                  className="w-full max-h-80 object-cover rounded-2xl block"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 rounded-2xl">
                                                  <span className="text-xs text-white/90 font-medium truncate max-w-[70%]">
                                                    {alt || "Generated Image"}
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() => downloadImageFile(srcStr, `karishma-generated-${Date.now()}.png`)}
                                                    className="px-2.5 py-1 bg-white/90 hover:bg-white text-black text-xs font-semibold rounded-lg shadow flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
                                                  >
                                                    <Download className="w-3.5 h-3.5" /> Save
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          }
                                        }}
                                      >
                                        {m.text}
                                      </Markdown>
                                    </>
                                  )}

                                  {/* Standalone generated image */}
                                  {m.generatedImage?.url && !m.text.includes(m.generatedImage.url) && (
                                    <div className="my-3 group relative inline-block max-w-sm overflow-hidden rounded-2xl shadow-md">
                                      <img
                                        src={m.generatedImage.url}
                                        alt={m.generatedImage.prompt || "Generated Image"}
                                        referrerPolicy="no-referrer"
                                        className="w-full max-h-80 object-cover rounded-2xl block"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 rounded-2xl">
                                        <span className="text-xs text-white/90 font-medium truncate max-w-[70%]">
                                          {m.generatedImage.prompt || "Generated Image"}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => downloadImageFile(m.generatedImage!.url, `karishma-generated-${Date.now()}.png`)}
                                          className="px-2.5 py-1 bg-white/90 hover:bg-white text-black text-xs font-semibold rounded-lg shadow flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
                                        >
                                          <Download className="w-3.5 h-3.5" /> Save
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Grounding web search citations */}
                                  {m.citations && m.citations.length > 0 && (
                                    <div className="cite">
                                      <b>🌍 Helpful Real-Time Sources:</b>
                                      {m.citations.map((cit, idx) => (
                                        <a key={idx} href={cit.uri} target="_blank" rel="noreferrer" referrerPolicy="no-referrer">
                                          [{idx + 1}] {cit.title}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="acts">
                                  {isUser ? (
                                    <>
                                      {["👍", "❤️", "😂"].map(emoji => (
                                        <button
                                          key={emoji}
                                          className={m.reactions?.includes(emoji) ? "on" : ""}
                                          onClick={() => handleReaction(m.id, emoji)}
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                      <button onClick={() => handleCopyMessage(m.id, m.text)}>
                                        {copiedMsgId === m.id ? "Copied!" : "Copy"}
                                      </button>
                                      <span style={{ alignSelf: "center", marginLeft: "auto", color: "var(--mute)", fontSize: 11, whiteSpace: "nowrap" }}>
                                        {m.timestamp}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        className={m.feedback === "like" ? "on" : ""}
                                        onClick={() => handleToggleFeedback(m.id, "like")}
                                        title="Like"
                                      >
                                        <ThumbsUp style={{ width: 14, height: 14 }} />
                                      </button>
                                      <button
                                        className={m.feedback === "dislike" ? "on" : ""}
                                        onClick={() => handleToggleFeedback(m.id, "dislike")}
                                        title="Dislike"
                                      >
                                        <ThumbsDown style={{ width: 14, height: 14 }} />
                                      </button>
                                      <button onClick={() => handleCopyMessage(m.id, m.text)} title="Copy">
                                        {copiedMsgId === m.id ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                                      </button>
                                      <button onClick={() => handleOpenRegenerateModal(m)} title="Regenerate">
                                        <RotateCcw style={{ width: 14, height: 14 }} />
                                      </button>
                                      <button
                                        className={speakingMsgId === m.id ? "on" : ""}
                                        onClick={() => handleReadAloud(m.id, m.text)}
                                        title={speakingMsgId === m.id ? "Stop reading" : "Read aloud"}
                                      >
                                        {speakingMsgId === m.id ? <VolumeX style={{ width: 14, height: 14 }} /> : <Volume2 style={{ width: 14, height: 14 }} />}
                                      </button>
                                      <span style={{ alignSelf: "center", marginLeft: "auto", color: "var(--mute)", fontSize: 11, whiteSpace: "nowrap" }}>
                                        {m.timestamp}{m.modelUsed ? ` • ${getShortModelName(m.modelUsed)}` : ""}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {m.reactions && m.reactions.length > 0 && (
                                  <div className="acts" style={{ marginTop: 4 }}>
                                    {m.reactions.map(r => (
                                      <button key={r} onClick={() => handleReaction(m.id, r)}>{r}</button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Typing indicator */}
                        {isTyping && (
                          <div className="row k">
                            <div className="ka"><ButterflySvg style={{ width: "100%", height: "100%" }} /></div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="bub">
                                <span className="dots"><i /><i /><i /></span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>
                    )}

                    <svg className="plant" viewBox="0 0 70 90">
                      <path d="M35 54C30 38 12 34 8 18c14-2 26 6 27 36Z" fill="#8fc57d" />
                      <path d="M35 54c4-16 20-20 26-34-14-2-27 8-26 34Z" fill="#a8d894" />
                      <path d="M35 54c-2-16 4-30 8-40-10 6-13 24-8 40Z" fill="#7bb36a" />
                      <path d="M14 58h44l-5 26c-1 4-4 6-8 6H27c-4 0-7-2-8-6Z" style={{ fill: "var(--b3)" }} />
                      <rect x="11" y="52" width="50" height="10" rx="5" fill="#c9aaff" />
                    </svg>
                  </>
                )}

                {/* Memory page (mockup "Karishma_AI_main_5.html") */}
                {!showAccount && activeView === "Memory" && (
                  <MemoryPage
                    onOpenHistory={() => setShowHistoryPanel(true)}
                    onToast={uiToast}
                  />
                )}

                {/* Tools page */}
                {!showAccount && activeView === "Tools" && (
                  <ToolsPage
                    onSendToChat={(prompt) => {
                      setUserInput(prompt);
                      setActiveView("Chat");
                      setTimeout(() => {
                        chatInputRef.current?.focus();
                      }, 100);
                    }}
                    onToast={uiToast}
                    onOpenSettings={() => setShowSettings(true)}
                  />
                )}

                {/* Agents page */}
                {!showAccount && activeView === "Agents" && (
                  <AgentsPage
                    onSendToChat={(prompt) => {
                      setUserInput(prompt);
                      setActiveView("Chat");
                      setTimeout(() => {
                        chatInputRef.current?.focus();
                      }, 100);
                    }}
                    onToast={uiToast}
                  />
                )}

                {/* Studio page */}
                {!showAccount && activeView === "Studio" && (
                  <StudioPage
                    onSendToChat={(prompt) => {
                      setUserInput(prompt);
                      setActiveView("Chat");
                      setTimeout(() => {
                        chatInputRef.current?.focus();
                      }, 100);
                    }}
                    onToast={uiToast}
                  />
                )}

                {/* Files page */}
                {!showAccount && activeView === "Files" && (
                  <FilesPage
                    onSendToChat={(prompt) => {
                      setUserInput(prompt);
                      setActiveView("Chat");
                      setTimeout(() => {
                        chatInputRef.current?.focus();
                      }, 100);
                    }}
                    onToast={uiToast}
                  />
                )}

                {/* Projects page */}
                {!showAccount && activeView === "Projects" && (
                  <ProjectsPage
                    onSendToChat={(prompt) => {
                      setUserInput(prompt);
                      setActiveView("Chat");
                      setTimeout(() => {
                        chatInputRef.current?.focus();
                      }, 100);
                    }}
                    onToast={uiToast}
                  />
                )}

                {/* Explore page */}
                {!showAccount && activeView === "Explore" && (
                  <ExplorePage
                    onSendToChat={(prompt) => {
                      setUserInput(prompt);
                      setActiveView("Chat");
                      setTimeout(() => {
                        chatInputRef.current?.focus();
                      }, 100);
                    }}
                    onToast={uiToast}
                  />
                )}
              </div>

              {/* Quick action cards (empty chat state) */}
              {!showAccount && activeView === "Chat" && messages.length === 0 && (
                <div className="cards">
                  {QUICK_CARDS.map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={i}
                        className="chip"
                        onClick={() => {
                          if (!card.prefill) { setActiveView("Tools"); return; }
                          setUserInput(card.prefill);
                          chatInputRef.current?.focus();
                        }}
                      >
                        <span className="ico" style={{ background: card.bg }}><Icon className="i" /></span>
                        {card.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Chat error notice */}
              {!showAccount && chatError && (
                <div className="atp" style={{ marginBottom: 8 }}>
                  <span className="w" style={{ display: "flex", alignItems: "center", gap: 8, color: "#b3266b", width: "100%" }}>
                    <CircleAlert className="i" style={{ width: 16, height: 16 }} />
                    <span style={{ flex: 1 }}>{chatError}</span>
                    <button onClick={() => handleSendMessage()} style={{ fontWeight: 800, color: "var(--pd)" }}>Retry</button>
                  </span>
                </div>
              )}

              {/* Attachment preview / Ghibli flow */}
              {!showAccount && (
                <div className="atp">
                  <div style={{ width: "100%" }}>
                    <AttachmentPreview
                      attachment={selectedAttachment}
                      isTransforming={isTransformingIllustration}
                      transformedUrl={transformedIllustrationUrl}
                      error={illustrationError}
                      onGenerate={handleGenerateIllustration}
                      onDownload={handleDownloadIllustration}
                      onClear={() => {
                        setSelectedAttachment(null);
                        setTransformedIllustrationUrl(null);
                        setIllustrationError(null);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Hidden file inputs */}
              <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              <input type="file" ref={galleryInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
              <input type="file" ref={fileInputRef} accept="*/*" onChange={handleFileChange} className="hidden" />

              {/* Speech error banner */}
              <AnimatePresence>
                {speechError && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex items-center justify-between gap-2 px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <CircleAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{speechError}</span>
                    </div>
                    <button type="button" onClick={() => setSpeechError(null)} className="text-amber-600 hover:text-amber-900 p-1 cursor-pointer shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active speech recognition banner */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex items-center justify-between gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 mb-2 flex-wrap"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                      </span>
                      <span className="font-bold text-rose-700 shrink-0">Listening...</span>
                      <span className="text-rose-600 truncate text-xs">
                        {speechInterimText ? `"${speechInterimText}"` : `Speak in ${SPEECH_LANGUAGES.find((l) => l.code === speechLang)?.label || speechLang}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center bg-white rounded-lg p-0.5 border border-rose-200 shadow-2xs">
                        {SPEECH_LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => handleSetSpeechLanguage(lang.code)}
                            className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${speechLang === lang.code ? "bg-rose-600 text-white" : "text-[#8C857E] hover:text-[#2C2A29]"
                              }`}
                            title={`Switch voice recognition to ${lang.label}`}
                          >
                            {lang.code.split("-")[0].toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={stopVoiceInput}
                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] cursor-pointer shrink-0 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Composer */}
              {!showAccount && (
                <div className="bar">
                  {publicDemo && <a className="privnote" href="/privacy.html" target="_blank" rel="noreferrer">Groq AI demo · Privacy and provider info</a>}
                  <AnimatePresence>
                    {showAttachmentMenu && (
                      <motion.div
                        key="attachment-backdrop"
                        className="fixed inset-0 z-20"
                        onClick={() => setShowAttachmentMenu(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                    {showAttachmentMenu && (
                      <motion.div
                        key="attachment-panel"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 mb-2 z-30 bg-white border border-[#EBE6DD] rounded-2xl shadow-lg p-2 flex flex-col gap-1 min-w-[180px]"
                      >
                        <button
                          onClick={() => { setShowAttachmentMenu(false); cameraInputRef.current?.click(); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#2C2A29] hover:bg-[#FAF8F5] rounded-xl cursor-pointer transition-colors w-full text-left"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#FAF0E6] text-[#D96B43] flex items-center justify-center shrink-0"><Camera className="w-4 h-4" /></div>
                          <span>Camera</span>
                        </button>
                        <button
                          onClick={() => { setShowAttachmentMenu(false); galleryInputRef.current?.click(); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#2C2A29] hover:bg-[#FAF8F5] rounded-xl cursor-pointer transition-colors w-full text-left"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#FAF0E6] text-[#D96B43] flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4" /></div>
                          <span>Gallery / Photos</span>
                        </button>
                        <button
                          onClick={() => { setShowAttachmentMenu(false); fileInputRef.current?.click(); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#2C2A29] hover:bg-[#FAF8F5] rounded-xl cursor-pointer transition-colors w-full text-left"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#FAF0E6] text-[#D96B43] flex items-center justify-center shrink-0"><Folder className="w-4 h-4" /></div>
                          <span>Files</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button className="ib" onClick={() => setShowModelSwitcher(true)} title="Switch model" aria-label="Switch model">
                    <Sparkles className="i" />
                  </button>

                  <textarea
                    ref={chatInputRef}
                    rows={1}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        setActiveView("Chat");
                        if (isGeneratingOrSpeaking) handleStopGeneration();
                        else handleSendMessage();
                      }
                    }}
                    placeholder={
                      selectedAttachment
                        ? "Ask Karishma about this image..."
                        : encryptionEnabled
                          ? "Write an E2EE secure message..."
                          : hasKarishmaReplied
                            ? "Reply to Karishma"
                            : "Ask Karishma anything..."
                    }
                    aria-label="Message"
                  />

                  <button
                    className="ib"
                    onClick={() => setShowAttachmentMenu((prev) => !prev)}
                    title="Attach"
                    aria-label="Attach file"
                    style={showAttachmentMenu || selectedAttachment ? { background: "var(--lav)", color: "var(--pd)" } : undefined}
                  >
                    <Paperclip className="i" />
                  </button>

                  <button className="ib kib-img" onClick={() => galleryInputRef.current?.click()} title="Upload image" aria-label="Upload image">
                    <ImageIcon className="i" />
                  </button>

                  <div style={{ position: "relative", flex: "none" }}>
                    <button
                      className={`ib ${isListening ? "rec" : ""}`}
                      onClick={toggleVoiceInput}
                      title={isListening ? `Listening (${speechLang})… Tap to stop` : `Voice input (${SPEECH_LANGUAGES.find((l) => l.code === speechLang)?.label || speechLang})`}
                      aria-label={isListening ? "Stop voice input" : "Start voice input"}
                    >
                      <Mic className="i" />
                    </button>
                  </div>

                  {isGeneratingOrSpeaking ? (
                    <button className="send" onClick={handleStopGeneration} title="Stop Generation" aria-label="Stop Generation">
                      <Square className="i" style={{ fill: "currentColor", width: 16, height: 16 }} />
                    </button>
                  ) : (
                    <button className="send" onClick={() => { setActiveView("Chat"); handleSendMessage(); }} title="Send" aria-label="Send">
                      <Send className="i" style={{ fill: "currentColor" }} />
                    </button>
                  )}
                </div>
              )}
            </main>

            {/* ---------------- Right panel ---------------- */}
            <aside className={`side2 card ${s2Collapsed ? "col" : ""}`}>
              <button
                className="rb s2t"
                onClick={() => setS2Collapsed(v => !v)}
                aria-label={s2Collapsed ? "Expand right panel" : "Collapse right panel"}
                aria-expanded={!s2Collapsed}
              >
                <ChevronRight className="i" style={{ width: 16, height: 16 }} />
              </button>
              <div className="w"><h4>Wisdom of the Day</h4><p>{WISDOM_LIST[new Date().getDate() % WISDOM_LIST.length]}</p></div>
              <div className="w">
                <h4>Quick Tools</h4>
                <div className="tl">
                  {QUICK_TOOLS.map(t => (
                    <button key={t} onClick={() => { setUserInput(t + ": "); setActiveView("Chat"); chatInputRef.current?.focus(); }}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="w">
                <h4>Recent Conversations</h4>
                {(() => {
                  const q = searchQ.trim().toLowerCase();
                  const list = chatHistoryList.filter(c => (c.messages?.length || 0) > 0 && (!q || c.title.toLowerCase().includes(q)));
                  return list.length ? (
                    list.slice(0, 5).map(c => (
                      <button key={c.id} className="conv" onClick={() => openSession(c.id)}>{c.title}</button>
                    ))
                  ) : (
                    <p className="empty">No conversations yet.</p>
                  );
                })()}
              </div>
              <div className="w"><h4>Recent Projects</h4><p className="empty">No projects yet. Start one from Projects.</p></div>
              <div className="w">
                <h4>Memory Overview</h4>
                <p>{chatHistoryList.reduce((a, c) => a + (c.messages?.length || 0), 0)} messages across {chatHistoryList.filter(c => (c.messages?.length || 0) > 0).length} chats.</p>
              </div>
            </aside>

            {/* ---------------- Mobile bottom nav ---------------- */}
            <nav className="bn card">
              <button className={activeView === "Chat" && !showAccount ? "on" : ""} onClick={() => { setShowAccount(false); setActiveView("Chat"); }}>
                <MessageCircle className="i" />Chat
              </button>
              <button onClick={() => { setShowAccount(false); setShowHistoryPanel(true); }}>
                <Smile className="i" />Memory
              </button>
              <button className={activeView === "Files" && !showAccount ? "on" : ""} onClick={() => { setShowAccount(false); setActiveView("Files"); }}>
                <Folder className="i" />Files
              </button>
              <button className={showAccount ? "on" : ""} onClick={() => setShowAccount(true)}>
                <User className="i" />Account
              </button>
            </nav>

            {/* Toast */}
            <div className={`toast ${toastMsg ? "on" : ""}`} role="status">{toastMsg}</div>
          </div>
        )}


      </div>



      {/* Model Switcher Modal */}
      <AnimatePresence>
        {showModelSwitcher && (
          <motion.div
            key="model-switcher"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowModelSwitcher(false);
              setExpandedProvider(null);
            }}
            className="fixed inset-0 bg-[#2C2A29]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-[#EBE6DD]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-[#EBE6DD] flex justify-between items-center bg-[#FAF8F5]">
                <div>
                  <h2 className="text-lg font-bold text-[#2C2A29] flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#D96B43]" />
                    AI Model Switcher
                  </h2>
                  <p className="text-[11px] text-[#8C857E] mt-0.5">UI preview. Actual model: {selectedModel}</p>
                </div>
                <button
                  onClick={() => {
                    setShowModelSwitcher(false);
                    setExpandedProvider(null);
                  }}
                  className="p-1.5 bg-white rounded-full text-[#8C857E] border border-[#EBE6DD] hover:text-[#2C2A29] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-2.5 max-h-[70vh] overflow-y-auto">
                {MODEL_PROVIDERS.map((provider) => {
                  const isExpanded = expandedProvider === provider.id;
                  const hasSelectedModel = provider.models.some((m) => m.id === selectedModel);
                  const ProviderIcon = provider.icon;

                  return (
                    <div
                      key={provider.id}
                      className={`border rounded-2xl overflow-hidden transition-all ${isExpanded
                          ? "border-[#D96B43]/50 bg-[#FCFAF7] shadow-xs"
                          : hasSelectedModel
                            ? "border-[#D96B43]/30 bg-white"
                            : "border-[#EBE6DD] bg-white hover:border-[#D96B43]/30"
                        }`}
                    >
                      {/* Provider Header Accordion Trigger */}
                      <button
                        onClick={() => {
                          setExpandedProvider(isExpanded ? null : provider.id);
                        }}
                        className="w-full flex items-center justify-between p-3.5 text-left cursor-pointer transition-colors hover:bg-[#FAF8F5]"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${hasSelectedModel || isExpanded
                                ? "bg-[#D96B43] text-white"
                                : "bg-[#EBE6DD] text-[#8C857E]"
                              }`}
                          >
                            <ProviderIcon className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#2C2A29] flex items-center gap-2">
                              {provider.name}
                              {provider.badge && (
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${provider.badge === "PRIMARY"
                                      ? "bg-[#D96B43] text-white"
                                      : "bg-[#FAF0E6] text-[#D96B43] border border-[#F3D9C9]"
                                    }`}
                                >
                                  {provider.badge}
                                </span>
                              )}
                              {hasSelectedModel && !isExpanded && (
                                <span className="text-[10px] font-semibold bg-[#FAF0E6] text-[#D96B43] px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-[#F3D9C9]">
                                  <Check className="w-2.5 h-2.5" /> Active
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#8C857E] mt-0.5">
                              {provider.tagline} &bull; {provider.models.length} {provider.models.length === 1 ? "model" : "models"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 text-[#8C857E]">
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180 text-[#D96B43]" : ""
                              }`}
                          />
                        </div>
                      </button>

                      {/* Expanded Models List */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-white border-t border-[#EBE6DD] p-2 space-y-1.5"
                          >
                            {provider.models.map((m) => {
                              const isSelected = selectedModel === m.id;
                              const ModelIcon = m.icon;

                              return (
                                <button
                                  key={m.id}
                                  onClick={() => {
                                    uiToast("This preserved model menu is a UI preview. This MVP uses the model in the server .env file: " + selectedModel);
                                    setShowModelSwitcher(false);
                                    setExpandedProvider(null);
                                  }}
                                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${isSelected
                                      ? "bg-[#FAF0E6] border-[#D96B43] shadow-xs"
                                      : "bg-[#FCFAF7] border-[#EBE6DD] hover:bg-[#FAF8F5] hover:border-[#D96B43]/30"
                                    }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSelected
                                          ? "bg-[#D96B43] text-white"
                                          : "bg-[#EBE6DD] text-[#8C857E]"
                                        }`}
                                    >
                                      <ModelIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-[#2C2A29] flex items-center gap-1.5">
                                        <span className="truncate">{m.name}</span>
                                        {isSelected && (
                                          <span className="bg-[#D96B43] text-white rounded-full p-0.5 shrink-0">
                                            <Check className="w-2.5 h-2.5" />
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-[#8C857E] truncate">
                                        {m.desc} &bull;{" "}
                                        <span className="font-semibold text-[#5C5753]">
                                          {m.speed}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Regenerate Response Modal */}
      <AnimatePresence>
        {regenerateTargetMsg && (
          <motion.div
            key="regenerate-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRegenerateTargetMsg(null)}
            className="fixed inset-0 bg-[#2C2A29]/30 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-[#EBE6DD]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-[#EBE6DD] flex justify-between items-center bg-[#FCFAF7]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#D96B43] flex items-center justify-center">
                    <RotateCcw className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#2C2A29]">Regenerate Response</h2>
                    <p className="text-xs text-[#8C857E]">Select an AI model to generate a new answer</p>
                  </div>
                </div>
                <button
                  onClick={() => setRegenerateTargetMsg(null)}
                  className="p-1.5 bg-white rounded-full text-[#8C857E] border border-[#EBE6DD] hover:text-[#2C2A29] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Target message snippet */}
                <div className="p-3 bg-[#FCFAF7] border border-[#EBE6DD] rounded-xl text-xs text-[#5C5753]">
                  <span className="font-semibold text-[#8C857E] block mb-1">Target Response:</span>
                  <p className="line-clamp-2 italic text-[#2C2A29]">"{regenerateTargetMsg.text}"</p>
                </div>

                {/* Selected Model Banner */}
                <div className="p-3 bg-[#FAF0E6] border border-[#D96B43]/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#D96B43] block">Selected Model for Regeneration</span>
                    <div className="text-sm font-bold text-[#2C2A29]">
                      {CONFIGURED_MODELS.find(m => m.id === regenModel)?.name || regenModel}
                    </div>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#D96B43] text-white font-semibold">
                    Ready
                  </span>
                </div>

                {/* Model selection list */}
                <div>
                  <label className="text-xs font-bold text-[#5C5753] block mb-2">
                    Available Configured AI Models:
                  </label>
                  <div className="space-y-1.5">
                    {CONFIGURED_MODELS.map((m) => {
                      const isSelected = regenModel === m.id;
                      const IconComp = m.icon;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setRegenModel(m.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${isSelected
                              ? "bg-[#FAF0E6] border-[#D96B43] shadow-xs"
                              : "bg-white border-[#EBE6DD] hover:bg-[#FAF8F5] hover:border-[#D96B43]/30"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#D96B43] text-white' : 'bg-[#EBE6DD] text-[#8C857E]'}`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#2C2A29] flex items-center gap-1.5">
                                {m.name}
                                {isSelected && (
                                  <span className="bg-[#D96B43] text-white rounded-full p-0.5">
                                    <Check className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#8C857E]">
                                {m.desc} &bull; <span className="font-semibold text-[#5C5753]">{m.speed}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* History retention option */}
                <div className="pt-3 border-t border-[#EBE6DD]">
                  <label className="flex items-center gap-2.5 text-xs text-[#2C2A29] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keepOriginalInHistory}
                      onChange={(e) => setKeepOriginalInHistory(e.target.checked)}
                      className="w-4 h-4 accent-[#D96B43] rounded"
                    />
                    <span className="font-medium">Keep original response in chat history</span>
                  </label>
                  <p className="text-[10px] text-[#8C857E] ml-6 mt-0.5">
                    {keepOriginalInHistory
                      ? "The new response will be saved alongside the original response."
                      : "The new response will replace the original response in history."}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-[#FCFAF7] border-t border-[#EBE6DD] flex items-center justify-end gap-2">
                <button
                  onClick={() => setRegenerateTargetMsg(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#5C5753] hover:bg-[#EBE6DD]/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeRegeneration}
                  className="px-5 py-2.5 rounded-xl bg-[#D96B43] hover:bg-[#C85C34] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Regenerate Response
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat History Slide-over Panel */}
      <AnimatePresence>
        {showHistoryPanel && (
          <motion.div
            key="history-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHistoryPanel(false)}
            className="fixed inset-0 bg-[#2C2A29]/20 backdrop-blur-sm z-40"
          />
        )}
        {showHistoryPanel && (
          <motion.div
            key="history-panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-full max-w-sm bg-[#FAF8F5] border-r border-[#EBE6DD] z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-[#EBE6DD] bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EBE6DD] flex items-center justify-center">
                  <HistoryMenuIcon className="w-4 h-4 text-[#8C857E]" />
                </div>
                <h2 className="text-sm font-bold text-[#2C2A29]">Chat History</h2>
              </div>
              <button
                onClick={() => setShowHistoryPanel(false)}
                className="p-2 hover:bg-[#FAF8F5] rounded-full transition-colors cursor-pointer text-[#8C857E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 border-b border-[#EBE6DD] bg-white">
              <button
                onClick={() => {
                  const newId = crypto.randomUUID();
                  setCurrentChatId(newId);
                  setMessages([]);
                  setShowHistoryPanel(false);
                  const activeChatIdKey = getUserStorageKey("best_friend_active_chat_id", loggedInUser, isGuest);
                  if (activeChatIdKey) safeLocalStorageSet(activeChatIdKey, newId);
                }}
                className="w-full bg-[#D96B43] hover:bg-[#C85C34] text-white text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer"
              >
                + New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {retentionPolicy === "session" ? (
                <div className="text-center py-10">
                  <HistoryMenuIcon className="w-8 h-8 text-[#EBE6DD] mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-[#2C2A29] mb-1">No History Saved</h3>
                  <p className="text-[11px] text-[#8C857E]">
                    Your current storage policy (Sessional Memories) prevents saving chat history.
                  </p>
                </div>
              ) : chatHistoryList.length === 0 ? (
                <div className="text-center py-10">
                  <HistoryMenuIcon className="w-8 h-8 text-[#EBE6DD] mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-[#2C2A29] mb-1">No Past Chats</h3>
                  <p className="text-[11px] text-[#8C857E]">
                    Conversations are saved only in this browser. They are not encrypted or synced to an account.
                  </p>
                </div>
              ) : (
                chatHistoryList.map(chat => (
                  <div
                    key={chat.id}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${currentChatId === chat.id
                        ? "bg-white border-[#D96B43] shadow-sm"
                        : "bg-white border-[#EBE6DD] hover:border-[#D96B43]/30"
                      }`}
                  >
                    <button
                      onClick={() => {
                        setCurrentChatId(chat.id);
                        setMessages(chat.messages || []);
                        setShowHistoryPanel(false);
                        const activeChatIdKey = getUserStorageKey("best_friend_active_chat_id", loggedInUser, isGuest);
                        if (activeChatIdKey) safeLocalStorageSet(activeChatIdKey, chat.id);
                      }}
                      className="flex-1 text-left min-w-0 pr-2 cursor-pointer"
                    >
                      <h4 className="text-xs font-bold text-[#2C2A29] mb-1 truncate">{chat.title}</h4>
                      <p className="text-[10px] text-[#8C857E]">
                        {new Date(chat.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.id);
                      }}
                      className="p-1.5 text-[#8C857E] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-[#EBE6DD] bg-white flex justify-between items-center">
              <button
                onClick={() => { setShowAccount(true); setShowHistoryPanel(false); }}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#FAF8F5] rounded-full transition-colors cursor-pointer text-[#2C2A29]"
              >
                <User className="w-5 h-5 text-[#8C857E]" />
                <span className="text-sm font-bold truncate max-w-[120px]">{loggedInUser ? (loggedInUser.name || loggedInUser.email) : "Profile"}</span>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-[#FAF8F5] rounded-full transition-colors cursor-pointer text-[#8C857E]"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Slide-over Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
            className="fixed inset-0 bg-[#2C2A29]/20 backdrop-blur-sm z-40"
          />
        )}
        {showSettings && (
          <motion.div
            key="settings-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-[#FAF8F5] shadow-2xl z-50 border-l border-[#EBE6DD] flex flex-col overflow-hidden"
          >
            <div className="flex justify-between items-center p-5 border-b border-[#EBE6DD] bg-white shrink-0">
              <h2 className="text-lg font-bold text-[#2C2A29] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#D96B43]" />
                Settings
              </h2>
              <button
                aria-label="Close settings"
                onClick={() => setShowSettings(false)}
                className="p-2 bg-[#FAF8F5] rounded-full text-[#8C857E] hover:text-[#2C2A29] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8">
              <section className="bg-white border border-[#EBE6DD] rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-sm">MVP Connection</h3>
                <p className="text-xs">{connectionInfo}</p>
                <p className="text-xs">Provider API keys belong only in the server .env file, never here. A hosted provider may charge money. No paid provider has been activated.</p>
                <label className="text-xs block">App access token (only if the server owner configured one)
                  <input type="password" autoComplete="off" className="w-full p-3 mt-2 rounded-xl border" value={accessToken} onChange={e=>setAccessToken(e.target.value)} />
                </label>
                <button className="px-4 py-2 rounded-xl bg-[#D96B43] text-white text-xs" onClick={()=>{ sessionStorage.setItem("karishma_mvp_access_token",accessToken.trim()); uiToast("App token saved for this tab only. This is not a provider API key."); }}>Save app token</button>
              </section>

              {/* CATEGORY: Appearance */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#8C857E] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" />
                  Appearance
                </h3>

                <div className="bg-white border border-[#EBE6DD] rounded-2xl p-4 shadow-sm">
                  <h4 className="text-sm font-bold text-[#2C2A29] mb-3">Theme</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setThemeMode("light")}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${themeMode === "light"
                          ? "bg-[#D96B43] border-[#D96B43] text-white shadow-sm"
                          : "bg-[#FAF8F5] border-[#EBE6DD] text-[#2C2A29] hover:bg-[#E2DCD3]"
                        }`}
                    >
                      <Sun className="w-4 h-4" />
                      <span>Light Mode</span>
                    </button>

                    <button
                      onClick={() => setThemeMode("dark")}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${themeMode === "dark"
                          ? "bg-[#D96B43] border-[#D96B43] text-white shadow-sm"
                          : "bg-[#FAF8F5] border-[#EBE6DD] text-[#2C2A29] hover:bg-[#E2DCD3]"
                        }`}
                    >
                      <Moon className="w-4 h-4" />
                      <span>Dark Mode</span>
                    </button>

                    <button
                      onClick={() => setThemeMode("normal")}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${themeMode === "normal"
                          ? "bg-[#D96B43] border-[#D96B43] text-white shadow-sm"
                          : "bg-[#FAF8F5] border-[#EBE6DD] text-[#2C2A29] hover:bg-[#E2DCD3]"
                        }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Normal Mode</span>
                    </button>
                  </div>
                </div>
              </div>



              {/* CATEGORY: Privacy & Storage */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#8C857E] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Privacy & Storage
                </h3>

                {/* Storage Policy Component */}
                <div className="bg-white border border-[#EBE6DD] rounded-2xl p-4 shadow-sm">
                  <h4 className="text-sm font-bold text-[#2C2A29] mb-3">Chat Storage Policy</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-[#FAF8F5] transition-all">
                      <input
                        type="radio"
                        name="retention"
                        checked={retentionPolicy === "local"}
                        onChange={() => {
                          setRetentionPolicy("local");
                          localStorage.setItem("best_friend_retention_policy", "local");
                        }}
                        className="accent-[#D96B43]"
                      />
                      <div>
                        <span className="font-semibold block text-sm text-[#2C2A29]">Browser-local history</span>
                        <span className="text-[11px] text-[#8C857E]">Saved in this browser only. Not encrypted or synced across devices.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-[#FAF8F5] transition-all">
                      <input
                        type="radio"
                        name="retention"
                        checked={retentionPolicy === "session"}
                        onChange={() => {
                          setRetentionPolicy("session");
                          localStorage.setItem("best_friend_retention_policy", "session");
                        }}
                        className="accent-[#D96B43]"
                      />
                      <div>
                        <span className="font-semibold block text-sm text-[#2C2A29]">Sessional Memories</span>
                        <span className="text-[11px] text-[#8C857E]">Chat is wiped when session ends. Not saved or synced anywhere.</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* System Health & Self-Healing Diagnostics */}
                <div className="bg-white border border-[#EBE6DD] rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#2C2A29]">System Health & Diagnostics</h4>
                      <p className="text-[11px] text-[#8C857E]">Check backend reachability and browser storage. Automatic code repair and cloud services are not included.</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">
                      Active
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowSelfHealingModal(true);
                    }}
                    className="w-full mt-2 bg-[#FAF8F5] border border-[#EBE6DD] hover:bg-[#FAF0E6] text-xs font-semibold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-[#D96B43]"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#D96B43]" />
                    View Self-Healing Diagnostics & Health Status
                  </button>
                </div>
              </div>



              {/* CATEGORY: Data Management */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#8C857E] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" />
                  Data Management
                </h3>

                <div className="bg-white border border-[#EBE6DD] rounded-2xl p-4 shadow-sm space-y-3">
                  <button
                    onClick={handleExportBackup}
                    className="w-full bg-[#FAF8F5] border border-[#EBE6DD] hover:bg-[#E2DCD3] text-xs font-semibold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-[#2C2A29]"
                  >
                    <Download className="w-4 h-4 text-[#D96B43]" />
                    Export Browser Data (.json)
                  </button>

                  {showClearConfirm ? (
                    <div className="bg-[#FAF0E6] p-3 rounded-xl border border-[#F3D9C9] space-y-2.5">
                      <p className="text-[10px] text-[#2C2A29] font-bold text-center">
                        Delete this browser's chat history and saved memory notes? Export a backup first if you need one. This cannot be undone here.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { wipeAllData(); setShowSettings(false); }}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold py-2 px-3 rounded-lg flex-1 cursor-pointer transition-colors"
                        >
                          Yes, Wipe Cache
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="bg-white border border-[#EBE6DD] text-[10px] font-semibold text-[#2C2A29] py-2 px-3 rounded-lg flex-1 cursor-pointer hover:bg-[#FAF8F5] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="w-full bg-white border border-rose-200 hover:bg-rose-50 text-xs font-semibold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Shred Chats & Clear Memory
                    </button>
                  )}
                </div>
              </div>

              {/* CATEGORY: Contact Support */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#8C857E] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CircleHelp className="w-3.5 h-3.5" />
                  Contact Support
                </h3>

                <div className="bg-white border border-[#EBE6DD] rounded-2xl p-4 shadow-sm space-y-3">
                  {/* Email Support */}
                  <a
                    href="mailto:7soumyajitg@gmail.com"
                    className="flex items-center justify-between p-3 bg-[#FAF8F5] border border-[#EBE6DD] hover:bg-[#E2DCD3] rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#FAF0E6] border border-[#F3D9C9] flex items-center justify-center shrink-0 text-[#D96B43]">
                        <Mail className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#8C857E] uppercase tracking-wider block">Email Support</span>
                        <span className="text-sm font-bold text-[#2C2A29] group-hover:text-[#D96B43] transition-colors truncate block">
                          7soumyajitg@gmail.com
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8C857E] group-hover:text-[#D96B43] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </a>

                  {/* Instagram Support */}
                  <a
                    href="https://www.instagram.com/soumyajit__7?igsh=MWRvZG56c25xdWJndw=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-[#FAF8F5] border border-[#EBE6DD] hover:bg-[#E2DCD3] rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#FAF0E6] border border-[#F3D9C9] flex items-center justify-center shrink-0 text-[#D96B43]">
                        <Instagram className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#8C857E] uppercase tracking-wider block">Instagram</span>
                        <span className="text-sm font-bold text-[#2C2A29] group-hover:text-[#D96B43] transition-colors truncate block">
                          soumyajit__7
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8C857E] group-hover:text-[#D96B43] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </a>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Self-Healing Toast Notification */}
      <AnimatePresence>
        {selfHealingNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#2C2A29] text-white border border-[#D96B43]/50 px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-[#D96B43]" />
            <span>{selfHealingNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Self-Healing System Diagnostic & Recovery Modal */}
      <SelfHealingStatusModal
        isOpen={showSelfHealingModal}
        onClose={() => setShowSelfHealingModal(false)}
      />
    </div>
  );
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
      
    </ErrorBoundary>
  );
         }
