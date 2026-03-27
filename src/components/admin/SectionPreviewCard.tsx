"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";

type SectionPreviewCardProps = {
    title: string;
    type: string;
    onAdd: () => void;
    // We pass a simple SVG/JSX representation for the preview
    previewRender: React.ReactNode;
};

export const SectionPreviewCard = ({ title, type, onAdd, previewRender }: SectionPreviewCardProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="group relative bg-[#1a1a1a] border border-white/5 rounded-lg p-3 cursor-pointer hover:border-[#ff5a00]/50 transition-colors"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onAdd}
        >
            <div className="aspect-video bg-black rounded border border-white/10 mb-2 overflow-hidden flex items-center justify-center relative pointer-events-none">
                {/* Mini SVG representation */}
                <div className="scale-[0.35] origin-center opacity-70 group-hover:opacity-100 group-hover:scale-[0.4] transition-all duration-300">
                    {previewRender}
                </div>

                {/* Hover Add Button Overlay */}
                <div className="absolute inset-0 bg-[#ff5a00]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                    <div className="bg-[#ff5a00] text-black rounded-full p-2 shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                        <Plus className="w-5 h-5" />
                    </div>
                </div>
            </div>
            <div className="text-xs font-bold text-gray-300 uppercase tracking-wider text-center group-hover:text-white transition-colors">
                {title}
            </div>
        </div>
    );
};
