"use client";

import { useState } from "react";
import { Settings, X, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, LayoutTemplate } from "lucide-react";
import { BlockData, useLiveEditor } from "./LiveEditorContext";

const PRESET_COLORS = [
    { label: "Nero (Default)", value: "bg-black" },
    { label: "Nero Chiaro", value: "bg-[#0a0a0a]" },
    { label: "Grigio Scuro", value: "bg-[#111111]" },
    { label: "Arancione GC", value: "bg-[#ff5a00]" },
    { label: "Arancione Scuro", value: "bg-[#cc4800]" },
    { label: "Bianco", value: "bg-white" },
];

const PRESET_TEXT_COLORS = [
    { label: "Bianco (Default)", value: "text-white" },
    { label: "Grigio Scuro", value: "text-gray-900" },
    { label: "Arancione GC", value: "text-[#ff5a00]" },
];

export function BlockSettingsPopover({ block }: { block: BlockData }) {
    const { updateBlock } = useLiveEditor();
    const [isOpen, setIsOpen] = useState(false);

    const config = block.config || {};

    const updateConfig = (key: string, value: any) => {
        updateBlock(block.id, {
            config: {
                ...config,
                [key]: value
            }
        });
    };

    return (
        <div className="absolute top-4 right-16 z-[60]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-black/50 hover:bg-[#ff5a00] text-white p-2 rounded-full transition-colors backdrop-blur-sm border border-white/10 opacity-0 group-hover/block:opacity-100"
                title="Impostazioni Blocco"
            >
                <Settings className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="absolute top-12 right-0 w-72 bg-[#0f0f0f] border border-white/20 rounded-lg shadow-2xl p-4 origin-top-right z-[100]">
                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                        <span className="font-heading font-bold text-white uppercase tracking-wider text-sm">Opzioni Blocco</span>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Background Color */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Colore Sfondo</label>
                            <div className="grid grid-cols-6 gap-2">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color.value}
                                        onClick={() => updateConfig('bgColor', color.value)}
                                        className={`w-6 h-6 rounded-full border-2 ${config.bgColor === color.value ? 'border-[#ff5a00]' : 'border-transparent'} ${color.value.replace('bg-', 'bg-')} ${color.value === 'bg-black' ? 'border-white/20' : ''}`}
                                        title={color.label}
                                        style={color.value.startsWith('bg-[') ? { backgroundColor: color.value.replace('bg-[', '').replace(']', '') } : {}}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Text Color */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Colore Testo</label>
                            <div className="grid grid-cols-4 gap-2">
                                {PRESET_TEXT_COLORS.map(color => (
                                    <button
                                        key={color.value}
                                        onClick={() => updateConfig('textColor', color.value)}
                                        className={`w-6 h-6 rounded-full border-2 ${config.textColor === color.value ? 'border-[#ff5a00]' : 'border-transparent'} ${color.value.replace('text-', 'bg-')} ${color.value === 'text-white' ? 'bg-white' : ''} ${color.value === 'text-gray-900' ? 'bg-gray-900' : ''}`}
                                        title={color.label}
                                        style={color.value.startsWith('text-[') ? { backgroundColor: color.value.replace('text-[', '').replace(']', '') } : {}}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Font Size */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Dimensione Testo</label>
                            <select
                                value={config.fontSize || 'medium'}
                                onChange={(e) => updateConfig('fontSize', e.target.value)}
                                className="w-full bg-black border border-white/10 rounded p-2 text-white text-sm outline-none focus:border-[#ff5a00]"
                            >
                                <option value="small">Piccolo</option>
                                <option value="medium">Normale</option>
                                <option value="large">Grande</option>
                                <option value="xl">Extra Grande</option>
                            </select>
                        </div>

                        {/* Padding */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Spaziatura (Padding)</label>
                            <select
                                value={config.padding || 'large'}
                                onChange={(e) => updateConfig('padding', e.target.value)}
                                className="w-full bg-black border border-white/10 rounded p-2 text-white text-sm outline-none focus:border-[#ff5a00]"
                            >
                                <option value="none">Nessuna</option>
                                <option value="small">Piccola (py-8)</option>
                                <option value="medium">Media (py-16)</option>
                                <option value="large">Grande (py-24)</option>
                            </select>
                        </div>

                        {/* Block Specific Settings */}
                        {block.type === 'genericHero' && (
                            <div className="pt-2 border-t border-white/10">
                                <label className="block text-xs font-bold text-[#ff5a00] uppercase tracking-widest mb-2">Opzioni Hero</label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2 text-sm text-gray-300">
                                        <input type="checkbox" checked={config.showTitle ?? true} onChange={(e) => updateConfig('showTitle', e.target.checked)} className="accent-[#ff5a00]" />
                                        <span>Mostra Titolo</span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-sm text-gray-300">
                                        <input type="checkbox" checked={config.showSubtitle ?? true} onChange={(e) => updateConfig('showSubtitle', e.target.checked)} className="accent-[#ff5a00]" />
                                        <span>Mostra Sottotitolo</span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-sm text-gray-300">
                                        <input type="checkbox" checked={config.showCta ?? true} onChange={(e) => updateConfig('showCta', e.target.checked)} className="accent-[#ff5a00]" />
                                        <span>Mostra Pulsante (CTA)</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {block.type === 'imageWithText' && (
                            <div className="pt-2 border-t border-white/10">
                                <label className="block text-xs font-bold text-[#ff5a00] uppercase tracking-widest mb-2">Posizione Immagine</label>
                                <select
                                    value={config.imagePosition || 'left'}
                                    onChange={(e) => updateConfig('imagePosition', e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded p-2 text-white text-sm outline-none focus:border-[#ff5a00]"
                                >
                                    <option value="left">Sinistra</option>
                                    <option value="right">Destra</option>
                                    <option value="top">Sopra</option>
                                    <option value="bottom">Sotto</option>
                                </select>
                            </div>
                        )}

                        {block.type === 'dynamicData' && (
                            <div className="pt-2 border-t border-white/10">
                                <label className="block text-xs font-bold text-[#ff5a00] uppercase tracking-widest mb-2">Tipo Dati</label>
                                <select
                                    value={config.dataType || 'nextMatch'}
                                    onChange={(e) => updateConfig('dataType', e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded p-2 text-white text-sm outline-none focus:border-[#ff5a00]"
                                >
                                    <option value="nextMatch">Prossima Partita</option>
                                    <option value="lastResults">Ultimi Risultati</option>
                                    <option value="standings">Classifica</option>
                                    <option value="squadPreview">Anteprima Rosa</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
