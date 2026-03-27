"use client";

import React from "react";
import { useLiveEditor } from "./LiveEditorContext";
import { X, Layers, Settings2 } from "lucide-react";
import { SectionLibraryPanel } from "./SectionLibraryPanel";
import { BlockSettingsSidebar } from "./BlockSettingsSidebar";

export const ThemeEditorSidebar = () => {
    const { isEditMode, sidebarView, setSidebarView, selectedBlockId, setSelectedBlockId } = useLiveEditor();

    if (!isEditMode || sidebarView === 'closed') return null;

    return (
        <div className="fixed top-0 left-0 w-80 h-screen bg-[#0f0f0f] border-r border-[#ff5a00]/20 shadow-[20px_0_50px_rgba(0,0,0,0.8)] z-[200] flex flex-col text-white transition-transform overflow-hidden">
            {/* Header */}
            <div className="flex-none p-4 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur z-10">
                <div className="flex space-x-2">
                    <button
                        onClick={() => {
                            setSidebarView('library');
                            setSelectedBlockId(null);
                        }}
                        className={`px-3 py-2 rounded flex items-center space-x-2 transition-colors ${sidebarView === 'library' && !selectedBlockId ? 'bg-[#ff5a00] text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        title="Libreria Sezioni"
                    >
                        <Layers className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">Aggiungi</span>
                    </button>
                    {selectedBlockId && (
                        <button
                            onClick={() => setSidebarView('settings')}
                            className={`px-3 py-2 rounded flex items-center space-x-2 transition-colors ${sidebarView === 'settings' ? 'bg-[#ff5a00] text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            title="Impostazioni Blocco"
                        >
                            <Settings2 className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider">Modifica</span>
                        </button>
                    )}
                </div>
                <button
                    onClick={() => {
                        setSidebarView('closed');
                        setSelectedBlockId(null);
                    }}
                    className="text-gray-400 hover:text-[#ff5a00] p-1 transition-colors"
                    title="Chiudi pannello"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative">
                {sidebarView === 'library' && !selectedBlockId && <SectionLibraryPanel />}

                {(sidebarView === 'settings' || selectedBlockId) && <BlockSettingsSidebar />}
            </div>

            {/* Minimal footer branding */}
            <div className="flex-none p-4 border-t border-white/5 text-center">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Theme Editor • Glass Cannons</span>
            </div>
        </div>
    );
};
