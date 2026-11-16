import React, { useEffect, useRef } from "react";
import { KARISHMA_MASCOT_DATA_URI } from "../assets/karishmaMascotBase64";

/**
 * Karishma — the interactive robot mascot.
 *
 * Exact implementation ported from the prototype (viewBox 368x446, calm motion,
 * precise SVG face placement, steam overlay, and interactive touch regions).
 */
const MASCOT_SRC = "/karishma-mascot.webp";

/* Face expression geometry (viewBox 368x446, anchored on face at 210, 164) */
const FA = "M-34 10C-30 -26 30 -26 34 10";
const FE = (l: string, r: string = l) => `<g transform="translate(-64.5 0)">${l}</g><g transform="translate(64.5 0)">${r}</g>`;
const FM = (d: string) => `<g transform="translate(3.5 40)"><path class="s sm" d="${d}"/></g>`;
const ARC = `<path class="s" d="${FA}"/>`;
const SMILE = FM("M-18 -2Q0 14 18 -2");
const OV = 'fill="#f6edff"';
const PP = 'fill="#5b24b0"';

const BK_HTML =
  `<ellipse cx="-115" cy="35" rx="15" ry="8" fill="#ff8db5"/>` +
  `<path d="M-120 31v8M-111 31v8" stroke="#ffd0e0" stroke-width="2.500"/>` +
  `<ellipse cx="94" cy="29" rx="15" ry="8" fill="#ff8db5"/>` +
  `<path d="M89 25v8M98 25v8" stroke="#ffd0e0" stroke-width="2.500"/>`;

const FX: Record<string, [string, string]> = {
  happy: ["p", FE(ARC) + SMILE],
  laugh: ["p", FE(ARC) + `<g transform="translate(3.5 38)"><path d="M-22 -6Q0 -2 22 -6Q20 24 0 24Q-20 24 -22 -6Z" fill="#7a2fc9" stroke="#f6edff" stroke-width="5" stroke-linejoin="round"/><ellipse cy="17" rx="9" ry="5" fill="#ff8db5"/></g>`],
  love: ["k", FE(`<path class="hrt" d="M0 16C-34 -6 -22 -34 0 -16C22 -34 34 -6 0 16Z" fill="#ff9be0" stroke="#fff" stroke-width="3"/>`) + SMILE],
  angry: ["r", FE(`<path class="s" d="M-34 -14L32 8"/>`, `<path class="s" d="M-32 8L34 -14"/>`) + FM("M-20 12Q0 -8 20 12")],
  annoyed: ["p", FE(`<path d="M-26 0H26A26 18 0 0 1 -26 0Z" ${OV} stroke="#f6edff" stroke-width="6" stroke-linejoin="round"/>`) + FM("M-14 4H14")],
  sad: ["b", FE(`<ellipse rx="17" ry="22" fill="#e6f1ff"/><circle cx="-5" cy="-6" r="6" fill="#8fb4ff"/><path class="s" style="stroke-width:5" d="M-30 -32L28 -42"/>`, `<ellipse rx="17" ry="22" fill="#e6f1ff"/><circle cx="-5" cy="-6" r="6" fill="#8fb4ff"/><path class="s" style="stroke-width:5" d="M-28 -42L30 -32"/>`) + `<path class="tear" d="M-64 24q-8 14 0 18q8 -4 0 -18Z" fill="#9fd8ff"/>` + FM("M-14 8Q0 -6 14 8")],
  surprised: ["p", FE(`<circle r="20" class="s" style="stroke-width:8"/><circle r="5" ${OV}/>`) + `<g transform="translate(3.5 46)"><ellipse rx="9" ry="12" class="s sm"/></g>`],
  sleepy: ["p", FE(`<path class="s" d="M-30 0Q0 16 30 0"/>`) + FM("M-8 4Q0 10 8 4")],
  wink: ["p", FE(`<circle r="18" class="s" style="stroke-width:8"/><circle cx="3" cy="3" r="7" ${OV}/>`, ARC) + SMILE],
  dizzy: ["p", FE(`<path class="s spn" style="stroke-width:5" d="M0 0a4 4 0 1 1 8 0a9 9 0 1 1 -18 0a14 14 0 1 1 28 0a19 19 0 1 1 -38 0"/>`) + FM("M-16 4Q-8 -4 0 4T16 4")],
  open: ["p", FE(`<ellipse class="eye" rx="16" ry="22" ${OV}/><circle class="pp" r="8" ${PP}/>`) + FM("M-14 0Q0 10 14 0")],
  shy: ["k", FE(`<ellipse rx="14" ry="18" ${OV}/><circle cx="-4" cy="6" r="7" ${PP}/>`) + FM("M-14 4Q-7 12 0 4Q7 -4 14 4")],
};

const STEAM_HTML =
  `<defs><filter id="stb" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter></defs>` +
  (() => {
    const W1 = "M0 0C-12 -16 12 -30 0 -46S-11 -70 2 -86";
    return (
      `<g transform="translate(272 270) scale(.5)"><path class="sw d" d="${W1}"/></g>` +
      `<g transform="translate(286 269) scale(.5)"><path class="sw" d="${W1}"/></g>` +
      `<g transform="translate(300 269) scale(.5)"><path class="sw c" d="${W1}"/></g>` +
      `<g transform="translate(312 271) scale(.5)"><path class="sw b" d="${W1}"/></g>`
    );
  })();

interface KarishmaMascotProps {
  userName?: string;
  className?: string;
  size?: "hero" | "compact" | "mini";
  greeting?: string;
}

export function KarishmaMascot({ userName, className, size = "hero", greeting }: KarishmaMascotProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<SVGSVGElement>(null);
  const userNameRef = useRef(userName);
  userNameRef.current = userName;
  const greetingRef = useRef(greeting);
  greetingRef.current = greeting;

  useEffect(() => {
    const rw = rootRef.current;
    const fc = faceRef.current;
    if (!rw || !fc) return;
    const rr = rw.querySelector<HTMLElement>(".rr");
    const hg = rw.querySelector<HTMLElement>(".hg");
    const sy = rw.querySelector<HTMLElement>(".say");
    if (!rr || !hg || !sy) return;

    const R = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];
    const later = (fn: () => void, ms: number) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
    const every = (fn: () => void, ms: number) => { const i = setInterval(fn, ms); intervals.push(i); return i; };

    let taps: number[] = [], sleeping = false, lp = 0, lpf = false, pi: ReturnType<typeof setInterval> | undefined, idle: ReturnType<typeof setTimeout> | undefined, cur = "happy", ft: ReturnType<typeof setTimeout> | undefined, mt: ReturnType<typeof setTimeout> | undefined, sayT: ReturnType<typeof setTimeout> | undefined, zi: ReturnType<typeof setInterval> | undefined;
    let belly: number[] = [], pats: number[] = [];

    const say = (t: string, ms = 2300) => {
      sy.textContent = t;
      sy.classList.add("on");
      clearTimeout(sayT);
      sayT = setTimeout(() => sy.classList.remove("on"), ms);
    };
    const react = (c: string) => {
      rr.className = "rr";
      void rr.offsetWidth;
      rr.classList.add(c);
      timers.push(setTimeout(() => { rr.className = "rr"; }, 1700));
    };
    const pop = (chars: string[], n: number) => {
      if (!rw.offsetParent) return;
      n = Math.max(1, Math.round(n * 0.4));
      for (let i = 0; i < n; i++) {
        const e = document.createElement("span");
        e.className = "pt";
        e.textContent = R(chars);
        e.style.left = (20 + Math.random() * 60) + "%";
        e.style.top = (10 + Math.random() * 40) + "%";
        e.style.setProperty("--dx", (Math.random() * 80 - 40) + "px");
        e.style.setProperty("--rot", (Math.random() * 60 - 30) + "deg");
        e.style.animationDelay = (i * 80) + "ms";
        rw.appendChild(e);
        timers.push(setTimeout(() => e.remove(), 1900));
      }
    };
    const pulse = () => {
      hg.classList.remove("on");
      void hg.offsetWidth;
      hg.classList.add("on");
    };
    const blush = (ms: number) => {
      rw.classList.add("blush");
      timers.push(setTimeout(() => rw.classList.remove("blush"), ms));
    };

    const NB = ["happy", "laugh", "love", "wink", "shy", "open"];
    const showF = (n: string) => {
      cur = n;
      fc.classList.toggle("cv", n !== "happy");
      fc.querySelectorAll(".ex").forEach((g) => g.classList.toggle("on", (g as HTMLElement).dataset.n === n));
      fc.classList.toggle("nb", !NB.includes(n));
    };
    const base = () =>
      sleeping ? "sleepy"
      : rw.classList.contains("m-sulk") ? "sad"
      : rw.classList.contains("m-angry") ? "angry"
      : rw.classList.contains("m-annoyed") ? "annoyed"
      : "happy";
    const setFace = (n: string, ms?: number) => {
      showF(n);
      clearTimeout(ft);
      if (ms) ft = setTimeout(() => showF(base()), ms);
    };
    showF("happy");

    // Eyes follow the pointer while the "open" face is active
    const onPupilMove = (e: PointerEvent) => {
      if (cur !== "open") return;
      const r = fc.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width * 0.58);
      const dy = e.clientY - (r.top + r.height * 0.37);
      const k = Math.hypot(dx, dy) || 1;
      const m = Math.min(6, k / 30);
      fc.querySelectorAll(".pp").forEach((p) => p.setAttribute("transform", `translate(${(dx / k * m).toFixed(1)} ${(dy / k * m).toFixed(1)})`));
    };
    window.addEventListener("pointermove", onPupilMove, { passive: true });

    // Periodic idle expressions (blink / wink) while happy
    every(() => {
      if (rw.offsetParent && cur === "happy" && base() === "happy" && !rw.classList.contains("purr")) {
        setFace(R(["open", "open", "wink"]), R([2400, 1300]));
      }
    }, 7000);

    const region = (e?: PointerEvent | MouseEvent): string => {
      if (!e || e.clientX === undefined || (!e.clientX && !e.clientY)) return "";
      const r = rr.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      if (y < 0.27 && x < 0.6) return "bow";
      if (y < 0.52) return "head";
      if (y > 0.82) return "feet";
      if (x > 0.62 && y < 0.8) return "mug";
      if (x > 0.2 && x < 0.8) return "belly";
      return "";
    };

    const setMood = (m: string, ms?: number) => {
      rw.classList.remove("m-happy", "m-annoyed", "m-angry", "m-sulk");
      clearTimeout(mt);
      if (m) {
        rw.classList.add("m-" + m);
        mt = setTimeout(() => {
          if (m === "angry") { setMood("sulk", 12000); say("Hmph… I'm not talking to you 😤", 3000); }
          else if (m === "sulk") { setMood("", 0); say("…Okay, I'm not mad anymore 🙂", 2500); }
          else setMood("", 0);
        }, ms);
      }
      setFace(base());
    };

    const wake = () => {
      if (!sleeping) return;
      sleeping = false;
      rw.classList.remove("sleep");
      clearInterval(zi);
      setFace("surprised", 1200);
      say("Oh! You're back! 💜");
      pop(["✨", "💜"], 4);
      react("jump");
    };

    const regionTap = (rg: string): boolean => {
      const n = Date.now();
      if (rg === "head") {
        pats = pats.filter((t) => n - t < 5000);
        pats.push(n);
        if (rw.classList.contains("m-angry") || rw.classList.contains("m-sulk")) {
          setMood("happy", 4000); belly = [];
          setFace("love", 2600); say("…Okay, I forgive you 🥺💜", 3000);
          pop(["💜", "💗"], 5); blush(2200); react("shy"); pulse();
          return true;
        }
        setMood("happy", 4500);
        setFace(pats.length >= 3 ? "love" : "happy", 2800);
        blush(2500); pulse(); react("squish");
        say(pats.length < 2 ? "Ooh, that feels nice… 😊" : pats.length < 4 ? "Mmm, I love head pats! 🥰" : "I'm melting… 😍", 2600);
        pop(["💜", "💗", "✨"], 3 + pats.length);
        return true;
      }
      if (rg === "belly") {
        belly = belly.filter((t) => n - t < 7000);
        belly.push(n);
        const c = belly.length;
        if (c === 1) { setFace("laugh", 1400); react("squish"); say("Hehe! That tickles! 😆"); pop(["😆", "✨"], 2); }
        else if (c === 2) { setFace("laugh", 1400); react("wiggle"); say("Hehehe… okay, that tickles! 😄"); pop(["😄"], 2); }
        else if (c === 3) { setMood("annoyed", 5000); react("wiggle"); say("Hey… please stop poking my tummy 😒"); pop(["😒"], 1); }
        else if (c === 4) { setMood("angry", 5000); react("shake"); say("I said STOP! 😠", 2500); pop(["💢"], 3); }
        else { setMood("angry", 6000); react("shake"); say(R(["GRRR! Stop it! 😤", "That's it, I'm mad! 😡", "Hmph!! Hands off! 💢"]), 2500); pop(["💢", "💨", "😤"], 5); }
        return true;
      }
      if (rg === "feet") { setFace("laugh", 1500); react("jump"); say("Hehe, my toes! 🦶😆"); pop(["😆"], 3); return true; }
      if (rg === "mug") { setFace("surprised", 1600); react("wiggle"); say("Careful, my tea! ☕😳"); pop(["💦"], 2); return true; }
      if (rg === "bow") { setFace("shy", 1800); react("shy"); blush(1800); say("Do you like my bow? 🎀"); pop(["🎀", "💜"], 3); return true; }
      return false;
    };

    const tap = (rg: string) => {
      wake();
      if (rg && regionTap(rg)) return;
      const n = Date.now();
      taps = taps.filter((t) => n - t < 2500);
      taps.push(n);
      pulse();
      if (taps.length >= 5) {
        taps = [];
        setFace("dizzy", 1700); react("dizzy"); say("Whoa… I'm getting dizzy! 🌀", 2600); pop(["🌀", "⭐", "💫"], 6);
        return;
      }
      if (taps.length >= 2 && n - taps[taps.length - 2] < 350) {
        setFace("laugh", 1400); react("jump"); say("Wheee! 🦋"); pop(["🦋", "✨", "💜"], 6);
        return;
      }
      const k = R(["squish", "wiggle", "shy", "spin"]);
      react(k);
      setFace(k === "shy" ? "shy" : k === "spin" ? "surprised" : R(["wink", "laugh", "open"]), 1600);
      if (k === "shy") { blush(1800); say(R(["Oh! You're making me blush 🥰", "Hehe, that tickles! 💜"])); pop(["💗", "💜"], 4); }
      else if (k === "spin") { say("Ta-da! ✨"); pop(["✨", "🦋"], 5); }
      else { say(R(["Hi hi! 👋", "Boop! ✨", "You found me! 🦋", "Hehe! 💜"])); pop(["💜", "✨"], 3); }
    };

    const purr = () => {
      wake();
      rw.classList.add("purr", "blush");
      setFace("love");
      say("Aww, that feels nice… 💜", 4000);
      pulse();
      pi = every(() => { pop(["💜", "💗"], 2); pulse(); }, 700);
    };
    const endPurr = () => {
      clearTimeout(lp);
      if (pi) { clearInterval(pi); pi = undefined; }
      rw.classList.remove("press");
      if (rw.classList.contains("purr")) {
        rw.classList.remove("purr");
        setFace(base());
        timers.push(setTimeout(() => rw.classList.remove("blush"), 900));
        say("Thank you! 🥰", 1800);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      lpf = false;
      rgdRef.current = region(e);
      rw.classList.add("press");
      clearTimeout(lp);
      lp = window.setTimeout(() => {
        lpf = true;
        if (rgdRef.current === "belly") {
          setMood("angry", 4000); react("shake"); say("Hey! Let go of my tummy! 😠", 2500); pop(["💢"], 3);
        } else {
          if (rgdRef.current === "head") setMood("happy", 4000);
          purr();
        }
      }, 600);
    };
    const rgdRef = { current: "" };
    const onClick = (e: MouseEvent) => {
      if (lpf) { lpf = false; return; }
      tap(region(e));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(""); }
    };
    rw.addEventListener("pointerdown", onPointerDown);
    (["pointerup", "pointercancel", "pointerleave"] as const).forEach((ev) => rw.addEventListener(ev, endPurr));
    rw.addEventListener("click", onClick);
    rw.addEventListener("keydown", onKey);

    const sleepy = () => {
      if (sleeping || !rw.offsetParent) return;
      sleeping = true;
      rw.classList.add("sleep");
      setFace("sleepy");
      say("Zzz… 😴", 3000);
      zi = every(() => pop(["💤"], 1), 2600);
    };
    const bump = () => {
      clearTimeout(idle);
      if (!sleeping) idle = setTimeout(sleepy, 30000);
    };
    (["pointerdown", "keydown", "pointermove"] as const).forEach((ev) => window.addEventListener(ev, bump, { passive: true }));
    bump();

    // Welcome line shortly after mount
    const greet = later(() => {
      if (rw.offsetParent) {
        const welcomeText = greetingRef.current || `Hi ${userNameRef.current || "there"}! Tap me 💜`;
        say(welcomeText, 3400);
        react("wiggle");
        setFace("wink", 1800);
      }
    }, 1200);

    // 3D tilt following the pointer across the hero area (gentle tilt: x*4, y*-3)
    const hero = rw.parentElement;
    const onTilt = (e: PointerEvent) => {
      if (!hero) return;
      const r = rw.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      rw.style.transform = `rotateY(${(x * 4).toFixed(1)}deg) rotateX(${(-y * 3).toFixed(1)}deg)`;
    };
    const onTiltLeave = () => { rw.style.transform = ""; };
    if (hero && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      hero.addEventListener("pointermove", onTilt);
      hero.addEventListener("pointerleave", onTiltLeave);
    }

    return () => {
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
      clearTimeout(lp); clearTimeout(idle); clearTimeout(sayT); clearTimeout(ft); clearTimeout(mt);
      if (pi) clearInterval(pi);
      if (zi) clearInterval(zi);
      clearTimeout(greet);
      window.removeEventListener("pointermove", onPupilMove);
      (["pointerdown", "keydown", "pointermove"] as const).forEach((ev) => window.removeEventListener(ev, bump));
      rw.removeEventListener("pointerdown", onPointerDown);
      (["pointerup", "pointercancel", "pointerleave"] as const).forEach((ev) => rw.removeEventListener(ev, endPurr));
      rw.removeEventListener("click", onClick);
      rw.removeEventListener("keydown", onKey);
      if (hero) {
        hero.removeEventListener("pointermove", onTilt);
        hero.removeEventListener("pointerleave", onTiltLeave);
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`rw ${size !== "hero" ? size : ""} ${className ?? ""}`.trim()}
      tabIndex={0}
      role="button"
      aria-label="Karishma the robot. Tap, double-tap or press and hold to play."
    >
      <div className="gs" />
      <div className="say" aria-live="polite" />
      <div className="bob">
        <div className="rr">
          <img
            draggable={false}
            src={MASCOT_SRC}
            onError={(e) => {
              if (KARISHMA_MASCOT_DATA_URI && e.currentTarget.src !== KARISHMA_MASCOT_DATA_URI) {
                e.currentTarget.src = KARISHMA_MASCOT_DATA_URI;
              }
            }}
            alt="Karishma, the cute 3D robot mascot"
            width={368}
            height={446}
          />
          <i className="hg" />
          <svg ref={faceRef} className="face" viewBox="0 0 368 446" preserveAspectRatio="none" aria-hidden="true">
            <g transform="translate(210 164) rotate(-12.8) scale(.7)">
              <g className="bk" dangerouslySetInnerHTML={{ __html: BK_HTML }} />
              {Object.entries(FX).map(([n, [c, h]]) => (
                <g key={n} className={`ex g-${c}`} data-n={n} dangerouslySetInnerHTML={{ __html: h }} />
              ))}
            </g>
          </svg>
          <svg className="steam" viewBox="0 0 368 446" preserveAspectRatio="none" aria-hidden="true" dangerouslySetInnerHTML={{ __html: STEAM_HTML }} />
        </div>
      </div>
    </div>
  );
}
