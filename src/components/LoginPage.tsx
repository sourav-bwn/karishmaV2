import React, { useMemo, useRef, useState, useEffect } from "react";
import { FLORAL_DATA_URI } from "../assets/loginFloralBase64";
import {
  isNativePlatform,
  nativeGoogleIdToken,
  promptGoogleSignIn,
  signInWithGoogle,
} from "../lib/googleAuth";
import { ButterflySvg } from "./KarishmaBits";

export interface LoginPageProps {
  userName?: string;
  authLoading?: boolean;
  authError?: string;
  onLogin: (email: string, password: string) => void;
  onRegister: (fullName: string, email: string, password: string) => void;
  onGoogleCredential: (idToken: string, accessToken?: string) => void;
  onGoogleError: (message: string) => void;
  onGithubAuth?: () => void;
  onGuest: () => void;
  colorMode?: "pink" | "blue";
  onToggleColor?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

interface Petal {
  x: string;
  s: string;
  d: string;
  l: string;
  dx: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  userName = "",
  authLoading = false,
  authError = "",
  onLogin,
  onRegister,
  onGoogleCredential,
  onGoogleError,
  onGithubAuth,
  onGuest,
  colorMode,
  onToggleColor,
  isDark,
  onToggleTheme,
}) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [transitionClass, setTransitionClass] = useState<"" | "out" | "in">("");
  const [isSwitching, setIsSwitching] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  // Form states
  const [loginId, setLoginId] = useState(userName || "");
  const [loginPwd, setLoginPwd] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  const [suName, setSuName] = useState(userName || "");
  const [suEmail, setSuEmail] = useState("");
  const [suPwd, setSuPwd] = useState("");
  const [suPwd2, setSuPwd2] = useState("");
  const [showSuPwd, setShowSuPwd] = useState(false);
  const [showSuPwd2, setShowSuPwd2] = useState(false);
  const [suTerms, setSuTerms] = useState(true);

  const [localError, setLocalError] = useState("");
  const [toastText, setToastText] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (msg: string) => {
    setToastText(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastText(""), 2000);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // 14 falling petals inside the card
  const petals = useMemo<Petal[]>(() => {
    return Array.from({ length: 14 }).map(() => ({
      x: `${4 + Math.random() * 44}%`,
      s: `${9 + Math.random() * 10}px`,
      d: `${7 + Math.random() * 6}s`,
      l: `${-Math.random() * 12}s`,
      dx: `${40 + Math.random() * 150}px`,
    }));
  }, []);

  // Smooth switch between Login and Sign up (sliding pill + cross-fade + animated height)
  const handleSwitchMode = (newMode: "login" | "signup") => {
    if (newMode === mode || isSwitching) return;
    setIsSwitching(true);
    setLocalError("");

    const cardEl = cardRef.current;
    const h0 = cardEl ? cardEl.offsetHeight : 0;
    if (cardEl && h0) {
      cardEl.style.height = `${h0}px`;
    }
    setTransitionClass("out");

    setTimeout(() => {
      setMode(newMode);
      setTransitionClass("");
      if (cardEl) {
        cardEl.style.height = "auto";
        const h1 = cardEl.offsetHeight;
        cardEl.style.height = `${h0}px`;
        void cardEl.offsetHeight;
        setTransitionClass("in");
        cardEl.style.height = `${h1}px`;
        setTimeout(() => {
          if (cardEl) cardEl.style.height = "";
          setTransitionClass("");
          setIsSwitching(false);
        }, 520);
      } else {
        setIsSwitching(false);
      }
    }, 200);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    const id = loginId.trim();
    const pwd = loginPwd.trim();
    if (!id || !pwd) {
      setLocalError("Enter your email or username and password.");
      return;
    }
    onLogin(id, pwd);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    const name = suName.trim();
    const email = suEmail.trim();
    const pwd = suPwd;
    const pwd2 = suPwd2;

    if (!name) {
      setLocalError("Please enter your full name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setLocalError("Enter a valid email address.");
      return;
    }
    if (pwd.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    if (pwd !== pwd2) {
      setLocalError("Passwords do not match.");
      return;
    }
    if (!suTerms) {
      setLocalError("Please accept the Terms and Privacy Policy.");
      return;
    }
    onRegister(name, email, pwd);
  };

  const handleGoogle = () => {
    signInWithGoogle(
      (data) => {
        if (data.credential) {
          onGoogleCredential(data.credential);
        } else if (data.accessToken) {
          onGoogleCredential(data.accessToken, data.accessToken);
        }
      },
      (err) => {
        onGoogleError(err);
      }
    );
  };

  const handleGithub = () => {
    if (onGithubAuth) {
      onGithubAuth();
      return;
    }
    const width = 600;
    const height = 700;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
    const popup = window.open(
      "/api/auth/github",
      "github-auth-popup",
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
    );
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      window.location.href = "/api/auth/github";
    }
  };

  const handleToggleColor = () => {
    if (onToggleColor) {
      onToggleColor();
    } else {
      const root = document.documentElement;
      const cur = root.dataset.color || "pink";
      const next = cur === "blue" ? "pink" : "blue";
      root.dataset.color = next;
      try {
        localStorage.setItem("karishma_color", next);
      } catch {}
      notify(next === "blue" ? "Blue theme" : "Pink theme");
    }
  };

  const handleToggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      const root = document.documentElement;
      const isDarkActive = root.dataset.theme === "dark";
      const next = isDarkActive ? "light" : "dark";
      root.dataset.theme = next;
      try {
        localStorage.setItem("best_friend_theme", next);
      } catch {}
    }
  };

  const displayError = localError || authError;

  return (
    <div
      className="auth"
      id="auth"
      role="dialog"
      aria-modal="true"
      aria-label="Login or sign up"
    >
      {/* Background clouds and flying butterflies */}
      <div className="cloud ac1" />
      <div className="cloud ac2" />
      <div className="fly abf" style={{ width: 34, left: "16%", top: "30%" }}>
        <ButterflySvg />
      </div>
      <div
        className="fly abf"
        style={{ width: 24, right: "15%", top: "24%", animationDelay: "-2s" }}
      >
        <ButterflySvg />
      </div>

      {/* Top right color & theme controls */}
      <div className="atop">
        <button
          className="rb"
          id="acol"
          type="button"
          aria-label="Switch color theme: pink or blue"
          title="Pink / Blue"
          onClick={handleToggleColor}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ff7ac3 50%, #2b74f5 50%)",
              boxShadow:
                "inset -2px -2px 4px rgba(0,0,0,.2), inset 2px 2px 3px rgba(255,255,255,.6)",
              display: "block",
            }}
          />
        </button>
        <button
          className="rb"
          id="ath"
          type="button"
          aria-label="Switch theme"
          title="Light / Dark"
          onClick={handleToggleTheme}
        >
          <svg className="i" viewBox="0 0 24 24">
            <path d="M20 14A8 8 0 1 1 10 4a6.500 6.500 0 0 0 10 10Z" />
          </svg>
        </button>
      </div>

      {/* Main Auth Card */}
      <section
        ref={cardRef}
        className={`authc card ${transitionClass}`}
        style={
          {
            "--bl": `url("${FLORAL_DATA_URI}")`,
          } as React.CSSProperties
        }
      >
        {/* Falling petals inside the card */}
        <div className="cpet" aria-hidden="true">
          {petals.map((p, i) => (
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

        {/* Brand header */}
        <div className="ab">
          <span className="abf" style={{ width: 46, display: "block" }}>
            <ButterflySvg />
          </span>
          <div>
            <b>Karishma AI</b>
            <small>Your AI Best Friend 💜</small>
          </div>
        </div>

        {/* Sliding segmented pill */}
        <div className="seg" id="aseg" data-m={mode}>
          <button
            type="button"
            className={mode === "login" ? "on" : ""}
            data-m="login"
            onClick={() => handleSwitchMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "signup" ? "on" : ""}
            data-m="signup"
            onClick={() => handleSwitchMode("signup")}
          >
            Sign up
          </button>
        </div>

        <h2 id="at" className="cf">
          {mode === "login" ? "Welcome Back! 💜" : "Create Your Account 💜"}
        </h2>
        <p className="sub cf" id="as">
          {mode === "login"
            ? "Login to continue your chat with Karishma."
            : "Join Karishma AI and start your personal AI companion journey."}
        </p>

        {/* Form fields */}
        <form
          id="af"
          className="cf"
          onSubmit={mode === "login" ? handleLoginSubmit : handleSignupSubmit}
          noValidate
        >
          {mode === "login" ? (
            <>
              <label className="afld">
                <svg className="i" viewBox="0 0 24 24">
                  <rect x="2.5" y="5" width="19" height="14" rx="2" />
                  <path d="M3 7l9 6.5L21 7" />
                </svg>
                <input
                  type="text"
                  placeholder="Email or Username"
                  autoComplete="username"
                  aria-label="Email or Username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                />
              </label>

              <label className="afld">
                <svg className="i" viewBox="0 0 24 24">
                  <rect x="4.5" y="10.5" width="15" height="10.5" rx="3" />
                  <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
                </svg>
                <input
                  type={showLoginPwd ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="current-password"
                  aria-label="Password"
                  value={loginPwd}
                  onChange={(e) => setLoginPwd(e.target.value)}
                />
                <button
                  type="button"
                  className="eye"
                  aria-label={showLoginPwd ? "Hide password" : "Show password"}
                  onClick={() => setShowLoginPwd(!showLoginPwd)}
                >
                  {showLoginPwd ? (
                    <svg className="i" viewBox="0 0 24 24">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg className="i" viewBox="0 0 24 24">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="M3.5 3.5l17 17" />
                    </svg>
                  )}
                </button>
              </label>
            </>
          ) : (
            <>
              <label className="afld">
                <svg className="i" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6z" />
                </svg>
                <input
                  type="text"
                  placeholder="Full Name"
                  autoComplete="name"
                  aria-label="Full Name"
                  value={suName}
                  onChange={(e) => setSuName(e.target.value)}
                />
              </label>

              <label className="afld">
                <svg className="i" viewBox="0 0 24 24">
                  <rect x="2.5" y="5" width="19" height="14" rx="2" />
                  <path d="M3 7l9 6.5L21 7" />
                </svg>
                <input
                  type="email"
                  placeholder="Email Address"
                  autoComplete="email"
                  aria-label="Email Address"
                  value={suEmail}
                  onChange={(e) => setSuEmail(e.target.value)}
                />
              </label>

              <label className="afld">
                <svg className="i" viewBox="0 0 24 24">
                  <rect x="4.5" y="10.5" width="15" height="10.5" rx="3" />
                  <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
                </svg>
                <input
                  type={showSuPwd ? "text" : "password"}
                  placeholder="Create Password"
                  autoComplete="new-password"
                  aria-label="Create Password"
                  value={suPwd}
                  onChange={(e) => setSuPwd(e.target.value)}
                />
                <button
                  type="button"
                  className="eye"
                  aria-label={showSuPwd ? "Hide password" : "Show password"}
                  onClick={() => setShowSuPwd(!showSuPwd)}
                >
                  {showSuPwd ? (
                    <svg className="i" viewBox="0 0 24 24">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg className="i" viewBox="0 0 24 24">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="M3.5 3.5l17 17" />
                    </svg>
                  )}
                </button>
              </label>

              <label className="afld">
                <svg className="i" viewBox="0 0 24 24">
                  <rect x="4.5" y="10.5" width="15" height="10.5" rx="3" />
                  <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
                </svg>
                <input
                  type={showSuPwd2 ? "text" : "password"}
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  aria-label="Confirm Password"
                  value={suPwd2}
                  onChange={(e) => setSuPwd2(e.target.value)}
                />
                <button
                  type="button"
                  className="eye"
                  aria-label={showSuPwd2 ? "Hide password" : "Show password"}
                  onClick={() => setShowSuPwd2(!showSuPwd2)}
                >
                  {showSuPwd2 ? (
                    <svg className="i" viewBox="0 0 24 24">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg className="i" viewBox="0 0 24 24">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="M3.5 3.5l17 17" />
                    </svg>
                  )}
                </button>
              </label>

              <label className="achk">
                <input
                  type="checkbox"
                  id="terms"
                  checked={suTerms}
                  onChange={(e) => setSuTerms(e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <a
                    href="#terms"
                    onClick={(e) => {
                      e.preventDefault();
                      notify("Terms & Privacy page coming soon");
                    }}
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#privacy"
                    onClick={(e) => {
                      e.preventDefault();
                      notify("Terms & Privacy page coming soon");
                    }}
                  >
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
            </>
          )}

          <div className="aerr" id="aerr" role="alert">
            {displayError}
          </div>

          <button className="newc" type="submit" disabled={authLoading}>
            {authLoading ? (
              "Please wait..."
            ) : mode === "login" ? (
              <>
                <svg className="i" viewBox="0 0 24 24">
                  <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M3 12h12M10.5 7L15.5 12l-5 5" />
                </svg>
                Login to Karishma AI
              </>
            ) : (
              <>
                <svg className="i" viewBox="0 0 24 24">
                  <circle cx="9.5" cy="7.5" r="4" />
                  <path d="M2.5 21c0-4 3-6.8 7-6.8s7 2.8 7 6.8Z" />
                  <path d="M19 8v6M16 11h6" />
                </svg>
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="aor cf" id="aor">
          {mode === "login" ? "or continue with" : "or sign up with"}
        </div>

        {/* Social sign-in buttons */}
        <div className="asoc">
          <button
            className="rb"
            type="button"
            data-s="Google"
            aria-label="Google"
            onClick={handleGoogle}
          >
            <svg viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.1z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75z"
              />
            </svg>
          </button>
          <button
            className="rb"
            type="button"
            data-s="GitHub"
            aria-label="GitHub"
            onClick={handleGithub}
          >
            <svg viewBox="0 0 24 24">
              <path
                fill="#111"
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              />
            </svg>
          </button>
          <button
            className="rb"
            type="button"
            data-s="Discord"
            aria-label="Discord"
            onClick={() => notify("Discord sign-in coming soon")}
          >
            <svg viewBox="0 0 24 24">
              <path
                fill="#5865F2"
                d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
              />
            </svg>
          </button>
          <button
            className="rb"
            type="button"
            data-s="Microsoft"
            aria-label="Microsoft"
            onClick={() => notify("Microsoft sign-in coming soon")}
          >
            <svg viewBox="0 0 24 24">
              <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
              <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
              <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
              <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
            </svg>
          </button>
        </div>

        {/* Continue as Guest */}
        <button
          type="button"
          className="agst"
          id="aguest"
          onClick={onGuest}
        >
          <svg className="i" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
          </svg>
          Continue as Guest
        </button>
      </section>

      {/* Floating toast notification */}
      <div className={`toast ${toastText ? "on" : ""}`}>{toastText}</div>
    </div>
  );
};

export default LoginPage;
