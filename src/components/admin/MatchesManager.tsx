"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, X, Edit2, Trash2, Plus, User, Shield, Activity, Info } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, serverTimestamp, Timestamp } from "firebase/firestore";
import { normalizeDate } from "@/lib/utils";

type Player = {
    id: string;
    name: string;
};

type StatEvent = {
    id: string;
    playerId: string;
    playerName: string;
    type: 'goal' | 'assist' | 'yellow' | 'red';
};

type Match = {
    id: string;
    date: Timestamp;
    opponent: string;
    we: number;
    they: number;
    isPlayed: boolean;
    venue: string;
    matchType: "campionato" | "coppa" | "amichevole";
    isHome: boolean;
    time?: string;
    stats?: StatEvent[];
    formation?: string;
    lineup?: Record<string, string>;
    bench?: string[];
};

const initialFormState = {
    date: "",
    time: "",
    opponent: "",
    we: 0,
    they: 0,
    isPlayed: false,
    isHome: true,
    venue: "Campo Centrale, Milano",
    matchType: "campionato" as "campionato" | "coppa" | "amichevole",
    stats: [] as StatEvent[],
    formation: "2-3-1",
    lineup: {} as Record<string, string>,
    bench: [] as string[],
};

const formationOptions = ['2-2-2', '2-3-1', '3-1-2', '3-2-1'];

const getPositionsForFormation = (formation: string) => {
    switch (formation) {
        case '2-2-2': return ['Portiere (GK)', 'Difensore 1', 'Difensore 2', 'Centrocampista 1', 'Centrocampista 2', 'Attaccante 1', 'Attaccante 2'];
        case '2-3-1': return ['Portiere (GK)', 'Difensore 1', 'Difensore 2', 'Esterno 1', 'Centrale', 'Esterno 2', 'Attaccante 1'];
        case '3-1-2': return ['Portiere (GK)', 'Difensore sx', 'Difensore c', 'Difensore dx', 'Centrocampista', 'Attaccante 1', 'Attaccante 2'];
        case '3-2-1': return ['Portiere (GK)', 'Difensore sx', 'Difensore c', 'Difensore dx', 'Mediano 1', 'Mediano 2', 'Attaccante 1'];
        default: return ['Portiere (GK)', 'Difensore 1', 'Difensore 2', 'Centrocampista 1', 'Centrocampista 2', 'Centrocampista 3', 'Attaccante 1'];
    }
};

const positionKeys = ['pos1', 'pos2', 'pos3', 'pos4', 'pos5', 'pos6', 'pos7'];

export default function MatchesManager() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState(initialFormState);
    const [activeTab, setActiveTab] = useState<'info' | 'formazione' | 'statistiche'>('info');

    useEffect(() => {
        fetchMatches();
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "players"));
            const playersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
            })) as Player[];
            // Ordinamento alfabetico
            playersData.sort((a, b) => a.name.localeCompare(b.name));
            setPlayers(playersData);
        } catch (error) {
            console.error("Error fetching players:", error);
        }
    };

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "matches"), orderBy("date", "desc"));
            const querySnapshot = await getDocs(q);
            const matchesData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                // Migrazione retroattiva da scorers a stats temporanea se necessario, noi assumeremo structure pulita.
                return {
                    id: doc.id,
                    ...data,
                    stats: data.stats || [],
                    formation: data.formation || '2-3-1',
                    lineup: data.lineup || {}
                } as Match;
            });
            setMatches(matchesData);
        } catch (error) {
            console.error("Error fetching matches:", error);
        }
        setLoading(false);
    };

    const handleOpenModal = (match?: Match) => {
        setActiveTab('info');
        if (match) {
            setEditingId(match.id);
            const dateObj = normalizeDate(match.date);
            const dateStr = dateObj.toISOString().split('T')[0];

            setFormData({
                date: dateStr,
                time: match.time || "",
                opponent: match.opponent,
                we: match.we,
                they: match.they,
                isPlayed: match.isPlayed,
                isHome: match.isHome !== false,
                venue: match.venue,
                matchType: match.matchType || "campionato",
                stats: match.stats || [],
                formation: match.formation || '2-3-1',
                lineup: match.lineup || {},
                bench: match.bench || [],
            });
        } else {
            setEditingId(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData(initialFormState);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : name === "we" || name === "they" ? Number(value) : value
        }));
    };

    const addStatEvent = (type: 'goal' | 'assist' | 'yellow' | 'red') => {
        if (players.length === 0) return;
        setFormData(prev => ({
            ...prev,
            stats: [...prev.stats, { id: Date.now().toString(), playerId: players[0].id, playerName: players[0].name, type }]
        }));
    };

    const updateStatEvent = (id: string, playerId: string) => {
        const player = players.find(p => p.id === playerId);
        if (!player) return;
        setFormData(prev => ({
            ...prev,
            stats: prev.stats.map(stat => stat.id === id ? { ...stat, playerId: player.id, playerName: player.name } : stat)
        }));
    };

    const removeStatEvent = (id: string) => {
        setFormData(prev => ({
            ...prev,
            stats: prev.stats.filter(stat => stat.id !== id)
        }));
    };

    const updateLineup = (posKey: string, playerId: string) => {
        setFormData(prev => ({
            ...prev,
            lineup: { ...prev.lineup, [posKey]: playerId }
        }));
    };

    const updateBench = (index: number, playerId: string) => {
        setFormData(prev => {
            const newBench = [...prev.bench];
            newBench[index] = playerId;
            return { ...prev, bench: newBench };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dateObj = new Date(formData.date);
            const dateTimestamp = Timestamp.fromDate(dateObj);

            const matchData = {
                date: dateTimestamp,
                opponent: formData.opponent,
                time: formData.time || "",
                we: Number(formData.we),
                they: Number(formData.they),
                isPlayed: formData.isPlayed,
                isHome: formData.isHome,
                venue: formData.venue,
                matchType: formData.matchType || "campionato",
                stats: formData.isPlayed ? formData.stats : [],
                formation: formData.formation,
                lineup: formData.lineup,
                bench: formData.bench.filter(id => id !== ""),
                updatedAt: serverTimestamp(),
            };

            if (editingId) {
                await updateDoc(doc(db, "matches", editingId), matchData);
            } else {
                await addDoc(collection(db, "matches"), {
                    ...matchData,
                    createdAt: serverTimestamp(),
                });
            }
            fetchMatches();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving match:", error);
            alert("Errore nel salvataggio. Riprova.");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questa partita?")) {
            setLoading(true);
            try {
                await deleteDoc(doc(db, "matches", id));
                fetchMatches();
            } catch (error) {
                console.error("Error deleting match:", error);
                alert("Errore nell'eliminazione.");
            }
            setLoading(false);
        }
    };

    const formatDate = (date: any) => {
        const d = normalizeDate(date);
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getStatColor = (type: string) => {
        switch (type) {
            case 'goal': return 'text-green-500';
            case 'assist': return 'text-blue-500';
            case 'yellow': return 'text-yellow-500';
            case 'red': return 'text-red-500';
            default: return 'text-white';
        }
    };

    const getStatLabel = (type: string) => {
        switch (type) {
            case 'goal': return 'Gol';
            case 'assist': return 'Assist';
            case 'yellow': return 'Giallo';
            case 'red': return 'Rosso';
            default: return type;
        }
    };

    const currentPositionsLabels = getPositionsForFormation(formData.formation);

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            <header className="h-20 bg-[#0a0a0a] border-b border-white/10 flex items-center px-8 justify-between shrink-0">
                <div className="flex items-center space-x-4">
                    <Calendar className="w-6 h-6 text-[#ff5a00]" />
                    <h2 className="font-heading text-2xl font-bold uppercase text-white tracking-widest">Gestione Partite</h2>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-[#ff5a00] text-white px-4 py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-[#e04e00] transition-colors shadow-lg shadow-[#ff5a00]/20"
                >
                    + Aggiungi Partita
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a]">
                {loading && matches.length === 0 ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-[#ff5a00] font-heading text-xl animate-pulse">CARICAMENTO DATI...</div>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="bg-[#0f0f0f] border border-white/10 p-12 rounded-lg text-center">
                        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="font-heading text-xl text-white uppercase tracking-wider mb-2">Nessuna partita</h3>
                        <p className="text-gray-500 mb-6">Non hai ancora aggiunto partite al calendario.</p>
                    </div>
                ) : (
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-lg overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-black border-b border-white/10 text-gray-500 font-heading text-xs uppercase tracking-wider">
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Avversario</th>
                                    <th className="p-4 text-center">Tipo</th>
                                    <th className="p-4 text-center">Campo</th>
                                    <th className="p-4 text-center">Giocata?</th>
                                    <th className="p-4 text-center">Risultato</th>
                                    <th className="p-4 text-center">Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matches.map((match) => (
                                    <tr key={match.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="p-4 text-gray-400 font-bold">{formatDate(match.date)}</td>
                                        <td className="p-4 font-bold text-white">{match.opponent}</td>
                                        <td className="p-4 text-center">
                                            {(() => {
                                                const type = match.matchType || "campionato";
                                                const styles: Record<string, string> = {
                                                    campionato: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                                                    coppa: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
                                                    amichevole: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
                                                };
                                                const labels: Record<string, string> = { campionato: "Campionato", coppa: "Coppa", amichevole: "Amichevole" };
                                                return <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${styles[type]}`}>{labels[type]}</span>;
                                            })()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                match.isHome !== false
                                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                    : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                            }`}>
                                                {match.isHome !== false ? "Casa" : "Trasferta"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {match.isPlayed ? (
                                                <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold uppercase border border-green-500/20">Sì</span>
                                            ) : (
                                                <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-bold uppercase border border-yellow-500/20">No</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center font-bold">
                                            {match.isPlayed ? `${match.we} - ${match.they}` : '-'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center space-x-3">
                                                <button onClick={() => handleOpenModal(match)} className="text-gray-400 hover:text-white transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(match.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#0f0f0f] border border-white/10 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
                                <h3 className="font-heading text-2xl font-bold uppercase text-white tracking-widest">
                                    {editingId ? "Dettagli Partita" : "Nuova Partita"}
                                </h3>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex border-b border-white/10 shrink-0 bg-black/30">
                                <button
                                    onClick={() => setActiveTab('info')}
                                    className={`flex-1 py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center transition-colors ${activeTab === 'info' ? 'text-[#ff5a00] border-b-2 border-[#ff5a00] bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <Info className="w-4 h-4 mr-2" /> Info Generali
                                </button>
                                <button
                                    onClick={() => setActiveTab('formazione')}
                                    className={`flex-1 py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center transition-colors ${activeTab === 'formazione' ? 'text-[#ff5a00] border-b-2 border-[#ff5a00] bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <Shield className="w-4 h-4 mr-2" /> Formazione
                                </button>
                                <button
                                    onClick={() => setActiveTab('statistiche')}
                                    className={`flex-1 py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center transition-colors ${activeTab === 'statistiche' ? 'text-[#ff5a00] border-b-2 border-[#ff5a00] bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <Activity className="w-4 h-4 mr-2" /> Statistiche
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {activeTab === 'info' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Data Partita</label>
                                                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full bg-black border border-white/10 rounded p-2 text-white focus:border-[#ff5a00] outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Orario</label>
                                                <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-2 text-white focus:border-[#ff5a00] outline-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Squadra Avversaria</label>
                                            <input type="text" name="opponent" value={formData.opponent} onChange={handleInputChange} required className="w-full bg-black border border-white/10 rounded p-2 text-white focus:border-[#ff5a00] outline-none" placeholder="Es: Real Madrid" />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tipo Partita</label>
                                                <select name="matchType" value={formData.matchType} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-2 text-white focus:border-[#ff5a00] outline-none font-bold uppercase tracking-wide">
                                                    <option value="campionato" className="bg-black">Campionato</option>
                                                    <option value="coppa" className="bg-black">Coppa</option>
                                                    <option value="amichevole" className="bg-black">Amichevole</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Luogo / Campo</label>
                                                <input type="text" name="venue" value={formData.venue} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-2 text-white focus:border-[#ff5a00] outline-none" />
                                            </div>
                                        </div>

                                        {/* Home/Away Toggle */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Campo di Gioco</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, isHome: true }))}
                                                    className={`py-3 px-4 rounded-lg font-bold uppercase tracking-widest text-sm transition-all border ${
                                                        formData.isHome
                                                            ? "bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                                                            : "bg-black/30 border-white/10 text-gray-500 hover:text-gray-300"
                                                    }`}
                                                >
                                                    🏠 Casa
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, isHome: false }))}
                                                    className={`py-3 px-4 rounded-lg font-bold uppercase tracking-widest text-sm transition-all border ${
                                                        !formData.isHome
                                                            ? "bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                                                            : "bg-black/30 border-white/10 text-gray-500 hover:text-gray-300"
                                                    }`}
                                                >
                                                    ✈️ Trasferta
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3 bg-black/50 p-4 border border-white/5 rounded-lg">
                                            <input type="checkbox" id="isPlayed" name="isPlayed" checked={formData.isPlayed} onChange={handleInputChange} className="w-5 h-5 accent-[#ff5a00]" />
                                            <label htmlFor="isPlayed" className="font-bold uppercase text-white tracking-wider cursor-pointer">Partita già giocata?</label>
                                        </div>

                                        {formData.isPlayed && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#ff5a00]/10 border border-[#ff5a00]/20 p-4 rounded-lg">
                                                    <div>
                                                        <label className="block text-xs font-bold text-[#ff5a00] uppercase tracking-widest mb-1 text-center">Gol Glass Cannons</label>
                                                        <input type="number" name="we" value={formData.we} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-4 text-center text-2xl font-heading text-white focus:border-[#ff5a00] outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Gol Avversari</label>
                                                        <input type="number" name="they" value={formData.they} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-4 text-center text-2xl font-heading text-white focus:border-[#ff5a00] outline-none" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'formazione' && (
                                    <div className="space-y-6">
                                        <div className="bg-black/30 p-4 border border-white/10 rounded-lg">
                                            <label className="block text-xs font-bold text-[#ff5a00] uppercase tracking-widest mb-2">Modulo (7vs7)</label>
                                            <select
                                                name="formation"
                                                value={formData.formation}
                                                onChange={handleInputChange}
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded p-3 text-white focus:border-[#ff5a00] outline-none font-bold uppercase tracking-wider"
                                            >
                                                {formationOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {positionKeys.map((key, index) => (
                                                <div key={key} className="bg-black/20 border border-white/5 rounded-lg p-3 flex flex-col">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{currentPositionsLabels[index]}</label>
                                                    <select
                                                        value={formData.lineup[key] || ""}
                                                        onChange={(e) => updateLineup(key, e.target.value)}
                                                        className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-[#ff5a00] outline-none text-sm"
                                                    >
                                                        <option value="" className="bg-black text-gray-500">Non assegnato</option>
                                                        {players.map(p => (
                                                            <option key={p.id} value={p.id} className="bg-black text-white">{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-black/30 p-4 border border-white/10 rounded-lg">
                                            <label className="block text-xs font-bold text-[#ff5a00] uppercase tracking-widest mb-4">Panchina (Massimo 7)</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                                                    <div key={idx} className="flex flex-col">
                                                        <select
                                                            value={formData.bench[idx] || ""}
                                                            onChange={(e) => updateBench(idx, e.target.value)}
                                                            className="w-full bg-black/40 border border-white/5 rounded p-2 text-white focus:border-[#ff5a00] outline-none text-xs"
                                                        >
                                                            <option value="" className="bg-black text-gray-500">Panchina {idx + 1}</option>
                                                            {players.map(p => (
                                                                <option key={p.id} value={p.id} className="bg-black text-white">{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'statistiche' && (
                                    <div className="space-y-6">
                                        {!formData.isPlayed && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded text-sm text-center font-bold tracking-widest uppercase mb-4">
                                                Le statistiche saranno visibili/editabili solo per le partite già giocate.
                                            </div>
                                        )}
                                        {formData.isPlayed && (
                                            <>
                                                <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-6">
                                                    <button type="button" onClick={() => addStatEvent('goal')} className="px-4 py-2 bg-green-500/20 text-green-500 hover:bg-green-500/40 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-green-500/30 flex items-center">
                                                        <Plus className="w-3 h-3 mr-1" /> Add Gol
                                                    </button>
                                                    <button type="button" onClick={() => addStatEvent('assist')} className="px-4 py-2 bg-blue-500/20 text-blue-500 hover:bg-blue-500/40 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-blue-500/30 flex items-center">
                                                        <Plus className="w-3 h-3 mr-1" /> Add Assist
                                                    </button>
                                                    <button type="button" onClick={() => addStatEvent('yellow')} className="px-4 py-2 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/40 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-yellow-500/30 flex items-center">
                                                        <Plus className="w-3 h-3 mr-1" /> Add Giallo
                                                    </button>
                                                    <button type="button" onClick={() => addStatEvent('red')} className="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/40 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-red-500/30 flex items-center">
                                                        <Plus className="w-3 h-3 mr-1" /> Add Rosso
                                                    </button>
                                                </div>

                                                <div className="space-y-2">
                                                    {formData.stats.length === 0 ? (
                                                        <p className="text-center text-gray-500 uppercase tracking-widest text-xs py-8 border border-dashed border-white/10 rounded">Nessun evento registrato</p>
                                                    ) : (
                                                        formData.stats.map(stat => (
                                                            <div key={stat.id} className="flex items-center space-x-3 bg-black/40 p-3 rounded-lg border border-white/5">
                                                                <div className={`text-xs font-black uppercase tracking-widest w-16 text-center ${getStatColor(stat.type)}`}>
                                                                    {getStatLabel(stat.type)}
                                                                </div>
                                                                <select
                                                                    value={stat.playerId}
                                                                    onChange={(e) => updateStatEvent(stat.id, e.target.value)}
                                                                    className="flex-1 bg-transparent text-white border-b border-white/10 pb-1 focus:outline-none focus:border-[#ff5a00] text-sm"
                                                                >
                                                                    <option value="" className="bg-black">Seleziona giocatore</option>
                                                                    {players.map(p => (
                                                                        <option key={p.id} value={p.id} className="bg-black">{p.name}</option>
                                                                    ))}
                                                                </select>
                                                                <button type="button" onClick={() => removeStatEvent(stat.id)} className="text-gray-500 hover:text-red-500 p-2 transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-4 p-6 border-t border-white/10 shrink-0 bg-black/50">
                                <button type="button" onClick={handleCloseModal} className="px-6 py-2 border border-white/10 rounded font-bold uppercase tracking-wider text-sm text-gray-400 hover:text-white transition-colors">
                                    Annulla
                                </button>
                                <button onClick={handleSubmit} disabled={loading} className="px-8 py-2 bg-[#ff5a00] rounded font-bold uppercase tracking-wider text-sm text-white hover:bg-[#e04e00] transition-colors shadow-lg shadow-[#ff5a00]/20">
                                    {loading ? "Salvataggio..." : "Salva Partita"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
