"use client";

import React from "react";
import { useLiveEditor } from "./LiveEditorContext";
import { Trash2 } from "lucide-react";

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

export const BlockSettingsSidebar = () => {
    const { blocks, selectedBlockId, updateBlock, removeBlock, setSelectedBlockId, setSidebarView } = useLiveEditor();

    const block = blocks.find(b => b.id === selectedBlockId);

    if (!block) return (
        <div className="p-8 text-center text-gray-500 text-sm">
            Seleziona una sezione per modificarne le impostazioni.
        </div>
    );

    const config = block.config || {};

    const updateConfig = (key: string, value: any) => {
        updateBlock(block.id, {
            config: {
                ...config,
                [key]: value
            }
        });
    };

    const handleDelete = () => {
        if (window.confirm("Sei sicuro di voler eliminare questa sezione?")) {
            removeBlock(block.id);
            setSelectedBlockId(null);
            setSidebarView('closed');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a]">
            {/* Header / Title */}
            <div className="p-4 border-b border-white/5 bg-[#111]">
                <h3 className="text-white font-bold uppercase tracking-wider text-sm flex items-center justify-between">
                    <span>Impostazioni: <span className="text-[#ff5a00]">{block.type}</span></span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar pb-20">
                {/* Global Block Settings */}
                <div className="space-y-6 bg-black/50 p-4 rounded-lg border border-white/5 shadow-inner">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">Stile Globale</h4>

                    {/* Background Color */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#ff5a00] uppercase tracking-widest mb-3">Colore Sfondo</label>
                        <div className="flex flex-wrap gap-3">
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    onClick={() => updateConfig('bgColor', color.value)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shadow-lg ${config.bgColor === color.value ? 'border-[#ff5a00] scale-110 shadow-[0_0_10px_rgba(255,90,0,0.5)]' : 'border-black opacity-60 hover:opacity-100'} ${color.value.replace('bg-', 'bg-')} ${color.value === 'bg-black' ? 'border-white/20' : ''}`}
                                    title={color.label}
                                    style={color.value.startsWith('bg-[') ? { backgroundColor: color.value.replace('bg-[', '').replace(']', '') } : {}}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Text Color */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#ff5a00] uppercase tracking-widest mb-3">Colore Testo Base</label>
                        <div className="flex flex-wrap gap-3">
                            {PRESET_TEXT_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    onClick={() => updateConfig('textColor', color.value)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shadow-lg ${config.textColor === color.value ? 'border-[#ff5a00] scale-110 shadow-[0_0_10px_rgba(255,90,0,0.5)]' : 'border-black opacity-60 hover:opacity-100'} ${color.value.replace('text-', 'bg-')} ${color.value === 'text-white' ? 'bg-white' : ''} ${color.value === 'text-gray-900' ? 'bg-gray-900' : ''}`}
                                    title={color.label}
                                    style={color.value.startsWith('text-[') ? { backgroundColor: color.value.replace('text-[', '').replace(']', '') } : {}}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Font Size & Padding */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-[#ff5a00] uppercase tracking-widest mb-2">Dimensione</label>
                            <select
                                value={config.fontSize || 'medium'}
                                onChange={(e) => updateConfig('fontSize', e.target.value)}
                                className="w-full bg-[#111] border border-white/10 rounded p-2 text-white text-xs outline-none focus:border-[#ff5a00] tracking-wider transition-colors cursor-pointer"
                            >
                                <option value="small">Piccolo</option>
                                <option value="medium">Normale</option>
                                <option value="large">Grande</option>
                                <option value="xl">Extra</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#ff5a00] uppercase tracking-widest mb-2">Spaziatura</label>
                            <select
                                value={config.padding || 'large'}
                                onChange={(e) => updateConfig('padding', e.target.value)}
                                className="w-full bg-[#111] border border-white/10 rounded p-2 text-white text-xs outline-none focus:border-[#ff5a00] tracking-wider transition-colors cursor-pointer"
                            >
                                <option value="none">Zero (0px)</option>
                                <option value="small">S (py-8)</option>
                                <option value="medium">M (py-16)</option>
                                <option value="large">L (py-24)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Specific Settings Wrapper */}
                {(block.type === 'genericHero' || block.type === 'imageWithText' || block.type === 'dynamicData' || block.type === 'countdown' || block.type === 'video' || block.type === 'carousel') && (
                    <div className="space-y-6 bg-black/30 p-4 rounded-lg border border-[#ff5a00]/30 shadow-[inset_0_0_20px_rgba(255,90,0,0.05)]">
                        <h4 className="text-[#ff5a00] text-xs font-bold uppercase tracking-widest border-b border-[#ff5a00]/20 pb-2">Impostazioni Specifiche</h4>

                        {block.type === 'genericHero' && (
                            <div className="space-y-3">
                                <label className="flex items-center space-x-3 text-sm text-gray-300 bg-[#111] p-2 rounded cursor-pointer hover:bg-white/5 border border-white/5 transition-colors">
                                    <input type="checkbox" checked={config.showTitle ?? true} onChange={(e) => updateConfig('showTitle', e.target.checked)} className="accent-[#ff5a00] w-4 h-4 cursor-pointer" />
                                    <span>Mostra Titolo</span>
                                </label>
                                <label className="flex items-center space-x-3 text-sm text-gray-300 bg-[#111] p-2 rounded cursor-pointer hover:bg-white/5 border border-white/5 transition-colors">
                                    <input type="checkbox" checked={config.showSubtitle ?? true} onChange={(e) => updateConfig('showSubtitle', e.target.checked)} className="accent-[#ff5a00] w-4 h-4 cursor-pointer" />
                                    <span>Mostra Sottotitolo</span>
                                </label>
                                <label className="flex items-center space-x-3 text-sm text-gray-300 bg-[#111] p-2 rounded cursor-pointer hover:bg-white/5 border border-white/5 transition-colors">
                                    <input type="checkbox" checked={config.showCta ?? true} onChange={(e) => updateConfig('showCta', e.target.checked)} className="accent-[#ff5a00] w-4 h-4 cursor-pointer" />
                                    <span>Mostra Pulsante (CTA)</span>
                                </label>
                            </div>
                        )}

                        {block.type === 'imageWithText' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Posizione Immagine</label>
                                    <select
                                        value={config.imagePosition || 'left'}
                                        onChange={(e) => updateConfig('imagePosition', e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2 text-white text-xs outline-none focus:border-[#ff5a00] transition-colors cursor-pointer"
                                    >
                                        <option value="left">Sinistra del testo</option>
                                        <option value="right">Destra del testo</option>
                                        <option value="top">Sopra il testo (Verticale)</option>
                                        <option value="bottom">Sotto il testo (Verticale)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#ff5a00] uppercase tracking-widest mb-2">URL Immagine</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={block.imageUrl || ''}
                                        onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value })}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2 text-white text-sm outline-none focus:border-[#ff5a00] transition-colors"
                                    />
                                </div>
                            </div>
                        )}

                        {block.type === 'dynamicData' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo Dati Dinamici</label>
                                    <select
                                        value={config.dataType || 'nextMatch'}
                                        onChange={(e) => updateConfig('dataType', e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2 text-white text-xs outline-none focus:border-[#ff5a00] transition-colors cursor-pointer"
                                    >
                                        <option value="nextMatch">Prossima Partita</option>
                                        <option value="lastResults">Ultimi Risultati</option>
                                        <option value="standings">Classifica Squadre</option>
                                        <option value="squadPreview">Anteprima Giocatori in Rosa</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {block.type === 'countdown' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#ff5a00] uppercase tracking-widest mb-2">Data Scadenza Evento</label>
                                    <input
                                        type="datetime-local"
                                        value={block.targetDate ? new Date(block.targetDate).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => updateBlock(block.id, { targetDate: new Date(e.target.value).toISOString() })}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2 text-white text-sm outline-none focus:border-[#ff5a00] transition-colors"
                                    />
                                </div>
                            </div>
                        )}

                        {block.type === 'video' && (
                            <div className="space-y-4">
                                <label className="flex items-center space-x-3 text-sm text-gray-300 bg-[#111] p-2 rounded cursor-pointer hover:bg-white/5 border border-white/5 transition-colors">
                                    <input type="checkbox" checked={config.autoplay ?? false} onChange={(e) => updateConfig('autoplay', e.target.checked)} className="accent-[#ff5a00] w-4 h-4 cursor-pointer" />
                                    <span>Riproduzione automatica</span>
                                </label>
                                <label className="flex items-center space-x-3 text-sm text-gray-300 bg-[#111] p-2 rounded cursor-pointer hover:bg-white/5 border border-white/5 transition-colors">
                                    <input type="checkbox" checked={config.muted ?? true} onChange={(e) => updateConfig('muted', e.target.checked)} className="accent-[#ff5a00] w-4 h-4 cursor-pointer" />
                                    <span>Inizia mutato (richiesto per autoplay)</span>
                                </label>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#ff5a00] uppercase tracking-widest mb-2">URL Video (YouTube / MP4)</label>
                                    <input
                                        type="text"
                                        placeholder="https://youtu.be/..."
                                        value={block.videoUrl || ''}
                                        onChange={(e) => updateBlock(block.id, { videoUrl: e.target.value })}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2 text-white text-sm outline-none focus:border-[#ff5a00] transition-colors"
                                    />
                                    <span className="text-[10px] text-gray-500 mt-1 block">Incolla link YouTube, Vimeo o URL diretto mp4</span>
                                </div>
                            </div>
                        )}

                        {block.type === 'carousel' && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="flex items-center space-x-3 text-sm text-gray-300 bg-[#111] p-2 rounded cursor-pointer hover:bg-white/5 border border-white/5 transition-colors">
                                        <input type="checkbox" checked={config.autoplay ?? true} onChange={(e) => updateConfig('autoplay', e.target.checked)} className="accent-[#ff5a00] w-4 h-4 cursor-pointer" />
                                        <span>Autoplay Carosello</span>
                                    </label>
                                    <label className="flex items-center space-x-3 text-sm text-gray-300 bg-[#111] p-2 rounded cursor-pointer hover:bg-white/5 border border-white/5 transition-colors">
                                        <input type="checkbox" checked={config.showArrows ?? true} onChange={(e) => updateConfig('showArrows', e.target.checked)} className="accent-[#ff5a00] w-4 h-4 cursor-pointer" />
                                        <span>Mostra Frecce Navigazione</span>
                                    </label>
                                    <label className="flex items-center space-x-3 text-sm text-gray-300 bg-[#111] p-2 rounded cursor-pointer hover:bg-white/5 border border-white/5 transition-colors">
                                        <input type="checkbox" checked={config.showDots ?? true} onChange={(e) => updateConfig('showDots', e.target.checked)} className="accent-[#ff5a00] w-4 h-4 cursor-pointer" />
                                        <span>Mostra Indicatori (Pallini)</span>
                                    </label>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <label className="block text-[10px] font-bold text-[#ff5a00] uppercase tracking-widest mb-2">Gestione Slide (Immagini)</label>
                                    {(config.slides || [{ imageUrl: '' }]).map((slide: any, idx: number) => (
                                        <div key={idx} className="space-y-2 bg-[#111] p-3 rounded border border-white/5">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Slide {idx + 1}</span>
                                                {config.slides?.length > 1 && (
                                                    <button 
                                                        onClick={() => {
                                                            const newSlides = config.slides.filter((_: any, i: number) => i !== idx);
                                                            updateConfig('slides', newSlides);
                                                        }}
                                                        className="text-red-500 text-[10px] hover:underline uppercase"
                                                    >
                                                        Rimuovi
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="URL immagine slide..."
                                                value={slide.imageUrl || ''}
                                                onChange={(e) => {
                                                    const newSlides = [...(config.slides || [{ imageUrl: '' }])];
                                                    newSlides[idx] = { ...newSlides[idx], imageUrl: e.target.value };
                                                    updateConfig('slides', newSlides);
                                                }}
                                                className="w-full bg-black border border-white/10 rounded p-2 text-white text-xs outline-none focus:border-[#ff5a00]"
                                            />
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => {
                                            const newSlides = [...(config.slides || [{ imageUrl: '' }]), { imageUrl: '' }];
                                            updateConfig('slides', newSlides);
                                        }}
                                        className="w-full py-2 bg-[#ff5a00]/10 border border-[#ff5a00]/30 text-[#ff5a00] rounded text-[10px] font-bold uppercase tracking-widest hover:bg-[#ff5a00]/20 transition-all"
                                    >
                                        + Aggiungi Slide
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Delete Button */}
                <div className="pt-4 border-t border-white/5 mt-auto">
                    <button
                        onClick={handleDelete}
                        className="w-full py-3 bg-red-900/20 hover:bg-red-600 border border-red-500/30 text-white rounded flex items-center justify-center space-x-2 transition-colors uppercase tracking-widest text-xs font-bold shadow-lg hover:shadow-[0_0_20px_rgba(255,0,0,0.5)]"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Rimuovi Sezione Definitivamente</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
