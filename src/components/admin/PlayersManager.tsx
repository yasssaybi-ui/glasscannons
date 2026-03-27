"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, Edit2, Trash2, RefreshCw } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

type Player = {
    id: string;
    name: string;
    number: number;
    role: string;
    image: string;
    personal: { age: number; height: string };
    stats: { goals: number; assists: number; appearances: number; yellowCards: number; redCards: number; saves?: number; goalsConceded?: number; cleanSheets?: number };
};

const initialFormState = {
    name: "",
    number: 0,
    role: "Attaccante",
    image: "",
    age: 0,
    height: "",
    goals: 0,
    assists: 0,
    appearances: 0,
    yellowCards: 0,
    redCards: 0,
    saves: 0,
    goalsConceded: 0,
    cleanSheets: 0,
};

export default function PlayersManager() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "players"));
            const playersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Player[];
            playersData.sort((a, b) => a.number - b.number);
            setPlayers(playersData);
        } catch (error) {
            console.error("Error fetching players:", error);
            alert("Errore nel caricamento dei giocatori.");
        }
        setLoading(false);
    };

    const syncStatsFromMatches = async () => {
        setLoading(true);
        try {
            // 1. Fetch all matches
            const matchesSnapshot = await getDocs(collection(db, "matches"));
            const allMatches = matchesSnapshot.docs.map(doc => doc.data());

            // 2. Calculate stats per player
            const statsMap: Record<string, { goals: number, assists: number, yellowCards: number, redCards: number, appearances: number }> = {};
            
            allMatches.forEach(match => {
                if (match.isPlayed) {
                    // Track players in this match to avoid double counting appearances
                    const playersInMatch = new Set<string>();
                    
                    // Add starters from lineup
                    if (match.lineup) {
                        Object.values(match.lineup).forEach((pid: any) => {
                            if (pid) playersInMatch.add(pid);
                        });
                    }
                    
                    // Add bench players
                    if (match.bench) {
                        match.bench.forEach((pid: any) => {
                            if (pid) playersInMatch.add(pid);
                        });
                    }

                    // Increment appearances for everyone who played
                    playersInMatch.forEach(pid => {
                        if (!statsMap[pid]) {
                            statsMap[pid] = { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0 };
                        }
                        statsMap[pid].appearances++;
                    });

                    // Add match specific stats
                    if (match.stats) {
                        match.stats.forEach((stat: any) => {
                            const pid = stat.playerId;
                            if (!statsMap[pid]) {
                                statsMap[pid] = { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0 };
                            }
                            if (stat.type === 'goal') statsMap[pid].goals++;
                            if (stat.type === 'assist') statsMap[pid].assists++;
                            if (stat.type === 'yellow') statsMap[pid].yellowCards++;
                            if (stat.type === 'red') statsMap[pid].redCards++;
                        });
                    }
                }
            });

            // 3. Update each player in Firestore
            const updatePromises = players.map(player => {
                const pStats = statsMap[player.id] || { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0 };
                const currentStats = player.stats;

                // Only update if current stats are different
                if (
                    currentStats.goals !== pStats.goals ||
                    currentStats.assists !== pStats.assists ||
                    currentStats.yellowCards !== pStats.yellowCards ||
                    currentStats.redCards !== pStats.redCards ||
                    currentStats.appearances !== pStats.appearances
                ) {
                    return updateDoc(doc(db, "players", player.id), {
                        "stats.goals": pStats.goals,
                        "stats.assists": pStats.assists,
                        "stats.yellowCards": pStats.yellowCards,
                        "stats.redCards": pStats.redCards,
                        "stats.appearances": pStats.appearances,
                    });
                }
                return Promise.resolve();
            });

            await Promise.all(updatePromises);
            await fetchPlayers();
            alert("Statistiche (Gol, Assist, Cartellini) sincronizzate con successo!");
        } catch (error) {
            console.error("Error syncing stats:", error);
            alert("Errore durante la sincronizzazione delle statistiche.");
        }
        setLoading(false);
    };

    const handleOpenModal = (player?: Player) => {
        if (player) {
            setEditingId(player.id);
            setFormData({
                name: player.name,
                number: player.number,
                role: player.role,
                image: player.image,
                age: player.personal.age,
                height: player.personal.height,
                goals: player.stats.goals,
                assists: player.stats.assists,
                appearances: player.stats.appearances,
                yellowCards: player.stats.yellowCards,
                redCards: player.stats.redCards,
                saves: player.stats.saves || 0,
                goalsConceded: player.stats.goalsConceded || 0,
                cleanSheets: player.stats.cleanSheets || 0,
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
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "name" || name === "role" || name === "image" || name === "height" ? value : Number(value)
        }));
    };

    const isGoalkeeper = formData.role === "Portiere";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const isGK = formData.role === "Portiere";
        const playerData = {
            name: formData.name,
            number: formData.number,
            role: formData.role,
            image: formData.image,
            personal: { age: formData.age, height: formData.height },
            stats: {
                goals: formData.goals,
                assists: formData.assists,
                appearances: formData.appearances,
                yellowCards: formData.yellowCards,
                redCards: formData.redCards,
                ...(isGK && {
                    saves: formData.saves,
                    goalsConceded: formData.goalsConceded,
                    cleanSheets: formData.cleanSheets,
                }),
            }
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, "players", editingId), playerData);
            } else {
                await addDoc(collection(db, "players"), playerData);
            }
            fetchPlayers();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving player:", error);
            alert("Errore nel salvataggio. Riprova.");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questo giocatore?")) {
            setLoading(true);
            try {
                await deleteDoc(doc(db, "players", id));
                fetchPlayers();
            } catch (error) {
                console.error("Error deleting player:", error);
                alert("Errore nell'eliminazione.");
            }
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            <header className="h-20 bg-[#0a0a0a] border-b border-white/10 flex items-center px-8 justify-between shrink-0">
                <h2 className="font-heading text-2xl font-bold uppercase text-white tracking-widest">Gestione Rosa</h2>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={syncStatsFromMatches}
                        className="flex items-center space-x-2 bg-white/5 text-gray-400 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-white/10 hover:text-[#ff5a00] transition-all border border-white/10"
                        title="Sincronizza le statistiche dai tabellini delle partite"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Sincronizza Statistiche</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-[#ff5a00] text-white px-4 py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-[#e04e00] transition-colors shadow-lg shadow-[#ff5a00]/20"
                    >
                        + Aggiungi Giocatore
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-[#ff5a00] font-heading text-xl animate-pulse">CARICAMENTO DATI...</div>
                    </div>
                ) : players.length === 0 ? (
                    <div className="bg-[#0f0f0f] border border-white/10 p-12 rounded-lg text-center">
                        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="font-heading text-xl text-white uppercase tracking-wider mb-2">Nessun giocatore</h3>
                        <p className="text-gray-500 mb-6">Non hai ancora aggiunto nessun giocatore alla rosa.</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="text-[#ff5a00] font-bold uppercase tracking-wider hover:underline"
                        >
                            Clicca qui per iniziare
                        </button>
                    </div>
                ) : (
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-lg overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-black border-b border-white/10 text-gray-500 font-heading text-xs uppercase tracking-wider">
                                    <th className="p-4 w-16 text-center">N°</th>
                                    <th className="p-4">Nome</th>
                                    <th className="p-4">Ruolo</th>
                                    <th className="p-4 text-center">Gol</th>
                                    <th className="p-4 text-center">Assist</th>
                                    <th className="p-4 text-center">Pres</th>
                                    <th className="p-4 text-center">Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((player) => (
                                    <tr key={player.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="p-4 text-center font-heading text-xl font-bold text-gray-400 group-hover:text-white transition-colors">{player.number}</td>
                                        <td className="p-4 font-bold text-white flex items-center space-x-3">
                                            {player.image && <img src={player.image} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />}
                                            <span>{player.name}</span>
                                        </td>
                                        <td className="p-4 text-sm text-[#ff5a00] uppercase tracking-wider font-bold">{player.role}</td>
                                        <td className="p-4 text-center font-bold">{player.stats.goals}</td>
                                        <td className="p-4 text-center font-bold">{player.stats.assists}</td>
                                        <td className="p-4 text-center font-bold">{player.stats.appearances}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center space-x-3">
                                                <button onClick={() => handleOpenModal(player)} className="text-gray-400 hover:text-white transition-colors" title="Modifica">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(player.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Elimina">
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
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0f0f0f] border border-white/10 rounded-lg shadow-2xl w-full max-w-4xl p-6 md:p-8 my-8"
                        >
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                <h3 className="font-heading text-2xl font-bold uppercase text-white tracking-widest">
                                    {editingId ? "Modifica Giocatore" : "Nuovo Giocatore"}
                                </h3>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-bold uppercase text-[#ff5a00] tracking-wider text-sm border-b border-[#ff5a00]/20 pb-2">Dati Principali</h4>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nome Completo</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full bg-black border border-white/10 rounded p-2 text-white placeholder-gray-600 focus:border-[#ff5a00] focus:ring-1 focus:ring-[#ff5a00] outline-none transition-colors" placeholder="Es: Mario Rossi" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Numero Maglia</label>
                                                <input type="number" name="number" value={formData.number} onChange={handleInputChange} required className="w-full bg-black border border-white/10 rounded p-2 text-white focus:border-[#ff5a00] focus:ring-1 focus:ring-[#ff5a00] outline-none transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ruolo</label>
                                                <select name="role" value={formData.role} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-2 text-white focus:border-[#ff5a00] focus:ring-1 focus:ring-[#ff5a00] outline-none transition-colors">
                                                    <option value="Portiere">Portiere</option>
                                                    <option value="Difensore">Difensore</option>
                                                    <option value="Centrocampista">Centrocampista</option>
                                                    <option value="Attaccante">Attaccante</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Link Foto (URL)</label>
                                            <input type="url" name="image" value={formData.image} onChange={handleInputChange} required className="w-full bg-black border border-white/10 rounded p-2 text-white placeholder-gray-600 focus:border-[#ff5a00] focus:ring-1 focus:ring-[#ff5a00] outline-none transition-colors" placeholder="https://..." />
                                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Incolla qui il link di un'immagine da internet</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Età</label>
                                                <input type="number" name="age" value={formData.age} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-2 text-white focus:border-[#ff5a00] outline-none transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Altezza (cm)</label>
                                                <input type="text" name="height" value={formData.height} onChange={handleInputChange} placeholder="es: 185cm" className="w-full bg-black border border-white/10 rounded p-2 text-white focus:border-[#ff5a00] outline-none transition-colors" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Info */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold uppercase text-[#ff5a00] tracking-wider text-sm border-b border-[#ff5a00]/20 pb-2">Statistiche</h4>

                                        <div className="grid grid-cols-3 gap-4">
                                            {!isGoalkeeper && (
                                                <>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gol</label>
                                                        <input type="number" name="goals" value={formData.goals} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-2 text-white text-center font-bold focus:border-[#ff5a00] outline-none transition-colors" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Assist</label>
                                                        <input type="number" name="assists" value={formData.assists} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-2 text-white text-center font-bold focus:border-[#ff5a00] outline-none transition-colors" />
                                                    </div>
                                                </>
                                            )}
                                            <div className={isGoalkeeper ? "col-span-3" : ""}>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Presenze</label>
                                                <input type="number" name="appearances" value={formData.appearances} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-2 text-white text-center font-bold focus:border-[#ff5a00] outline-none transition-colors" />
                                            </div>
                                        </div>

                                        {isGoalkeeper && (
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">🧤 Rigori Parati</label>
                                                    <input type="number" name="saves" value={formData.saves} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-2 text-white text-center font-bold focus:border-[#ff5a00] outline-none transition-colors" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">⚽ Gol Subiti</label>
                                                    <input type="number" name="goalsConceded" value={formData.goalsConceded} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-2 text-white text-center font-bold focus:border-[#ff5a00] outline-none transition-colors" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">🛡️ Clean Sheet</label>
                                                    <input type="number" name="cleanSheets" value={formData.cleanSheets} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-2 text-white text-center font-bold focus:border-[#ff5a00] outline-none transition-colors" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center justify-center"><div className="w-2 h-3 bg-yellow-500 mr-1 rounded-sm" />Gialli</label>
                                                <input type="number" name="yellowCards" value={formData.yellowCards} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-2 text-white text-center focus:border-[#ff5a00] outline-none transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center justify-center"><div className="w-2 h-3 bg-red-600 mr-1 rounded-sm" />Rossi</label>
                                                <input type="number" name="redCards" value={formData.redCards} onChange={handleInputChange} className="w-full bg-black border border-white/10 rounded p-2 text-white text-center focus:border-[#ff5a00] outline-none transition-colors" />
                                            </div>
                                        </div>

                                        {formData.image && (
                                            <div className="mt-4 border border-white/10 rounded-lg p-2 bg-black">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 text-center">Anteprima Foto</p>
                                                <img src={formData.image} alt="Preview" className="w-full h-32 object-cover rounded pointer-events-none grayscale opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4 pt-6 mt-6">
                                    <button type="submit" disabled={loading} className="px-6 py-2 bg-[#ff5a00] rounded font-bold uppercase tracking-wider text-sm text-white hover:bg-[#e04e00] transition-colors">
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
