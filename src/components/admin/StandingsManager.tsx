"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, Edit2, Trash2, Plus, RefreshCw, Lock } from "lucide-react";
import { db } from "@/lib/firebase";
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where
} from "firebase/firestore";

type TeamRow = {
    id: string;
    team: string;
    pts: number;
    p: number;
    w: number;
    d: number;
    l: number;
    gf: number;
    ga: number;
};

type GlassCannonsRow = TeamRow & { isAuto: true };

const emptyForm = { team: "", pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };

export default function StandingsManager() {
    const [teams, setTeams] = useState<TeamRow[]>([]);
    const [glassCannons, setGlassCannons] = useState<GlassCannonsRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState(emptyForm);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch manual teams from "standings" collection
            const snap = await getDocs(collection(db, "standings"));
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as TeamRow));
            setTeams(rows);

            // Calculate Glass Cannons from matches
            const matchSnap = await getDocs(
                query(collection(db, "matches"), where("isPlayed", "==", true))
            );
            const matches = matchSnap.docs.map(d => d.data());
            const gc: GlassCannonsRow = {
                id: "__gc__", team: "Glass Cannons",
                pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, isAuto: true
            };
            for (const m of matches) {
                if (m.matchType && m.matchType !== "campionato") continue;
                gc.p++;
                gc.gf += m.we;
                gc.ga += m.they;
                if (m.we > m.they) { gc.w++; gc.pts += 3; }
                else if (m.we < m.they) { gc.l++; }
                else { gc.d++; gc.pts++; }
            }
            setGlassCannons(gc);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpen = (team?: TeamRow) => {
        if (team) {
            setEditingId(team.id);
            setFormData({ team: team.team, pts: team.pts, p: team.p, w: team.w, d: team.d, l: team.l, gf: team.gf, ga: team.ga });
        } else {
            setEditingId(null);
            setFormData(emptyForm);
        }
        setIsModalOpen(true);
    };

    const handleClose = () => { setIsModalOpen(false); setEditingId(null); setFormData(emptyForm); };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === "team" ? value : Number(value) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await updateDoc(doc(db, "standings", editingId), { ...formData });
            } else {
                await addDoc(collection(db, "standings"), { ...formData });
            }
            await fetchData();
            handleClose();
        } catch (err) {
            console.error(err);
            alert("Errore nel salvataggio.");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Eliminare questa squadra dalla classifica?")) return;
        setLoading(true);
        try {
            await deleteDoc(doc(db, "standings", id));
            await fetchData();
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    // Build combined + sorted standings for preview
    const allTeams: (TeamRow | GlassCannonsRow)[] = glassCannons
        ? [...teams, glassCannons]
        : [...teams];
    const sorted = [...allTeams]
        .map(t => ({ ...t, gd: t.gf - t.ga }))
        .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
        .map((t, i) => ({ ...t, pos: i + 1 }));

    const FIELDS = [
        { key: "pts", label: "Pts" }, { key: "p", label: "PG" },
        { key: "w", label: "V" }, { key: "d", label: "N" }, { key: "l", label: "S" },
        { key: "gf", label: "GF" }, { key: "ga", label: "GS" },
    ] as const;

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            <header className="min-h-[5rem] py-4 bg-[#0a0a0a] border-b border-white/10 flex flex-wrap items-center px-4 md:px-8 justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff5a00]" />
                    <h2 className="font-heading text-xl sm:text-2xl font-bold uppercase text-white tracking-widest">Gestione Classifica</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button onClick={fetchData} disabled={loading}
                        className="flex items-center gap-1 sm:gap-2 bg-white/5 text-gray-400 px-3 py-2 sm:px-4 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all border border-white/10">
                        <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Aggiorna</span>
                    </button>
                    <button onClick={() => handleOpen()}
                        className="bg-[#ff5a00] text-white px-3 py-2 sm:px-4 rounded text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[#e04e00] transition-colors shadow-lg shadow-[#ff5a00]/20 flex items-center gap-1 sm:gap-2">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Aggiungi <span className="hidden sm:inline">Squadra</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a] space-y-6">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-[#ff5a00] font-heading text-xl animate-pulse">CARICAMENTO...</div>
                    </div>
                ) : (
                    <>
                        {/* Info banner */}
                        <div className="bg-[#ff5a00]/5 border border-[#ff5a00]/20 rounded-lg p-4 flex items-start gap-3">
                            <Lock className="w-4 h-4 text-[#ff5a00] mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-400 leading-relaxed">
                                <span className="text-[#ff5a00] font-bold">Glass Cannons</span> vengono aggiornati automaticamente dai risultati delle partite.
                                Tutte le altre squadre si gestiscono manualmente da questo pannello.
                            </p>
                        </div>

                        {/* Standings preview table */}
                        <div className="bg-[#0f0f0f] border border-white/10 rounded-lg overflow-hidden">
                            <div className="px-6 py-3 bg-black/40 border-b border-white/5 flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Anteprima Classifica</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-black border-b border-white/10 text-gray-500 font-heading text-xs uppercase tracking-wider">
                                            <th className="p-4 w-12 text-center">#</th>
                                            <th className="p-4">Squadra</th>
                                            <th className="p-4 text-center">Pts</th>
                                            <th className="p-4 text-center">PG</th>
                                            <th className="p-4 text-center">V</th>
                                            <th className="p-4 text-center">N</th>
                                            <th className="p-4 text-center">S</th>
                                            <th className="p-4 text-center">GF</th>
                                            <th className="p-4 text-center">GS</th>
                                            <th className="p-4 text-center">DR</th>
                                            <th className="p-4 text-center">Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sorted.map((row) => {
                                            const isGC = row.team === "Glass Cannons";
                                            const gd = row.gf - row.ga;
                                            return (
                                                <tr key={row.id} className={`border-b border-white/5 transition-colors ${isGC ? "bg-[#ff5a00]/10" : "hover:bg-white/5"}`}>
                                                    <td className="p-4 text-center font-bold text-gray-400">
                                                        {(row as any).pos === 1 ? <span className="text-yellow-500">1</span> : (row as any).pos}
                                                    </td>
                                                    <td className={`p-4 font-bold flex items-center gap-2 ${isGC ? "text-white" : "text-gray-300"}`}>
                                                        {row.team}
                                                        {isGC && <span className="text-[8px] bg-[#ff5a00]/20 text-[#ff5a00] border border-[#ff5a00]/30 px-1.5 py-0.5 rounded uppercase tracking-wider font-black">Auto</span>}
                                                    </td>
                                                    <td className={`p-4 text-center font-bold text-lg ${isGC ? "text-[#ff5a00]" : "text-white"}`}>{row.pts}</td>
                                                    <td className="p-4 text-center text-gray-500">{row.p}</td>
                                                    <td className="p-4 text-center text-gray-500">{row.w}</td>
                                                    <td className="p-4 text-center text-gray-500">{row.d}</td>
                                                    <td className="p-4 text-center text-gray-500">{row.l}</td>
                                                    <td className="p-4 text-center text-gray-500">{row.gf}</td>
                                                    <td className="p-4 text-center text-gray-500">{row.ga}</td>
                                                    <td className={`p-4 text-center font-bold text-sm ${gd > 0 ? "text-green-400" : gd < 0 ? "text-red-400" : "text-gray-500"}`}>
                                                        {gd > 0 ? `+${gd}` : gd}
                                                    </td>
                                                    <td className="p-4">
                                                        {isGC ? (
                                                            <div className="flex justify-center">
                                                                <Lock className="w-4 h-4 text-gray-700" />
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-3">
                                                                <button onClick={() => handleOpen(row as TeamRow)} className="text-gray-400 hover:text-white transition-colors" title="Modifica">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDelete(row.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Elimina">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto py-8 sm:py-20"
                        onClick={handleClose}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0f0f0f] border border-white/10 rounded-lg shadow-2xl w-full max-w-[calc(100vw-2rem)] md:max-w-xl p-4 md:p-8 flex flex-col max-h-[85vh] sm:max-h-none overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-white/10 pb-4 shrink-0">
                                <h3 className="font-heading text-lg sm:text-xl font-bold uppercase text-white tracking-wider sm:tracking-widest">
                                    {editingId ? "Modifica Squadra" : "Nuova Squadra"}
                                </h3>
                                <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors shrink-0">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar p-1">
                                {/* Team Name */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nome Squadra</label>
                                    <input
                                        type="text" name="team" value={formData.team} onChange={handleChange} required
                                        placeholder="Es: Real Madrid 7s"
                                        className="w-full bg-black border border-white/10 rounded p-2.5 text-white placeholder-gray-600 focus:border-[#ff5a00] focus:ring-1 focus:ring-[#ff5a00] outline-none transition-colors"
                                    />
                                </div>

                                {/* Stats grid */}
                                <div>
                                    <h4 className="text-xs font-bold text-[#ff5a00] uppercase tracking-widest border-b border-[#ff5a00]/20 pb-2 mb-3">Statistiche</h4>
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                        {/* Punti full width */}
                                        <div className="col-span-3">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Punti</label>
                                            <input
                                                type="number" name="pts" value={formData.pts} onChange={handleChange} min={0}
                                                className="w-full bg-black border border-[#ff5a00]/30 rounded p-2.5 text-[#ff5a00] text-center text-xl font-black focus:border-[#ff5a00] outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {FIELDS.filter(f => f.key !== "pts").map(({ key, label }) => (
                                            <div key={key}>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">{label}</label>
                                                <input
                                                    type="number" name={key} value={(formData as any)[key]} onChange={handleChange} min={0}
                                                    className="w-full bg-black border border-white/10 rounded p-2 text-white text-center font-bold focus:border-[#ff5a00] outline-none transition-colors"
                                                />
                                            </div>
                                        ))}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">DR</label>
                                            <div className="w-full bg-black/40 border border-white/5 rounded p-2 text-center font-bold text-sm text-gray-500">
                                                {formData.gf - formData.ga > 0 ? `+${formData.gf - formData.ga}` : formData.gf - formData.ga}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={handleClose}
                                        className="px-5 py-2 rounded border border-white/10 text-gray-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors">
                                        Annulla
                                    </button>
                                    <button type="submit" disabled={loading}
                                        className="px-6 py-2 bg-[#ff5a00] rounded font-bold uppercase tracking-wider text-sm text-white hover:bg-[#e04e00] transition-colors disabled:opacity-60">
                                        {loading ? "Salvataggio..." : "Salva"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
