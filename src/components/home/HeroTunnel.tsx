"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import { BlockData } from "@/components/admin/LiveEditor";
import { Editable } from "@/components/ui/Editable";

// ─── Deterministic data (no Math.random in render → no hydration mismatch) ───

const SPOKES = Array.from({ length: 18 }, (_, i) => ({
    angle: (i / 18) * 360,
    opacity: i % 3 === 0 ? 0.22 : i % 3 === 1 ? 0.12 : 0.06,
    length: i % 4 === 0 ? 75 : i % 4 === 1 ? 60 : i % 4 === 2 ? 85 : 50,
    animDuration: 8 + (i % 5) * 2,
    animDelay: -(i * 0.9),
}));

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
    left: `${(i * 37 + 5) % 95}%`,
    bottom: `${(i * 53) % 90}%`,
    size: (i % 3) + 1,
    duration: 4 + (i % 5),
    delay: -(i * 0.4) % 5,
}));

// ─── Soccer Pitch SVG (top-down view) ───────────────────────────────────────
function PitchSVG() {
    return (
        <svg
            viewBox="0 0 400 600"
            className="w-full h-full"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <defs>
                <filter id="pitchGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <linearGradient id="pitchFade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5a00" stopOpacity="0.0" />
                    <stop offset="40%" stopColor="#ff5a00" stopOpacity="0.7" />
                    <stop offset="60%" stopColor="#ff5a00" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#ff5a00" stopOpacity="0.0" />
                </linearGradient>
            </defs>

            <g filter="url(#pitchGlow)" stroke="url(#pitchFade)" strokeWidth="1.2" opacity="0.5">
                {/* Outer boundary */}
                <rect x="20" y="20" width="360" height="560" />
                {/* Halfway line */}
                <line x1="20" y1="300" x2="380" y2="300" />
                {/* Center circle */}
                <circle cx="200" cy="300" r="60" />
                {/* Center spot */}
                <circle cx="200" cy="300" r="3" fill="#ff5a00" fillOpacity="0.5" strokeWidth="0" />
                {/* Penalty area top */}
                <rect x="90" y="20" width="220" height="100" />
                {/* Goal area top */}
                <rect x="145" y="20" width="110" height="45" />
                {/* Penalty spot top */}
                <circle cx="200" cy="82" r="3" fill="#ff5a00" fillOpacity="0.4" strokeWidth="0" />
                {/* Penalty arc top */}
                <path d="M 158 120 A 60 60 0 0 1 242 120" />
                {/* Penalty area bottom */}
                <rect x="90" y="480" width="220" height="100" />
                {/* Goal area bottom */}
                <rect x="145" y="535" width="110" height="45" />
                {/* Penalty spot bottom */}
                <circle cx="200" cy="518" r="3" fill="#ff5a00" fillOpacity="0.4" strokeWidth="0" />
                {/* Penalty arc bottom */}
                <path d="M 158 480 A 60 60 0 0 0 242 480" />
                {/* Corner arcs */}
                <path d="M 20 40 A 20 20 0 0 1 40 20" />
                <path d="M 360 40 A 20 20 0 0 0 340 20" />
                <path d="M 20 560 A 20 20 0 0 0 40 580" />
                <path d="M 360 560 A 20 20 0 0 1 340 580" />
                {/* Goal lines */}
                <rect x="155" y="6" width="90" height="14" opacity="0.6" />
                <rect x="155" y="580" width="90" height="14" opacity="0.6" />
            </g>
        </svg>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function HeroTunnel({ block }: { block?: BlockData }) {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 60,
        damping: 28,
        restDelta: 0.001,
    });

    // ── Scroll-driven transforms ──
    // Background glow
    const glowOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7], [0.15, 0.35, 0.5]);
    // Pitch scale/opacity — zooms in as you scroll (camera approach)
    const pitchScale = useTransform(smoothProgress, [0, 1], [0.55, 2.2]);
    const pitchOpacity = useTransform(smoothProgress, [0, 0.15, 0.45, 0.6], [0.7, 0.9, 0.6, 0]);
    // Spokes slow rotation amplified by scroll
    const spokesRotate = useTransform(smoothProgress, [0, 1], [0, 40]);
    // Logo: visible at start, fades as user descends
    const logoOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
    const logoScale = useTransform(smoothProgress, [0, 0.18], [1.1, 0.9]);

    // ── Text layers (5-layer sequence) start much earlier now ──
    // Layer 1: gradient overlay
    const overlayOpacity = useTransform(scrollYProgress, [0.18, 0.35], [0, 1]);
    // Layer 2: eyebrow badge
    const eyebrowOpacity = useTransform(scrollYProgress, [0.22, 0.3], [0, 1]);
    const eyebrowY = useTransform(smoothProgress, [0.22, 0.35], [30, 0]);
    // Layer 3: tagline words (inline per-word in JSX)
    const taglineOpacity = useTransform(scrollYProgress, [0.26, 0.38], [0, 1]);
    // Layer 4: clip-path team name
    const teamNameClip = useTransform(scrollYProgress, [0.35, 0.6], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]);
    // Layer 5: CTA
    const ctaOpacity = useTransform(scrollYProgress, [0.65, 0.85], [0, 1]);
    const ctaY = useTransform(smoothProgress, [0.65, 0.85], [25, 0]);

    return (
        <div ref={containerRef} className="h-[250vh] relative bg-black">
            {/* ── CSS keyframes ── */}
            <style>{`
                @keyframes floatUp {
                    0%   { transform: translateY(0);   opacity: 0; }
                    10%  { opacity: 1; }
                    90%  { opacity: 0.6; }
                    100% { transform: translateY(-40vh); opacity: 0; }
                }
                @keyframes spokePulse {
                    0%, 100% { opacity: var(--spoke-op); }
                    50%      { opacity: calc(var(--spoke-op) * 1.8); }
                }
                @keyframes glowPulse {
                    0%, 100% { transform: scale(1);   opacity: 0.18; }
                    50%      { transform: scale(1.08); opacity: 0.28; }
                }
                @keyframes pitchShimmer {
                    0%, 100% { opacity: 0.5; }
                    50%      { opacity: 0.75; }
                }
                @keyframes revealLine {
                    from { transform: scaleX(0); }
                    to   { transform: scaleX(1); }
                }
            `}</style>

            <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">

                {/* ═══ BACKGROUND LAYER 0: radial ambient glow ═══ */}
                <motion.div
                    style={{ opacity: glowOpacity }}
                    className="absolute inset-0 pointer-events-none"
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255,90,0,0.22) 0%, transparent 70%)",
                            animation: "glowPulse 6s ease-in-out infinite",
                        }}
                    />
                </motion.div>

                {/* ═══ BACKGROUND LAYER 1: stadium spotlight spokes ═══ */}
                <motion.div
                    style={{ rotate: spokesRotate }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                    {SPOKES.map((s, i) => (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: `${s.length}vmax`,
                                height: "1px",
                                background: `linear-gradient(to right, rgba(255,90,0,${s.opacity * 1.8}), rgba(255,90,0,${s.opacity}), transparent)`,
                                transformOrigin: "0 0",
                                transform: `rotate(${s.angle}deg)`,
                                ["--spoke-op" as string]: s.opacity,
                                animation: `spokePulse ${s.animDuration}s ${s.animDelay}s ease-in-out infinite`,
                            }}
                        />
                    ))}
                </motion.div>

                {/* ═══ BACKGROUND LAYER 2: soccer pitch (zooms in on scroll) ═══ */}
                <motion.div
                    style={{ scale: pitchScale, opacity: pitchOpacity }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                    <div
                        className="w-[min(50vw,340px)] aspect-[2/3]"
                        style={{ animation: "pitchShimmer 8s ease-in-out infinite" }}
                    >
                        <PitchSVG />
                    </div>
                </motion.div>

                {/* ═══ BACKGROUND LAYER 3: floating micro-particles ═══ */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {PARTICLES.map((p, i) => (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                left: p.left,
                                bottom: p.bottom,
                                width: p.size,
                                height: p.size,
                                borderRadius: "50%",
                                background: "#ff5a00",
                                opacity: 0,
                                animation: `floatUp ${p.duration}s ${p.delay}s ease-in-out infinite`,
                            }}
                        />
                    ))}
                </div>

                {/* ═══ LOGO: visible at top, fades as user scrolls ═══ */}
                <motion.div
                    style={{ opacity: logoOpacity, scale: logoScale }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center gap-4"
                >
                    <div className="w-48 md:w-72 drop-shadow-[0_0_50px_rgba(255,90,0,0.6)]">
                        <Image
                            src="/logo.png"
                            alt="Glass Cannons"
                            width={160}
                            height={160}
                            className="w-full h-auto"
                            priority
                        />
                    </div>
                </motion.div>

                {/* ═══════════════════════════════════════════════════════════
                    TEXT OVERLAY — 5-Layer Best-Practice Cinematic Sequence
                ══════════════════════════════════════════════════════════════ */}

                {/* Layer 1 — dark gradient overlay */}
                <motion.div
                    style={{ opacity: overlayOpacity }}
                    className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/55 to-transparent z-10 pointer-events-none"
                />

                {/* Layer 2 — Eyebrow badge */}
                <motion.div
                    style={{ opacity: eyebrowOpacity, y: eyebrowY }}
                    className="absolute bottom-[52%] left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#ff5a00]/50 rounded-full bg-[#ff5a00]/10 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a00] animate-pulse" />
                        <Editable
                            blockId={block?.id || "hero"}
                            field="eyebrow"
                            initialValue={block?.eyebrow || "Calcio a 7 · Stagione 2025/26"}
                            className="text-[#ff5a00] font-bold uppercase tracking-[0.4em] text-[10px] md:text-xs"
                        />
                    </span>
                </motion.div>

                {/* Layer 3 — Tagline word-by-word */}
                <motion.div
                    style={{ opacity: taglineOpacity }}
                    className="absolute bottom-[44%] left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap flex gap-3 md:gap-5"
                >
                    {(block?.tagline || "NATI PER ROMPERE. COSTRUITI PER VINCERE.").split(" ").map((word: string, i: number) => (
                        <motion.span
                            key={i}
                            style={{
                                opacity: useTransform(scrollYProgress, [0.26 + i * 0.012, 0.32 + i * 0.012], [0, 1]),
                                y: useTransform(smoothProgress, [0.26 + i * 0.012, 0.32 + i * 0.012], [20, 0]),
                            }}
                            className="text-white/65 font-heading font-bold uppercase tracking-[0.2em] text-sm md:text-xl"
                        >
                            {word}
                        </motion.span>
                    ))}
                    {/* Invisible editable to capture the full tagline string in Sidebar settings or similar if needed, 
                        but here we enable inline editing by wrapping the container or adding a hidden field. 
                        Actually, Editable as a span in the tag above would be better for UX. */}
                    <div className="absolute inset-0 opacity-0 pointer-events-auto">
                        <Editable 
                            blockId={block?.id || "hero"} 
                            field="tagline" 
                            initialValue={block?.tagline || "NATI PER ROMPERE. COSTRUITI PER VINCERE."}
                        />
                    </div>
                </motion.div>

                <div className="absolute bottom-[28%] md:bottom-[22%] left-0 w-full flex justify-center z-20 pointer-events-none overflow-hidden select-none px-4">
                    <motion.h1
                        style={{ clipPath: teamNameClip }}
                    >
                        <Editable
                            blockId={block?.id || "hero"}
                            field="teamName"
                            initialValue={block?.teamName || "GLASS CANNONS"}
                            className="font-heading text-[clamp(2.2rem,11vw,12rem)] font-black uppercase tracking-tight leading-none text-[#ff5a00] drop-shadow-[0_0_80px_rgba(255,90,0,0.7)] whitespace-nowrap"
                        />
                    </motion.h1>
                </div>

                {/* Layer 5 — CTA buttons */}
                <motion.div
                    style={{ opacity: ctaOpacity, y: ctaY }}
                    className="absolute bottom-[14%] md:bottom-[10%] left-1/2 -translate-x-1/2 z-20 flex flex-row items-center justify-center gap-3 md:gap-4 w-full px-4"
                >
                    <Editable
                        as="a"
                        blockId={block?.id || "hero"}
                        field="ctaText"
                        initialValue={block?.ctaText || "Squadra"}
                        href={block?.ctaLink || "/squadra"}
                        className="px-4 py-2 md:px-8 md:py-3 bg-[#ff5a00] text-black font-heading font-black uppercase tracking-widest text-[10px] md:text-sm
                                   hover:bg-white transition-colors duration-200 rounded-sm shadow-[0_0_30px_rgba(255,90,0,0.5)]
                                   pointer-events-auto whitespace-nowrap"
                    />
                    <Editable
                        as="a"
                        blockId={block?.id || "hero"}
                        field="ctaText2"
                        initialValue={block?.ctaText2 || "Calendario →"}
                        href={block?.ctaLink2 || "/calendario"}
                        className="px-4 py-2 md:px-8 md:py-3 border border-[#ff5a00]/60 text-[#ff5a00] font-heading font-black uppercase tracking-widest text-[10px] md:text-sm
                                   hover:border-white hover:text-white transition-colors duration-200 rounded-sm backdrop-blur-sm
                                   pointer-events-auto whitespace-nowrap"
                    />
                </motion.div>

                {/* ── Scroll Hint ── */}
                <motion.div
                    style={{ opacity: useTransform(scrollYProgress, [0, 0.05], [1, 0]) }}
                    className="absolute bottom-14 left-1/2 -translate-x-1/2 text-center z-20 pointer-events-none"
                >
                    <p className="text-[#ff5a00] font-bold uppercase tracking-[0.8em] text-[10px] mb-6 animate-pulse">
                        DESCEND INTO GLORY
                    </p>
                    <div className="w-[2px] h-28 bg-gradient-to-b from-[#ff5a00] via-[#ff5a00]/40 to-transparent mx-auto relative overflow-hidden rounded-full">
                        <motion.div
                            animate={{ y: [0, 112] }}
                            transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                            className="absolute top-0 left-0 w-full h-10 bg-white"
                        />
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
