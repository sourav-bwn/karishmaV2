import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Sliders,
  Layers,
  Shield,
  Crown,
  Link as LinkIcon,
  Info,
  ChevronRight,
  Camera,
  Edit3,
  LogOut,
  Sparkles,
} from "lucide-react";
import { ButterflySvg } from "./KarishmaBits";

/**
 * AccountPage Component for Karishma AI.
 * Harmonized with the main claymorphic UI (kshell / karishma-ui.css),
 * sharing the same design tokens, color modes (pink & blue), light & dark themes,
 * and typography.
 */

export interface AccountPageProps {
  user: {
    id?: string;
    email?: string;
    fullName?: string;
    name?: string;
    nickname?: string;
    avatarUrl?: string;
    token?: string;
    [key: string]: any;
  } | null;
  isGuest?: boolean;
  userName?: string;
  userNickname?: string;
  userFullName?: string;
  onClose: () => void;
  onNewChat: () => void;
  onNavigate: (view: "Chat" | "Agents" | "Studio" | "Files" | "Projects" | "Tools" | "Explore") => void;
  onOpenMemory: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onUpdateUser: (updatedUser: any) => void;
  onSwitchAccount?: () => void;
  onToast?: (msg: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  user,
  isGuest = false,
  userName = "Soumyajit",
  userNickname = "",
  userFullName = "Soumyajit Ghosh",
  onClose,
  onOpenMemory,
  onLogout,
  onUpdateUser,
  onToast,
}) => {
  // Local fallback toast if onToast isn't provided
  const [localToastMsg, setLocalToastMsg] = useState("");
  const localToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (msg: string) => {
    if (onToast) {
      onToast(msg);
    } else {
      setLocalToastMsg(msg);
      if (localToastTimer.current) clearTimeout(localToastTimer.current);
      localToastTimer.current = setTimeout(() => setLocalToastMsg(""), 1600);
    }
  };

  // Resolved user display info
  const displayName = user?.fullName || userFullName || user?.name || userName || "Soumyajit Ghosh";
  const displayNickname = user?.nickname || userNickname || (displayName.split(" ")[0] || "Soumya");
  const displayHandle = user?.email
    ? user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "")
    : displayNickname.toLowerCase().replace(/[^a-z0-9_]/g, "") || "soumyajit";
  const displayEmail = user?.email || (isGuest ? "guest@karishma.ai" : "soumyajit@example.com");

  // Profile picture: uploaded or default sunset silhouette
  const [customAvatar, setCustomAvatar] = useState<string | null>(() => {
    return user?.avatarUrl || localStorage.getItem("karishma_custom_avatar") || null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active sub-modal state
  type ModalType =
    | "editProfile"
    | "personalization"
    | "memory"
    | "security"
    | "subscription"
    | "connected"
    | "about"
    | "signoutConfirm"
    | null;
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Edit Profile Form state
  const [editName, setEditName] = useState(displayName);
  const [editNick, setEditNick] = useState(displayNickname);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");

  // Personalization settings state
  const [toneMode, setToneMode] = useState<string>(
    () => localStorage.getItem("karishma_tone") || "warm"
  );

  // Change Password state
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    setEditName(displayName);
    setEditNick(displayNickname);
  }, [displayName, displayNickname]);

  // Handle avatar upload
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify("Photo must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomAvatar(dataUrl);
      try {
        localStorage.setItem("karishma_custom_avatar", dataUrl);
      } catch {}
      if (user) {
        onUpdateUser({ ...user, avatarUrl: dataUrl });
      }
      notify("Profile photo updated!");
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Profile
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setProfileSaveError("Name cannot be empty");
      return;
    }
    setIsSavingProfile(true);
    setProfileSaveError("");
    try {
      if (user && user.id) {
        const res = await fetch("/api/auth/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            token: user.token || "legacy",
            fullName: editName.trim(),
            nickname: editNick.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update profile.");
        onUpdateUser({ ...user, ...data.user });
      } else {
        // Guest mode update
        onUpdateUser({
          fullName: editName.trim(),
          nickname: editNick.trim(),
          name: editNick.trim() || editName.trim(),
        });
      }
      notify("Profile updated successfully!");
      setActiveModal(null);
    } catch (err: any) {
      setProfileSaveError(err.message || "Failed to save profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async () => {
    if (!currPassword || !newPassword) {
      setPassError("Please enter both current and new passwords.");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("New password must be at least 6 characters.");
      return;
    }
    setIsChangingPass(true);
    setPassError("");
    setPassSuccess("");
    try {
      if (!user?.id) throw new Error("Please log in to change password.");
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          token: user.token || "legacy",
          currentPassword: currPassword,
          newPassword: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password update failed.");
      setPassSuccess("Password updated securely!");
      setCurrPassword("");
      setNewPassword("");
      notify("Password changed successfully!");
      setTimeout(() => setActiveModal(null), 1200);
    } catch (err: any) {
      setPassError(err.message || "Could not update password.");
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="account-view">
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleAvatarFile}
      />

      {/* Header */}
      <h1>
        Account{" "}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        </svg>
      </h1>
      <p className="lead">Manage your profile, preferences, and account settings.</p>

      {/* Profile Card */}
      <section className="profile">
        <div className="avatar">
          {customAvatar ? (
            <img src={customAvatar} alt={displayName} className="pic" />
          ) : (
            <svg className="pic" viewBox="0 0 160 160">
              <defs>
                <linearGradient id="sky-art" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--pd)" />
                  <stop offset=".55" stopColor="var(--p)" />
                  <stop offset="1" stopColor="var(--bg2)" />
                </linearGradient>
              </defs>
              <rect width="160" height="160" fill="url(#sky-art)" />
              <circle cx="105" cy="105" r="22" fill="#ffd28a" opacity=".85" />
              <path d="M0 128q40-12 80-4t80-6v38H0z" fill="var(--ink)" opacity=".95" />
              <path
                d="M30 130V60M30 90l-18-22M30 78l24-26M30 66l-8-24M30 100l28-14"
                stroke="var(--sf)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="92" cy="96" r="7" fill="var(--sf)" />
              <path d="M82 128q-4-22 8-30l12 2q6 14 0 28z" fill="var(--sf)" />
            </svg>
          )}
          <div
            className="cam"
            onClick={() => {
              notify("Change profile photo");
              fileInputRef.current?.click();
            }}
            title="Change profile photo"
          >
            <Camera className="i" style={{ width: 18, height: 18 }} />
          </div>
        </div>

        <div className="sep" />

        <div className="who">
          <h2>{displayName}</h2>
          <p>@{displayHandle}</p>
          <button
            className="pill"
            onClick={() => {
              notify("Pro Membership Active");
              setActiveModal("subscription");
            }}
          >
            <Crown className="i" style={{ width: 17, height: 17 }} />
            Pro Member
          </button>
        </div>

        <button
          className="edit-btn"
          onClick={() => {
            notify("Edit profile");
            setActiveModal("editProfile");
          }}
        >
          <Edit3 className="i" style={{ width: 16, height: 16 }} />
          Edit Profile
        </button>
      </section>

      {/* 7 Interactive Settings Rows */}
      <div className="account-rows">
        {/* Row 1: Profile Information */}
        <div
          className="account-row"
          onClick={() => {
            notify("Profile Information");
            setActiveModal("editProfile");
          }}
        >
          <div className="row-icon">
            <User className="i" />
          </div>
          <div>
            <b>Profile Information</b>
            <span>Update your name, username, and email</span>
          </div>
          <ChevronRight className="ch" />
        </div>

        {/* Row 2: Personalization */}
        <div
          className="account-row"
          onClick={() => {
            notify("Personalization");
            setActiveModal("personalization");
          }}
        >
          <div className="row-icon">
            <Sliders className="i" />
          </div>
          <div>
            <b>Personalization</b>
            <span>Theme, language, and chat preferences</span>
          </div>
          <ChevronRight className="ch" />
        </div>

        {/* Row 3: Memory & Data */}
        <div
          className="account-row"
          onClick={() => {
            notify("Memory & Data");
            setActiveModal("memory");
          }}
        >
          <div className="row-icon">
            <Layers className="i" />
          </div>
          <div>
            <b>Memory &amp; Data</b>
            <span>Manage saved memories and chat history</span>
          </div>
          <ChevronRight className="ch" />
        </div>

        {/* Row 4: Security & Privacy */}
        <div
          className="account-row"
          onClick={() => {
            notify("Security & Privacy");
            setActiveModal("security");
          }}
        >
          <div className="row-icon">
            <Shield className="i" />
          </div>
          <div>
            <b>Security &amp; Privacy</b>
            <span>Password, 2FA, and data privacy</span>
          </div>
          <ChevronRight className="ch" />
        </div>

        {/* Row 5: Subscription & Plan */}
        <div
          className="account-row"
          onClick={() => {
            notify("Subscription & Plan");
            setActiveModal("subscription");
          }}
        >
          <div className="row-icon">
            <Crown className="i" />
          </div>
          <div>
            <b>Subscription &amp; Plan</b>
            <span>Manage your plan and billing</span>
          </div>
          <button
            className="pill"
            style={{ fontSize: "14px", padding: "6px 14px" }}
            onClick={(e) => {
              e.stopPropagation();
              notify("Pro Plan");
              setActiveModal("subscription");
            }}
          >
            <Crown className="i" style={{ width: 14, height: 14 }} />
            Pro Plan ›
          </button>
        </div>

        {/* Row 6: Connected Accounts */}
        <div
          className="account-row"
          onClick={() => {
            notify("Connected Accounts");
            setActiveModal("connected");
          }}
        >
          <div className="row-icon">
            <LinkIcon className="i" />
          </div>
          <div>
            <b>Connected Accounts</b>
            <span>Google, GitHub, and other sign-in methods</span>
          </div>
          <ChevronRight className="ch" />
        </div>

        {/* Row 7: About Karishma AI (spans full width on desktop) */}
        <div
          className="account-row"
          onClick={() => {
            notify("About Karishma AI");
            setActiveModal("about");
          }}
        >
          <div className="row-icon">
            <Info className="i" />
          </div>
          <div>
            <b>About Karishma AI</b>
            <span>App version, updates, and policies</span>
          </div>
          <span className="ver">v2.0.0</span>
          <ChevronRight className="ch" />
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        className="account-signout"
        onClick={() => {
          setActiveModal("signoutConfirm");
        }}
      >
        <LogOut className="i" style={{ width: 20, height: 20 }} />
        Sign Out
      </button>

      {/* Local Toast if needed */}
      {localToastMsg && (
        <div className="toast on" role="status">
          {localToastMsg}
        </div>
      )}

      {/* ---------------- Sub-Modals (Matching Main Clay UI) ---------------- */}

      {/* Edit Profile Modal */}
      {activeModal === "editProfile" && (
        <div className="kmodal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="kmodal-box" onClick={(e) => e.stopPropagation()}>
            <button className="kmodal-close" onClick={() => setActiveModal(null)}>
              ✕
            </button>
            <h2 className="kmodal-title">Edit Profile</h2>
            <p className="kmodal-desc">
              Update your personal details and how Karishma speaks to you.
            </p>

            {profileSaveError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "#ffe0ea",
                  color: "#d1124f",
                  marginBottom: 14,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {profileSaveError}
              </div>
            )}

            <label className="kmodal-label">Full Name</label>
            <input
              type="text"
              className="kmodal-field"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Soumyajit Ghosh"
            />

            <label className="kmodal-label">Nickname (What Karishma calls you)</label>
            <input
              type="text"
              className="kmodal-field"
              value={editNick}
              onChange={(e) => setEditNick(e.target.value)}
              placeholder="e.g. Soumya"
            />

            <label className="kmodal-label">Email Address</label>
            <input
              type="email"
              disabled
              className="kmodal-field"
              value={displayEmail}
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                className="edit-btn"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </button>
              <button
                className="newc"
                disabled={isSavingProfile}
                style={{ flex: 1, justifyContent: "center", fontSize: 15 }}
                onClick={handleSaveProfile}
              >
                {isSavingProfile ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personalization Modal */}
      {activeModal === "personalization" && (
        <div className="kmodal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="kmodal-box" onClick={(e) => e.stopPropagation()}>
            <button className="kmodal-close" onClick={() => setActiveModal(null)}>
              ✕
            </button>
            <h2 className="kmodal-title">Personalization</h2>
            <p className="kmodal-desc">
              Customize conversation tone and companion personality.
            </p>

            <label className="kmodal-label">Karishma's Chat Demeanor</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {[
                { id: "warm", label: "Warm & Caring (Empathetic Best Friend)" },
                { id: "playful", label: "Playful & Vibrant (Humorous & Fun)" },
                { id: "smart", label: "Concise & Productive (Direct Assistant)" },
              ].map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "var(--sf)",
                    boxShadow: toneMode === t.id ? "var(--bsh)" : "var(--c2)",
                    border: toneMode === t.id ? "2px solid var(--p)" : "1px solid transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setToneMode(t.id);
                    localStorage.setItem("karishma_tone", t.id);
                    notify(`Tone set to ${t.label.split(" ")[0]}`);
                  }}
                >
                  <span>{toneMode === t.id ? "💖" : "⚪"}</span>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: "12px 14px",
                borderRadius: 16,
                background: "var(--sf)",
                boxShadow: "var(--pit)",
                fontSize: 13,
                color: "var(--mute)",
                marginBottom: 16,
                fontWeight: 600,
              }}
            >
              💡 <b>Tip:</b> You can also toggle the Pink / Blue accent palette and Light / Dark theme using the header buttons at the top right of the screen!
            </div>

            <button
              className="newc"
              style={{ width: "100%", justifyContent: "center", fontSize: 15 }}
              onClick={() => {
                notify("Preferences saved!");
                setActiveModal(null);
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Memory & Data Modal */}
      {activeModal === "memory" && (
        <div className="kmodal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="kmodal-box" onClick={(e) => e.stopPropagation()}>
            <button className="kmodal-close" onClick={() => setActiveModal(null)}>
              ✕
            </button>
            <h2 className="kmodal-title">Memory &amp; Data</h2>
            <p className="kmodal-desc">
              Review remembered memories, export archives, or manage sessions.
            </p>

            <div
              style={{
                background: "var(--sf)",
                borderRadius: 18,
                padding: "16px 18px",
                marginBottom: 18,
                boxShadow: "var(--pit)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: "var(--mute)", fontSize: 13 }}>
                  Memory Persistence:
                </span>
                <b style={{ color: "var(--p)", fontSize: 13 }}>Active &amp; Synced ✨</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: "var(--mute)", fontSize: 13 }}>
                  Backup Cloud:
                </span>
                <b style={{ color: "var(--ink)", fontSize: 13 }}>Google Cloud Firestore</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, color: "var(--mute)", fontSize: 13 }}>
                  Client Cache:
                </span>
                <b style={{ color: "var(--pd)", fontSize: 13 }}>Clean &amp; Optimized</b>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="edit-btn"
                style={{ justifyContent: "center" }}
                onClick={() => {
                  setActiveModal(null);
                  onOpenMemory();
                }}
              >
                Open Memory Drawer
              </button>

              <button
                className="edit-btn"
                style={{ justifyContent: "center" }}
                onClick={() => {
                  notify("Preparing export JSON…");
                  try {
                    const dataStr =
                      "data:text/json;charset=utf-8," +
                      encodeURIComponent(
                        JSON.stringify(
                          {
                            user: displayName,
                            exportedAt: new Date().toISOString(),
                            chats: JSON.parse(
                              localStorage.getItem("karishma_chat_history") || "[]"
                            ),
                          },
                          null,
                          2
                        )
                      );
                    const dl = document.createElement("a");
                    dl.setAttribute("href", dataStr);
                    dl.setAttribute("download", `karishma-data-${Date.now()}.json`);
                    document.body.appendChild(dl);
                    dl.click();
                    dl.remove();
                    notify("Data downloaded!");
                  } catch {
                    notify("Export failed.");
                  }
                }}
              >
                Export Chat &amp; Memory Archive
              </button>

              <button
                className="newc"
                style={{ justifyContent: "center", fontSize: 15 }}
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security & Privacy Modal */}
      {activeModal === "security" && (
        <div className="kmodal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="kmodal-box" onClick={(e) => e.stopPropagation()}>
            <button className="kmodal-close" onClick={() => setActiveModal(null)}>
              ✕
            </button>
            <h2 className="kmodal-title">Security &amp; Privacy</h2>
            <p className="kmodal-desc">
              Manage account password, token sessions, and protection.
            </p>

            {passError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "#ffe0ea",
                  color: "#d1124f",
                  marginBottom: 14,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {passError}
              </div>
            )}
            {passSuccess && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "#e0ffe8",
                  color: "#128a38",
                  marginBottom: 14,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {passSuccess}
              </div>
            )}

            <label className="kmodal-label">Current Password</label>
            <input
              type="password"
              className="kmodal-field"
              value={currPassword}
              onChange={(e) => setCurrPassword(e.target.value)}
              placeholder="••••••••"
            />

            <label className="kmodal-label">New Password</label>
            <input
              type="password"
              className="kmodal-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button
                className="edit-btn"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </button>
              <button
                className="newc"
                disabled={isChangingPass}
                style={{ flex: 1, justifyContent: "center", fontSize: 15 }}
                onClick={handleChangePassword}
              >
                {isChangingPass ? "Updating…" : "Update Password"}
              </button>
            </div>

            <div
              style={{
                marginTop: 18,
                paddingTop: 14,
                borderTop: "1px solid var(--lav)",
                fontSize: 12.5,
                color: "var(--mute)",
                fontWeight: 600,
              }}
            >
              <b>Guest-only MVP:</b> This browser stores your data. No account authentication, encryption or cloud sync is connected.
            </div>
          </div>
        </div>
      )}

      {/* Subscription & Plan Modal */}
      {activeModal === "subscription" && (
        <div className="kmodal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="kmodal-box" onClick={(e) => e.stopPropagation()}>
            <button className="kmodal-close" onClick={() => setActiveModal(null)}>
              ✕
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Crown className="i" style={{ color: "var(--p)" }} />
              <h2 className="kmodal-title" style={{ margin: 0 }}>
                Pro Membership
              </h2>
            </div>
            <p className="kmodal-desc">
              Enjoy full unlimited access to Karishma AI intelligence suite.
            </p>

            <div
              style={{
                background: "var(--btn)",
                borderRadius: 22,
                padding: "20px",
                color: "#fff",
                marginBottom: 18,
                boxShadow: "var(--bsh)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  fontWeight: 800,
                  opacity: 0.9,
                }}
              >
                Current Subscription
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                Karishma AI Pro ✨
              </div>
              <div style={{ fontSize: 13, opacity: 0.95, marginTop: 2 }}>
                Complimentary VIP Access • No Expiration
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
              {[
                "Unlimited high-speed reasoning chats",
                "Advanced emotional memory with lifetime recall",
                "Multimodal audio & vision perception",
                "Zero rate limits & top GPU priority",
                "Early access to upcoming tools & agents",
              ].map((feat) => (
                <div
                  key={feat}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink)",
                  }}
                >
                  <span style={{ color: "var(--p)", fontSize: 16 }}>✓</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <button
              className="newc"
              style={{ width: "100%", justifyContent: "center", fontSize: 15 }}
              onClick={() => {
                notify("Enjoy your Pro Membership!");
                setActiveModal(null);
              }}
            >
              Keep Enjoying Pro
            </button>
          </div>
        </div>
      )}

      {/* Connected Accounts Modal */}
      {activeModal === "connected" && (
        <div className="kmodal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="kmodal-box" onClick={(e) => e.stopPropagation()}>
            <button className="kmodal-close" onClick={() => setActiveModal(null)}>
              ✕
            </button>
            <h2 className="kmodal-title">Connected Accounts</h2>
            <p className="kmodal-desc">
              Seamless sign-in providers linked to your Karishma profile.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 16,
                  background: "var(--sf)",
                  boxShadow: "var(--c2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🇬</span>
                  <div>
                    <b style={{ display: "block", color: "var(--ink)", fontSize: 14 }}>Google</b>
                    <small style={{ color: "var(--mute)" }}>
                      {user?.email ? user.email : "Linked account"}
                    </small>
                  </div>
                </div>
                <span
                  style={{
                    color: user?.email ? "#128a38" : "var(--mute)",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {user?.email ? "Connected" : "Available"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 16,
                  background: "var(--sf)",
                  boxShadow: "var(--c2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🐙</span>
                  <div>
                    <b style={{ display: "block", color: "var(--ink)", fontSize: 14 }}>GitHub</b>
                    <small style={{ color: "var(--mute)" }}>
                      {user?.githubId ? "Connected" : "Sync developer tools"}
                    </small>
                  </div>
                </div>
                {user?.githubId ? (
                  <span
                    style={{
                      color: "#128a38",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    Connected
                  </span>
                ) : (
                  <button
                    className="edit-btn"
                    style={{ padding: "5px 12px", fontSize: 12 }}
                    onClick={() => {
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
                    }}
                  >
                    Link
                  </button>
                )}
              </div>
            </div>

            <button
              className="newc"
              style={{ width: "100%", justifyContent: "center", fontSize: 15 }}
              onClick={() => setActiveModal(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* About Modal */}
      {activeModal === "about" && (
        <div className="kmodal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="kmodal-box" onClick={(e) => e.stopPropagation()}>
            <button className="kmodal-close" onClick={() => setActiveModal(null)}>
              ✕
            </button>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, margin: "0 auto" }}>
                <ButterflySvg style={{ width: "100%", height: "100%" }} />
              </div>
              <h2 className="kmodal-title" style={{ marginTop: 6 }}>
                Karishma AI
              </h2>
              <span className="ver" style={{ fontSize: 14 }}>
                Version 2.0.0 (Production)
              </span>
            </div>

            <p
              style={{
                color: "var(--mute)",
                fontSize: 14,
                lineHeight: 1.55,
                textAlign: "center",
                marginBottom: 18,
                fontWeight: 600,
              }}
            >
              Karishma is your warm, emotionally expressive, and highly capable AI companion designed by{" "}
              <b>Soumyajit Ghosh</b>.
            </p>

            <div
              style={{
                background: "var(--sf)",
                borderRadius: 16,
                padding: "14px 16px",
                marginBottom: 18,
                boxShadow: "var(--pit)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "var(--mute)", fontWeight: 700 }}>Engine:</span>
                <b style={{ color: "var(--ink)" }}>Neural Multi-Provider Hybrid</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "var(--mute)", fontWeight: 700 }}>Self-Healing Protocol:</span>
                <b style={{ color: "#128a38" }}>Active &amp; Monitoring</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--mute)", fontWeight: 700 }}>System Health:</span>
                <b style={{ color: "var(--p)" }}>100% Operational</b>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="edit-btn"
                style={{ flex: 1, justifyContent: "center", fontSize: 13 }}
                onClick={() => notify("You are on the latest version!")}
              >
                Check Updates
              </button>
              <button
                className="newc"
                style={{ flex: 1, justifyContent: "center", fontSize: 14 }}
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {activeModal === "signoutConfirm" && (
        <div className="kmodal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="kmodal-box" onClick={(e) => e.stopPropagation()}>
            <button className="kmodal-close" onClick={() => setActiveModal(null)}>
              ✕
            </button>
            <h2 className="kmodal-title" style={{ color: "#f0245f" }}>
              Sign Out
            </h2>
            <p className="kmodal-desc">
              Are you sure you want to sign out of Karishma AI? Your conversations remain safely stored in cloud backup.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="edit-btn"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </button>
              <button
                className="account-signout"
                style={{
                  flex: 1,
                  margin: 0,
                  padding: "12px",
                  fontSize: 15,
                  justifyContent: "center",
                  background: "#f0245f",
                  color: "#fff",
                  boxShadow: "none",
                }}
                onClick={() => {
                  notify("Signing out…");
                  setActiveModal(null);
                  onLogout();
                }}
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
