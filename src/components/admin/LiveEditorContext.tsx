"use client";

import React, { createContext, useContext } from "react";

export type BlockData = {
    id: string;
    type: 'hero' | 'history' | 'features' | 'richText' | 'gallery' | 'matches' | 'genericHero' | 'imageWithText' | 'dynamicData' | 'carousel' | 'video' | 'countdown' | 'news' | 'static';
    config?: {
        bgColor?: string;
        textColor?: string;
        fontSize?: 'small' | 'medium' | 'large' | 'xl';
        padding?: 'none' | 'small' | 'medium' | 'large';
        [key: string]: any;
    };
    [key: string]: any; // block specific content
};

export type LiveEditorContextType = {
    isEditMode: boolean;
    blocks: BlockData[];
    selectedBlockId: string | null;
    setSelectedBlockId: (id: string | null) => void;
    sidebarView: 'library' | 'settings' | 'closed';
    setSidebarView: (view: 'library' | 'settings' | 'closed') => void;
    insertIndex: number | null;
    setInsertIndex: (index: number | null) => void;
    updateBlock: (blockId: string, updates: any) => void;
    addBlock: (type: BlockData['type'], index: number, initialContent?: any) => void;
    removeBlock: (blockId: string) => void;
    moveBlock: (blockId: string, direction: 'up' | 'down') => void;
};

export const LiveEditorContext = createContext<LiveEditorContextType | undefined>(undefined);

export const useLiveEditor = () => {
    const context = useContext(LiveEditorContext);
    if (!context) {
        throw new Error("useLiveEditor must be used within a LiveEditorProvider");
    }
    return context;
};
