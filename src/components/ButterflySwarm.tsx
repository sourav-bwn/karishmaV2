import React, { useEffect, useRef } from "react";
import { BUTTERFLY_SPRITES } from "../assets/karishmaMemoryArt";

/**
 * Butterfly swarm for the Memory page.
 *
 * Exact port of the flight engine in "Karishma_AI_main_5.html": two sprite
 * butterflies (PNG wing frames, rotateY flap) and three gradient SVG
 * butterflies wander with steering physics over the page. Pauses whenever the
 * container is hidden (display:none) and falls back to static placement under
 * prefers-reduced-motion.
 */

/* Gradient pairs and spawn fractions of the three SVG butterflies (mockup COL/FRAC). */
const COL: [string, string][] = [
  ["var(--b1)", "var(--b2)"],
  ["var(--heart)", "var(--p)"],
  ["var(--b3)", "var(--b4)"],
];
const FRAC: [number, number][] = [
  [0.2, 0.86],
  [0.52, 0.88],
  [0.78, 0.8],
];

/** Landscape reference size the sprite spawn coordinates are normalized against. */
const IW = 1670;
const IH = 942;

const svgButterfly = (i: number, c1: string, c2: string) =>
  `<svg viewBox="0 0 48 48"><defs><linearGradient id="mws${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${c1}"/><stop offset="1" style="stop-color:${c2}"/></linearGradient></defs>` +
  `<g class="wl"><path d="M24 22C18 8 5 3 3 11 1 20 10 26 24 25Z" fill="url(#mws${i})" stroke="var(--b5)" stroke-width=".9" stroke-linejoin="round"/><path d="M24 25C12 26 6 32 9 40 12 46 21 40 24 28Z" fill="url(#mws${i})" stroke="var(--b5)" stroke-width=".9" stroke-linejoin="round" opacity=".92"/><circle cx="11" cy="13" r="2.6" fill="#fff" opacity=".75"/><circle cx="14" cy="36" r="1.8" fill="#fff" opacity=".7"/><path d="M24 24C17 18 10 14 6 12M24 26C16 28 11 31 9 35" stroke="#fff" stroke-opacity=".45" fill="none" stroke-width=".7"/></g>` +
  `<g class="wr"><path d="M24 22C30 8 43 3 45 11 47 20 38 26 24 25Z" fill="url(#mws${i})" stroke="var(--b5)" stroke-width=".9" stroke-linejoin="round"/><path d="M24 25C36 26 42 32 39 40 36 46 27 40 24 28Z" fill="url(#mws${i})" stroke="var(--b5)" stroke-width=".9" stroke-linejoin="round" opacity=".92"/><circle cx="37" cy="13" r="2.6" fill="#fff" opacity=".75"/><circle cx="34" cy="36" r="1.8" fill="#fff" opacity=".7"/><path d="M24 24C31 18 38 14 42 12M24 26C32 28 37 31 39 35" stroke="#fff" stroke-opacity=".45" fill="none" stroke-width=".7"/></g>` +
  `<path d="M24 16Q22.500 10 18.500 8M24 16Q25.500 10 29.500 8" stroke="var(--b5)" fill="none" stroke-width=".9" stroke-linecap="round"/><ellipse cx="24" cy="25" rx="1.9" ry="8.500" fill="var(--b5)"/><circle cx="24" cy="16.500" r="2" fill="var(--b5)"/></svg>`;

interface Flyer {
  el: HTMLDivElement;
  hv: NodeListOf<HTMLElement>;
  top: boolean;
  fx: number;
  fy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  nt: number;
  ph: number;
  ang: number;
  glide: number;
  spd: number;
  sc: number;
  w: number;
  h: number;
  init: boolean;
}

export function ButterflySwarm({ className }: { className?: string }) {
  const flyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fly = flyRef.current;
    if (!fly) return;

    const R = (a: number, b: number) => a + Math.random() * (b - a);
    const B: Flyer[] = [];
    const mk = (
      el: HTMLDivElement,
      o: { q: string; top: boolean; fx: number; fy: number; spd: number; sc: number; w: number; h: number },
    ): Flyer => ({
      el,
      hv: el.querySelectorAll(o.q),
      top: o.top,
      fx: o.fx,
      fy: o.fy,
      x: 0,
      y: 0,
      vx: Math.random() * 20 - 10,
      vy: Math.random() * 20 - 10,
      tx: 0,
      ty: 0,
      nt: 0,
      ph: Math.random() * 9,
      ang: 0,
      glide: 0,
      spd: o.spd,
      sc: o.sc,
      w: o.w,
      h: o.h,
      init: false,
    });

    // Sprite butterflies (the original animated sprites, now over the themed page)
    BUTTERFLY_SPRITES.forEach((s) => {
      const el = document.createElement("div");
      el.className = "bf p";
      const w = s.w, sw = s.sp, rw = w - sw;
      el.innerHTML =
        `<i class="L" style="width:${(sw / w) * 100}%;background-image:url(data:image/png;base64,${s.L})"></i>` +
        `<i class="R" style="left:${(sw / w) * 100}%;width:${(rw / w) * 100}%;background-image:url(data:image/png;base64,${s.R})"></i>`;
      el.style.width = w + "px";
      el.style.height = s.h + "px";
      fly.appendChild(el);
      B.push(mk(el, { q: "i", top: true, fx: (s.x + w / 2) / IW, fy: (s.y + s.h / 2) / IH, spd: 32 + Math.random() * 26, sc: 0.9, w: s.w, h: s.h }));
    });

    // Gradient SVG butterflies
    COL.forEach((c, i) => {
      const el = document.createElement("div");
      el.className = "bf bw";
      el.innerHTML = svgButterfly(i, c[0], c[1]);
      el.style.width = "48px";
      el.style.height = "48px";
      fly.appendChild(el);
      B.push(mk(el, { q: ".wl,.wr", top: false, fx: FRAC[i][0], fy: FRAC[i][1], spd: 40 + Math.random() * 22, sc: [0.72, 0.62, 0.78][i], w: 48, h: 48 }));
    });

    let W = 1, H = 1;
    const reg = (o: Flyer): [number, number, number, number] => {
      if (o.top) return [W * 0.5, W * 0.97, H * 0.01, Math.min(H * 0.12, 110)];
      return Math.random() < 0.75
        ? [W * 0.12, W * 0.62, H * 0.8, H * 0.95]
        : [W * 0.66, W * 0.97, H * 0.78, H * 0.84];
    };
    const pick = (o: Flyer, t: number) => {
      const r = reg(o);
      o.tx = r[0] + Math.random() * (r[1] - r[0]);
      o.ty = r[2] + Math.random() * (r[3] - r[2]);
      o.nt = t + 1.3 + Math.random() * 2.6;
    };

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!fly.offsetParent) return; // hidden (Memory view inactive)
      W = fly.clientWidth;
      H = fly.clientHeight;
      if (!W || !H) return;
      const t = now / 1000;
      const u = Math.max(1, Math.min(1.7, W / 760));
      const k = Math.max(0.7, W / 1100);

      B.forEach((o) => {
        if (!o.init) { o.init = true; o.x = o.fx * W; o.y = o.fy * H; pick(o, t); }
        if (t > o.nt) pick(o, t);
        const dx = o.tx - o.x, dy = o.ty - o.y;
        const d = Math.hypot(dx, dy) || 1;
        const sd = o.spd * k;
        const w = Math.sin(t * 2.7 + o.ph) * 0.9 + Math.sin(t * 6.1 + o.ph * 2) * 0.45;
        o.vx += (dx / d * sd * 2.2 - dy / d * w * 55 * k) * dt;
        o.vy += (dy / d * sd * 2.2 + dx / d * w * 55 * k - Math.sin(t * 4.6 + o.ph) * 22) * dt;
        const sp = Math.hypot(o.vx, o.vy);
        const mx = sd * (d < 70 ? 0.5 : 1.1);
        if (sp > mx) { o.vx *= mx / sp; o.vy *= mx / sp; }
        o.vx *= 0.985;
        o.vy *= 0.985;
        o.x += o.vx * dt;
        o.y += o.vy * dt + Math.sin(t * 8 + o.ph) * 0.2;
        const g = Math.atan2(o.vy, o.vx) + Math.PI / 2;
        const da = Math.atan2(Math.sin(g - o.ang), Math.cos(g - o.ang));
        o.ang += da * Math.min(1, dt * (o.top ? 3 : 2.2));
        const rot = o.ang + (o.top ? 0 : Math.sin(t * 5 + o.ph) * 0.12);
        const dur = sp < 12 ? 0.32 : 0.15 + Math.max(0, 60 - sp) / 420;
        if (Math.random() < 0.002) o.glide = t + 0.45;
        const gl = t < o.glide;
        for (let i = 0; i < 2; i++) {
          o.hv[i].style.animationDuration = (o.top ? dur : dur * 0.9) + "s";
          o.hv[i].style.animationPlayState = gl ? "paused" : "running";
        }
        const s = Math.min(u, o.top ? 1.2 : 1.05) * o.sc;
        o.el.style.transform =
          `translate(${o.x}px,${o.y}px) scale(${s},${s}) rotate(${rot}rad) translate(${-o.w / 2}px,${-o.h / 2}px)`;
      });
    };

    if (!reduce) {
      raf = requestAnimationFrame(tick);
    } else {
      // Static placement under reduced motion (mockup's fallback)
      const place = () => {
        if (!fly.offsetParent) return;
        W = fly.clientWidth;
        H = fly.clientHeight;
        B.forEach((o) => {
          o.el.style.transform =
            `translate(${o.fx * W}px,${o.fy * H}px) scale(${o.sc}) translate(${-o.w / 2}px,${-o.h / 2}px)`;
        });
      };
      const t = setTimeout(place, 300);
      window.addEventListener("resize", place);
      return () => {
        clearTimeout(t);
        window.removeEventListener("resize", place);
        B.forEach((o) => o.el.remove());
      };
    }

    return () => {
      cancelAnimationFrame(raf);
      B.forEach((o) => o.el.remove());
    };
  }, []);

  return <div ref={flyRef} className={`mp-fly ${className ?? ""}`} aria-hidden="true" />;
}
