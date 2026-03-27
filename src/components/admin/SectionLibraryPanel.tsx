"use client";

import React from "react";
import { useLiveEditor, BlockData } from "./LiveEditorContext";
import { SectionPreviewCard } from "./SectionPreviewCard";

export const SectionLibraryPanel = () => {
    const { addBlock, insertIndex, setSidebarView, setInsertIndex } = useLiveEditor();

    const handleAdd = (type: BlockData['type'], defaultContent: any) => {
        const idx = insertIndex !== null ? insertIndex : 0;
        addBlock(type, idx, defaultContent);
        setSidebarView('closed');
        setInsertIndex(null);
    };

    const sections = [
        {
            type: 'genericHero' as const,
            title: 'Hero (Testo + Bottone)',
            defaultContent: { title: "Titolo Principale", subtitle: "Sottotitolo descrittivo", ctaText: "Scopri di più", ctaLink: "/", config: { showTitle: true, showSubtitle: true, showCta: true, bgColor: "bg-black", textColor: "text-white", padding: "large" } },
            previewRender: (
                <div className="w-[400px] h-[200px] bg-black flex flex-col items-center justify-center space-y-4">
                    <div className="w-3/4 h-8 bg-white/20 rounded"></div>
                    <div className="w-1/2 h-4 bg-white/10 rounded"></div>
                    <div className="w-32 h-10 bg-[#ff5a00] rounded"></div>
                </div>
            )
        },
        {
            type: 'imageWithText' as const,
            title: 'Immagine e Testo',
            defaultContent: { title: "Titolo Sezione", content: "Descrizione testuale...", imageUrl: "", config: { imagePosition: "left", bgColor: "bg-black", textColor: "text-white", padding: "large" } },
            previewRender: (
                <div className="w-[400px] h-[200px] bg-[#0a0a0a] flex items-center p-4 space-x-4">
                    <div className="w-1/2 h-full bg-[#1a1a1a] rounded border border-white/5"></div>
                    <div className="w-1/2 flex flex-col space-y-3">
                        <div className="w-3/4 h-6 bg-white/20 rounded"></div>
                        <div className="flex-1 bg-white/10 rounded"></div>
                    </div>
                </div>
            )
        },
        {
            type: 'carousel' as const,
            title: 'Carosello',
            defaultContent: { slides: [{ title: 'Nuova Slide', subtitle: 'Descrizione slide', imageUrl: '' }], config: { bgClass: 'bg-black', interval: 5000, showArrows: true, showDots: true } },
            previewRender: (
                <div className="w-[400px] h-[200px] bg-[#050505] flex items-center justify-center relative">
                    <div className="w-full h-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
                        <div className="w-1/2 h-6 bg-white/20 rounded mt-12"></div>
                    </div>
                    {/* Fake arrows */}
                    <div className="absolute left-4 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"><div className="w-2 h-2 border-l border-t border-white -rotate-45 ml-1"></div></div>
                    <div className="absolute right-4 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"><div className="w-2 h-2 border-r border-t border-white rotate-45 mr-1"></div></div>
                    {/* Fake dots */}
                    <div className="absolute bottom-4 flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                        <div className="w-2 h-2 rounded-full bg-white/20"></div>
                        <div className="w-2 h-2 rounded-full bg-white/20"></div>
                    </div>
                </div>
            )
        },
        {
            type: 'video' as const,
            title: 'Sezione Video',
            defaultContent: { videoUrl: '', title: 'Titolo Video', config: { autoplay: false, muted: true, padding: 'medium' } },
            previewRender: (
                <div className="w-[400px] h-[200px] bg-black flex items-center justify-center border border-white/5 relative">
                    <div className="w-[80%] h-[80%] bg-[#0f0f0f] rounded-lg border border-white/10 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#ff5a00] flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-black border-b-[6px] border-b-transparent ml-1"></div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            type: 'countdown' as const,
            title: 'Countdown',
            // Default 7 days from now
            defaultContent: { targetDate: new Date(Date.now() + 86400000 * 7).toISOString(), title: 'Prossimo Evento', config: { bgColor: 'bg-[#ff5a00]', textColor: 'text-black' } },
            previewRender: (
                <div className="w-[400px] h-[200px] bg-[#ff5a00] flex flex-col items-center justify-center space-y-4">
                    <div className="w-1/2 h-6 bg-black/20 rounded"></div>
                    <div className="flex space-x-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="w-16 h-16 bg-black text-white rounded flex items-center justify-center font-bold text-3xl font-heading">00</div>)}
                    </div>
                </div>
            )
        },
        {
            type: 'dynamicData' as const,
            title: 'Dati Dinamici',
            defaultContent: { title: "Dati", config: { dataType: "nextMatch", bgColor: "bg-black", textColor: "text-white", padding: "large" } },
            previewRender: (
                <div className="w-[400px] h-[200px] bg-[#0a0a0a] flex flex-col items-center p-6 space-y-4 border border-white/5">
                    <div className="w-1/3 h-4 bg-[#ff5a00]/50 rounded"></div>
                    <div className="w-full h-24 bg-black border border-white/10 rounded-lg flex items-center justify-around">
                        <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                        <div className="text-4xl text-white/20 font-black">VS</div>
                        <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                    </div>
                </div>
            )
        },
        {
            type: 'history' as const,
            title: 'Testo & Statistiche (Storia)',
            defaultContent: { title: "Titolo", subtitle: "Sottotitolo", text1: "Testo 1", text2: "Testo 2", stat1Value: "0", stat1Label: "Stat 1", stat2Value: "0", stat2Label: "Stat 2" },
            previewRender: (
                <div className="w-[400px] h-[200px] bg-black flex p-4 space-x-6">
                    <div className="w-1/2 flex flex-col space-y-3">
                        <div className="w-1/3 h-4 bg-[#ff5a00]/70 rounded"></div>
                        <div className="w-full h-8 bg-white/20 rounded"></div>
                        <div className="flex-1 bg-white/5 rounded"></div>
                        <div className="h-10 flex space-x-2">
                            <div className="flex-1 bg-white/10 border-l-4 border-[#ff5a00]"></div>
                            <div className="flex-1 bg-white/10 border-l-4 border-[#ff5a00]"></div>
                        </div>
                    </div>
                    <div className="w-1/2 bg-[#1a1a1a] rounded border border-white/5"></div>
                </div>
            )
        },
        {
            type: 'features' as const,
            title: 'Griglia Informazioni',
            defaultContent: {},
            previewRender: (
                <div className="w-[400px] h-[200px] bg-[#0a0a0a] grid grid-cols-3 gap-3 p-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-black border border-white/5 rounded p-3 flex flex-col items-center space-y-2">
                            <div className="w-8 h-8 rounded-full bg-[#ff5a00]/30"></div>
                            <div className="w-full h-3 bg-white/20 rounded"></div>
                            <div className="w-full flex-1 bg-white/5 rounded"></div>
                        </div>
                    ))}
                </div>
            )
        },
        {
            type: 'matches' as const,
            title: 'Ultime Partite',
            defaultContent: {},
            previewRender: (
                <div className="w-[400px] h-[200px] bg-[#050505] flex flex-col p-4 space-y-2 border border-white/5">
                    <div className="h-2/3 bg-black/40 border border-white/10 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff5a00]/20 blur-3xl rounded-full"></div>
                        <div className="w-1/4 h-6 bg-white/20 rounded"></div>
                        <div className="mx-6 text-white/20 font-black text-3xl">VS</div>
                        <div className="w-1/4 h-6 bg-white/20 rounded"></div>
                    </div>
                    <div className="h-1/3 flex space-x-2">
                        <div className="flex-1 bg-black/40 border border-white/5 rounded"></div>
                        <div className="flex-1 bg-black/40 border border-white/5 rounded"></div>
                    </div>
                </div>
            )
        },
        {
            type: 'gallery' as const,
            title: 'Galleria Immagini',
            defaultContent: { images: [] },
            previewRender: (
                <div className="w-[400px] h-[200px] bg-black grid grid-cols-4 gap-2 border border-white/5 p-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="bg-[#1a1a1a] rounded border border-white/5"></div>)}
                </div>
            )
        },
        {
            type: 'news' as const,
            title: 'News Carousel (Premium)',
            defaultContent: {},
            previewRender: (
                <div className="w-[400px] h-[200px] bg-black flex flex-col justify-end p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#ff5a00]/20 to-transparent"></div>
                    <div className="space-y-2 relative z-10">
                        <div className="w-16 h-3 bg-[#ff5a00] rounded-full"></div>
                        <div className="w-3/4 h-6 bg-white rounded"></div>
                        <div className="w-1/2 h-8 bg-white/10 rounded mt-4"></div>
                    </div>
                    {/* Fake arrows */}
                    <div className="absolute bottom-4 left-4 flex space-x-2">
                        <div className="w-6 h-6 rounded-full border border-white/20"></div>
                        <div className="w-6 h-6 rounded-full border border-white/20"></div>
                    </div>
                </div>
            )
        },
        {
            type: 'richText' as const,
            title: 'Testo Libero',
            defaultContent: { content: "Questo è un nuovo blocco di testo." },
            previewRender: (
                <div className="w-[400px] h-[200px] bg-black p-8 flex flex-col items-center justify-center space-y-3 border border-white/5">
                    <div className="w-full h-4 bg-white/20 rounded"></div>
                    <div className="w-full h-4 bg-white/20 rounded"></div>
                    <div className="w-3/4 h-4 bg-white/20 rounded"></div>
                </div>
            )
        },
        {
            type: 'hero' as const,
            title: 'Eroe Tunnel Globale',
            defaultContent: {},
            previewRender: (
                <div className="w-[400px] h-[200px] bg-black flex items-center justify-center overflow-hidden relative border border-white/5">
                    <div className="absolute w-[300px] h-[300px] border border-white/10 rounded-full"></div>
                    <div className="absolute w-[200px] h-[200px] border border-white/20 rounded-full"></div>
                    <div className="absolute w-[100px] h-[100px] border border-[#ff5a00]/50 rounded-full"></div>
                    <div className="w-1/3 h-10 bg-white rounded z-10 shadow-lg"></div>
                </div>
            )
        }
    ];

    return (
        <div className="p-4 flex flex-col space-y-6">
            <h3 className="text-[#ff5a00] font-bold text-xs uppercase tracking-widest mb-2 border-b border-white/10 pb-2">Sezioni Disponibili</h3>

            <div className="grid grid-cols-1 gap-4 pb-20">
                {sections.map(s => (
                    <SectionPreviewCard
                        key={s.type}
                        title={s.title}
                        type={s.type}
                        onAdd={() => handleAdd(s.type, s.defaultContent)}
                        previewRender={s.previewRender}
                    />
                ))}
            </div>
        </div>
    );
};
