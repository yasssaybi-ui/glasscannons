"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ThemeEditorSidebar } from "@/components/admin/ThemeEditorSidebar";
import { LiveEditorContext, BlockData } from "./LiveEditorContext";

export { useLiveEditor } from "./LiveEditorContext";
export type { BlockData };

type LiveEditorProps = {
    children: React.ReactNode;
    initialMode?: boolean;
    pageId?: string;
};

export const LiveEditor = ({ children, initialMode = false, pageId = "home" }: LiveEditorProps) => {
    const [isEditMode, setIsEditMode] = useState(initialMode);
    const [blocks, setBlocks] = useState<BlockData[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Sidebar State
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [sidebarView, setSidebarView] = useState<'library' | 'settings' | 'closed'>('closed');
    const [insertIndex, setInsertIndex] = useState<number | null>(null);

    // Set mounted on client
    useEffect(() => {
        setMounted(true);
    }, []);

    // Track if we need to save to Firestore
    const hasChanges = useRef(false);

    // Fetch blocks on mount and when pageId changes
    useEffect(() => {
        let isMounted = true;
        const fetchBlocks = async () => {
            console.log(`[LiveEditor] Fetching blocks for page: ${pageId}...`);
            setLoading(true);
            try {
                const docRef = doc(db, "cms_pages", pageId);
                const docSnap = await getDoc(docRef);
                if (!isMounted) return;

                if (docSnap.exists() && docSnap.data().blocks && docSnap.data().blocks.length > 0) {
                    console.log(`[LiveEditor] Found ${docSnap.data().blocks.length} blocks for ${pageId}`);
                    setBlocks(docSnap.data().blocks);
                } else {
                    console.log(`[LiveEditor] No blocks found for ${pageId}, initializing default blocks...`);
                    const defaultBlocks: BlockData[] = [
                        { id: 'default_hero', type: 'hero' },
                        { id: 'default_news', type: 'news' },
                        { id: 'default_matches', type: 'matches' },
                        { id: 'default_history', type: 'history', title: 'La Nostra Storia', subtitle: 'Nati per rompere gli schemi', text1: 'I Glass Cannons sono nati con una filosofia chiara: il miglior modo di difendersi è attaccare. Siamo una squadra atipica nel panorama del calcio a 7, preferiamo vincere 6-5 piuttosto che 1-0. Il nostro nome riflette il nostro stile di gioco: fragili in retroguardia forse, ma dotati di una potenza di fuoco devastante in avanti.', text2: 'Costruita su un gruppo di amici e unita dalla passione per il calcio offensivo, la squadra è diventata rapidamente una delle più seguite del torneo per la spettacolarità delle sue partite.', stat1Value: '112', stat1Label: 'Gol Segnati', stat2Value: '3.4', stat2Label: 'Media Gol/Partita' },
                        { id: 'default_features', type: 'features' }
                    ];
                    setBlocks(defaultBlocks);
                    // Single initial save if it doesn't exist
                    await setDoc(docRef, { blocks: defaultBlocks }, { merge: true });
                }
            } catch (error) {
                console.error("Error fetching blocks:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchBlocks();
        return () => { isMounted = false; };
    }, [pageId]);

    // Check URL for ?edit=true if we are in browser
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("edit") === "true") {
                setIsEditMode(true);
            }
        }
    }, []);

    // Effect-based save to avoid side-effects in state updaters
    useEffect(() => {
        if (!hasChanges.current || loading) return;

        const timer = setTimeout(async () => {
            try {
                const docRef = doc(db, "cms_pages", pageId);
                await setDoc(docRef, { blocks }, { merge: true });
                console.log(`Blocks for ${pageId} saved to Firestore automatically`);
                hasChanges.current = false;
            } catch (error) {
                console.error("Error saving blocks:", error);
            }
        }, 1000); // 1s debounce

        return () => clearTimeout(timer);
    }, [blocks, pageId, loading]);

    const updateBlock = useCallback(
        (blockId: string, updates: any) => {
            setBlocks((prev) => {
                const index = prev.findIndex((b) => b.id === blockId);
                let newBlocks;
                if (index === -1) {
                    newBlocks = [...prev, { id: blockId, type: 'static', ...updates } as BlockData];
                } else {
                    newBlocks = prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b));
                }
                hasChanges.current = true;
                return newBlocks;
            });
        },
        []
    );

    const addBlock = useCallback(
        (type: BlockData['type'], index: number, initialContent: any = {}) => {
            const newBlock: BlockData = {
                id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                type,
                ...initialContent
            };
            setBlocks((prev) => {
                const newBlocks = [...prev];
                newBlocks.splice(index, 0, newBlock);
                hasChanges.current = true;
                return newBlocks;
            });
        },
        []
    );

    const removeBlock = useCallback(
        (blockId: string) => {
            setBlocks((prev) => {
                const newBlocks = prev.filter((b) => b.id !== blockId);
                hasChanges.current = true;
                return newBlocks;
            });
        },
        []
    );

    const moveBlock = useCallback(
        (blockId: string, direction: 'up' | 'down') => {
            setBlocks((prev) => {
                const index = prev.findIndex((b) => b.id === blockId);
                if (index === -1) return prev;
                if (direction === 'up' && index === 0) return prev;
                if (direction === 'down' && index === prev.length - 1) return prev;

                const newBlocks = [...prev];
                const newIndex = direction === 'up' ? index - 1 : index + 1;
                // Swap
                [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];

                hasChanges.current = true;
                return newBlocks;
            });
        },
        []
    );

    return (
        <LiveEditorContext.Provider value={{
            isEditMode,
            blocks,
            selectedBlockId,
            setSelectedBlockId,
            sidebarView,
            setSidebarView,
            insertIndex,
            setInsertIndex,
            updateBlock,
            addBlock,
            removeBlock,
            moveBlock
        }}>
            {/* Minimal persistent Admin bar if in edit mode */}
            {mounted && isEditMode && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-[#1a1a1a] border border-[#ff5a00]/30 rounded-full px-6 py-3 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center space-x-4 backdrop-blur-md">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-white font-bold uppercase tracking-wider text-sm">Editor Live Attivo</span>
                    <button onClick={() => setSidebarView('library')} className="ml-4 text-xs bg-[#ff5a00] text-black font-bold uppercase tracking-widest px-3 py-1 rounded hover:bg-white transition-colors">
                        Libreria
                    </button>
                    <button onClick={() => setSidebarView('settings')} className="text-xs text-white font-bold uppercase tracking-widest px-3 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors">
                        Tema
                    </button>

                    <select
                        className="ml-4 text-xs bg-black text-[#ff5a00] font-bold uppercase tracking-widest px-3 py-1 border border-[#ff5a00]/30 rounded outline-none cursor-pointer hover:bg-white/5 transition-colors appearance-none text-center"
                        onChange={(e) => {
                            const newPath = e.target.value;
                            if (newPath && newPath !== window.location.pathname) {
                                console.log(`[LiveEditor] Manual page switch to: ${newPath}`);
                                window.location.href = `${newPath}?edit=true`;
                            }
                        }}
                        value={typeof window !== 'undefined' ? (
                            ['/', '/squadra', '/calendario', '/news', '/classifica', '/risultati', '/galleria'].includes(window.location.pathname) 
                            ? window.location.pathname 
                            : ''
                        ) : ''}
                    >
                        <option value="/">Home</option>
                        <option value="/squadra">Rosa</option>
                        <option value="/calendario">Calendario</option>
                        <option value="/news">News</option>
                        <option value="/classifica">Classifica</option>
                        <option value="/risultati">Risultati</option>
                        <option value="/galleria">Galleria</option>
                    </select>

                    <button
                        onClick={() => window.location.href = window.location.pathname}
                        className="ml-4 text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1"
                    >
                        Chiudi
                    </button>
                </div>
            )}
            {mounted && isEditMode && <ThemeEditorSidebar />}
            <div className={`transition-all duration-300 ${isEditMode && sidebarView !== 'closed' ? 'ml-80' : 'ml-0'}`}>
                {children}
            </div>
        </LiveEditorContext.Provider>
    );
};
