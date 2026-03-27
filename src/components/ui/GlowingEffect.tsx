"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowingEffectProps {
    blur?: number;
    borderColor?: string;
    className?: string;
    disabled?: boolean;
    glow?: boolean;
    proximity?: number;
    spread?: number;
    variant?: "default" | "white";
}

export const GlowingEffect = memo(
    ({
        blur = 12,
        borderColor = "#ff5a00",
        className,
        disabled = false,
        glow = false,
        proximity = 200,
        spread = 180,
        variant = "default",
    }: GlowingEffectProps) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const mouseX = useMotionValue(-proximity);
        const mouseY = useMotionValue(-proximity);

        // Use springs for smoother movement
        const springConfig = { damping: 25, stiffness: 200 };
        const springX = useSpring(mouseX, springConfig);
        const springY = useSpring(mouseY, springConfig);

        const handleMouseMove = useCallback(
            (e: MouseEvent) => {
                if (!containerRef.current || disabled) return;
                const rect = containerRef.current.getBoundingClientRect();
                mouseX.set(e.clientX - rect.left);
                mouseY.set(e.clientY - rect.top);
            },
            [mouseX, mouseY, disabled]
        );

        const handleMouseLeave = useCallback(() => {
            mouseX.set(-proximity * 2);
            mouseY.set(-proximity * 2);
        }, [mouseX, mouseY, proximity]);

        useEffect(() => {
            // Find the closest relative parent to track mouse
            const parent = containerRef.current?.parentElement;
            if (parent) {
                parent.addEventListener("mousemove", handleMouseMove);
                parent.addEventListener("mouseleave", handleMouseLeave);
                return () => {
                    parent.removeEventListener("mousemove", handleMouseMove);
                    parent.removeEventListener("mouseleave", handleMouseLeave);
                };
            }
        }, [handleMouseMove, handleMouseLeave]);

        const background = useMotionTemplate`
      radial-gradient(
        ${spread}px circle at ${springX}px ${springY}px,
        ${variant === "white" ? "white" : borderColor} 0%,
        transparent 80%
      )
    `;

        return (
            <div
                ref={containerRef}
                className={cn(
                    "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
                    disabled && "opacity-0",
                    className
                )}
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-[inherit] border border-transparent",
                        "after:absolute after:inset-[-1px] after:rounded-[inherit] after:border after:border-[var(--active-border-color)] after:content-[''] after:opacity-20"
                    )}
                    style={{
                        ["--active-border-color" as string]: borderColor,
                    }}
                >
                    <motion.div
                        className={cn(
                            "absolute inset-0 rounded-[inherit] border border-transparent bg-transparent"
                        )}
                        style={{
                            maskImage: background,
                            WebkitMaskImage: background,
                            border: `3px solid ${borderColor}`,
                        }}
                    />
                </div>
                {glow && (
                    <motion.div
                        className={cn(
                            "absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-60"
                        )}
                        style={{
                            maskImage: background,
                            WebkitMaskImage: background,
                            background: borderColor,
                            filter: `blur(${blur}px)`,
                        }}
                    />
                )}
            </div>
        );
    }
);

GlowingEffect.displayName = "GlowingEffect";
