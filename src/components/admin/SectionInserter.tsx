"use client";

import React from "react";
import { useLiveEditor } from "./LiveEditorContext";
import { Plus } from "lucide-react";

type SectionInserterProps = {
    index: number;
};

export const SectionInserter = ({ index }: SectionInserterProps) => {
    const { isEditMode, sidebarView, setSidebarView, insertIndex, setInsertIndex } = useLiveEditor();

    if (!isEditMode) return null;

    const isActive = sidebarView === 'library' && insertIndex === index;

    const handleOpenLibrary = () => {
        setInsertIndex(index);
        setSidebarView('library');
    };

    return (
        <div className="relative w-full py-4 -my-4 z-50 group flex justify-center">
            {/* The line and button show on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`w-full h-[2px] transition-colors ${isActive ? 'bg-[#ff5a00] opacity-100' : 'bg-[#ff5a00] opacity-30'}`} />
            </div>

            <button
                onClick={handleOpenLibrary}
                className={`relative z-10 w-8 h-8 rounded-full border-2 ${isActive ? 'bg-[#ff5a00] text-black border-transparent scale-110 shadow-[0_0_15px_rgba(255,90,0,0.5)]' : 'bg-[#1a1a1a] text-[#ff5a00] border-[#ff5a00] shadow-lg opacity-0 group-hover:opacity-100'} flex items-center justify-center transition-all hover:scale-110 hover:bg-[#ff5a00] hover:text-black hover:border-transparent`}
                title="Aggiungi Sezione Qui"
            >
                <Plus className={`w-5 h-5 transition-transform ${isActive ? 'rotate-90' : ''}`} />
            </button>
        </div>
    );
};
