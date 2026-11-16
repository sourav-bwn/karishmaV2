import { readNotes, writeNotes, type MemoryNote } from "../lib/memory";
import React, { useMemo, useRef, useState } from "react";
import { ButterflySwarm } from "./ButterflySwarm";
import { KarishmaMascot } from "./KarishmaMascot";
import { MEMORY_LAND_DATA_URI } from "../assets/karishmaMemoryArt";

/**
 * Memory page — port of the "#memp" section from "Karishma_AI_main_5.html".
 *
 * Rendered inside .stage while App.tsx has the `mem` class on .main (which
 * shows .mp and hides the chat chrome). The cards are the mockup's categories;
 * "Conversations" opens the existing history panel, the rest toast.
 */

/* Icon paths from the mockup's P set (stroke icons on the .i base class). */
const P: Record<string, string> = {
  brain:
    '<path d="M9.500 3.500A3 3 0 0 0 6.500 6a3 3 0 0 0-2 4.700A3.200 3.200 0 0 0 5 16.500 3 3 0 0 0 9.500 20.500 2.500 2.500 0 0 0 12 18.500V5.500a2 2 0 0 0-2.500-2Z"/><path d="M14.500 3.500A3 3 0 0 1 17.500 6a3 3 0 0 1 2 4.700 3.200 3.200 0 0 1-.5 5.800 3 3 0 0 1-4.500 4A2.500 2.500 0 0 1 12 18.500V5.500a2 2 0 0 1 2.500-2Z"/><path d="M9 9.500a2 2 0 0 0 2 1.500M15 9.500a2 2 0 0 1-2 1.500M8.500 15.500A2 2 0 0 1 10.500 14M15.500 15.500A2 2 0 0 0 13.500 14"/>',
  heart:
    '<path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.600-7 10-7 10Z"/>',
  layers:
    '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.500l9 5 9-5"/>',
  user:
    '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.600-6 8-6s8 2 8 6"/>',
  cap:
    '<path d="M2 9l10-5 10 5-10 5Z"/><path d="M6 11.500V16c0 1.500 2.700 3 6 3s6-1.500 6-3v-4.500M22 9v6"/>',
  code:
    '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  chat:
    '<path d="M21 12a8 8 0 0 1-11.600 7.100L4 20l1-4.600A8 8 0 1 1 21 12Z"/><path d="M8.500 12h.01M12 12h.01M15.500 12h.01" stroke-width="2.800"/>',
  mark:
    '<path d="M6 3h12v18l-6-4.500L6 21Z"/>',
  chev:
    '<path d="M9 5l7 7-7 7"/>',
};

const Ico = ({ n, className }: { n: string; className?: string }) => (
  <svg
    className={className ? `i ${className}` : "i"}
    viewBox="0 0 24 24"
    aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: P[n] }}
  />
);

/* Mockup CARDS: [icon, title, description] */
const CARDS: [string, string, string][] = [
  ["user", "About Me", "Personal details & identity"],
  ["cap", "Education", "Your studies & learning"],
  ["code", "Projects", "Your work & ideas"],
  ["heart", "Preferences", "Your interests & choices"],
  ["chat", "Conversations", "Context from past chats"],
  ["mark", "Important", "Key things to remember"],
];

const MEMORY_KEY = "karishma_memory_enabled";

interface MemoryPageProps {
  onOpenHistory?: () => void;
  onToast?: (msg: string) => void;
}

interface Petal {
  x: string;
  s: string;
  d: string;
  l: string;
  dx: string;
}

export function MemoryPage({ onOpenHistory, onToast }: MemoryPageProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [notes, setNotes] = useState<MemoryNote[]>(readNotes);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const persist = (next: MemoryNote[]) => { try { writeNotes(next); setNotes(next); return true; } catch { onToast?.("Memory storage is full or unavailable. Notes allow 500 characters each, 30 maximum."); return false; } };
  const saveNote = () => { const text = draft.trim(); if (!text || !category) return; const next = editing ? notes.map(n => n.id === editing ? { ...n, text } : n) : [...notes, { id: crypto.randomUUID(), category, text }]; if (persist(next)) { setDraft(""); setEditing(null); onToast?.("Memory saved in this browser. Included in AI requests while memory is on."); } };

  const [memoryOn, setMemoryOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MEMORY_KEY) !== "off";
    } catch {
      return true;
    }
  });

  // 10 petals drifting over the page (mockup: same motion as the login page)
  const petals = useMemo<Petal[]>(
    () =>
      Array.from({ length: 10 }, () => ({
        x: `${40 + Math.random() * 58}%`,
        s: `${10 + Math.random() * 10}px`,
        d: `${12 + Math.random() * 10}s`,
        l: `${-Math.random() * 14}s`,
        dx: `${-40 - Math.random() * 120}px`,
      })),
    [],
  );

  const toggleMemory = () => {
    setMemoryOn((on) => {
      const next = !on;
      try {
        localStorage.setItem(MEMORY_KEY, next ? "on" : "off");
      } catch {}
      return next;
    });
  };

  // Ripple on tapped cards / toggle (mockup: .mp-rp span, removed after the animation)
  const onPointerDown = (e: React.PointerEvent) => {
    const h = (e.target as HTMLElement).closest(".mp-c,.mp-tog") as HTMLElement | null;
    if (!h || !rootRef.current) return;
    const r = h.getBoundingClientRect();
    const d = Math.max(r.width, r.height) / 2;
    const s = document.createElement("span");
    s.className = "mp-rp";
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    h.appendChild(s);
    setTimeout(() => s.remove(), 650);
  };

  const openCard = (title: string) => {
    if (title === "Conversations") {
      onOpenHistory?.();
      return;
    }
    setCategory(title); setDraft(""); setEditing(null);
  };

  return (
    <section className="mp" ref={rootRef} onPointerDown={onPointerDown}>
      <div className="mp-pet" aria-hidden="true">
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
      <div className="cloud mp-cl mp-c1" />
      <div className="cloud mp-cl mp-c2" />

      <header className="mp-h mp-rise flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ "--i": 0 } as React.CSSProperties}>
        <div className="flex items-center gap-4">
          <div className="mp-tile">
            <Ico n="brain" />
          </div>
          <div>
            <h1>
              Memory <Ico n="heart" />
            </h1>
            <p>Manage what Karishma remembers about you.</p>
          </div>
        </div>
        <div className="self-center md:self-auto flex items-center pr-2">
          <KarishmaMascot size="compact" className="compact" greeting="I remember our chats! 🧠💜" />
        </div>
      </header>

      <section
        className={`mp-st card mp-rise${memoryOn ? "" : " off"}`}
        style={{ "--i": 1 } as React.CSSProperties}
      >
        <div className="mp-tile">
          <Ico n="brain" />
        </div>
        <div className="mp-stx">
          <b>
            Memory is <span>{memoryOn ? "ON" : "OFF"}</span>
          </b>
          <span>Karishma can remember your preferences and important context.</span>
        </div>
        <i className="mp-dot" />
        <button
          className="mp-tog"
          role="switch"
          aria-checked={memoryOn}
          aria-label="Toggle memory"
          onClick={toggleMemory}
        >
          <span />
        </button>
      </section>

      <h2 className="mp-sec mp-rise" style={{ "--i": 2 } as React.CSSProperties}>
        <Ico n="layers" />
        Manage Memory
      </h2>

      <div className="mp-g">
        {CARDS.map(([icon, title, desc], i) => (
          <button
            key={title}
            className="mp-c mp-rise"
            style={{ "--i": i + 3 } as React.CSSProperties}
            onClick={() => openCard(title)}
          >
            <span className="mp-ic" style={{ background: `var(--k${i % 6})` }}>
              <Ico n={icon} />
            </span>
            <div>
              <b>{title}</b>
              <span className="t">{desc}</span>
            </div>
            <Ico n="chev" className="ch" />
          </button>
        ))}
      </div>

      <div className="mp-land mp-rise" style={{ "--i": 9 } as React.CSSProperties}>
        <img
          src={MEMORY_LAND_DATA_URI}
          alt="A cat watching the moon rise over a lake, under a blossom tree"
          draggable={false}
        />
        <i className="mp-moon" />
      </div>

      {category && <div className="tp-modal-overlay" onClick={() => setCategory(null)}>
        <div className="tp-modal-card card mvp-memory-editor" role="dialog" aria-modal="true" aria-label={`${category} memory notes`} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between gap-3 mb-4"><h2>{category}</h2><button aria-label="Close memory editor" className="tp-modal-close-btn" onClick={() => setCategory(null)}>×</button></div>
          <p className="text-sm mb-4">Notes stay in this browser, not a cloud account. You choose what is remembered. Do not save secrets.</p>
          <div className="space-y-3 max-h-56 overflow-auto mb-4">{notes.filter(n => n.category === category).map(n => <div key={n.id} className="mvp-memory-entry"><p className="text-sm whitespace-pre-wrap break-words">{n.text}</p><div className="flex gap-4 mt-2"><button className="tp-choice-btn" onClick={() => { setEditing(n.id); setDraft(n.text); }}>Edit</button><button className="tp-choice-btn" onClick={() => persist(notes.filter(other => other.id !== n.id))}>Remove</button></div></div>)}</div>
          <label htmlFor="memory-note-input" className="text-sm">{editing ? "Edit note" : "Add note"}</label>
          <textarea id="memory-note-input" aria-label="Memory note" className="w-full rounded-2xl border p-3 mt-2 bg-white text-sm" maxLength={500} rows={3} value={draft} onChange={e => setDraft(e.target.value)} placeholder="e.g. I prefer short answers in Banglish" />
          <button className="mvp-memory-save" disabled={!draft.trim()} onClick={saveNote}>{editing ? "Update note" : "Save note"}</button>
        </div>
      </div>}
      <ButterflySwarm />
    </section>
  );
}
