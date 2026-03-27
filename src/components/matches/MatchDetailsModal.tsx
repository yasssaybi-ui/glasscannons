"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Activity, Star, Clock } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, addDoc, query, orderBy, serverTimestamp, where } from "firebase/firestore";
import { normalizeDate } from "@/lib/utils";
import { GlobalLoader } from "@/components/ui/GlobalLoader";

interface MatchDetailsModalProps {
    matchId: string;
    onClose: () => void;
}

export default function MatchDetailsModal({ matchId, onClose }: MatchDetailsModalProps) {
    const [match, setMatch] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'formazione' | 'statistiche' | 'mvp'>('formazione');
    const [votedPlayerId, setVotedPlayerId] = useState<string | null>(null);
    const [mvpVotes, setMvpVotes] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
        // Check local storage for vote
        const vote = localStorage.getItem(`mvp_vote_${matchId}`);
        if (vote) setVotedPlayerId(vote);
    }, [matchId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch match
            const matchDoc = await getDoc(doc(db, "matches", matchId));
            if (matchDoc.exists()) {
                setMatch({ id: matchDoc.id, ...matchDoc.data() });
            }

            // Fetch players for names/images
            const playersSnap = await getDocs(collection(db, "players"));
            const playersData = playersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPlayers(playersData);

            // Fetch MVP votes
            fetchVotes(matchId);

        } catch (error) {
            console.error("Error fetching match details:", error);
        }
        setLoading(false);
    };

    const fetchVotes = async (mId: string) => {
        try {
            // Let's assume votes are stored in a top level collection 'mvp_votes' with matchId
            const q = query(collection(db, "mvp_votes"), where("matchId", "==", mId));
            const votesSnap = await getDocs(q);
            const votesData = votesSnap.docs.map(d => d.data());
            setMvpVotes(votesData);
        } catch (e) {
            console.error(e);
        }
    }

    const handleVote = async (playerId: string) => {
        if (votedPlayerId) return; // already voted
        try {
            await addDoc(collection(db, "mvp_votes"), {
                matchId,
                playerId,
                timestamp: serverTimestamp()
            });
            localStorage.setItem(`mvp_vote_${matchId}`, playerId);
            setVotedPlayerId(playerId);
            fetchVotes(matchId);
        } catch (error) {
            console.error("Error voting:", error);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
                <GlobalLoader />
            </div>
        );
    }

    if (!match) return null;

    // Computed data
    const getPlayer = (id: string) => players.find(p => p.id === id);

    // Vote tally
    const voteCounts: Record<string, number> = {};
    const firstVoteTime: Record<string, number> = {};
    mvpVotes.forEach(v => {
        voteCounts[v.playerId] = (voteCounts[v.playerId] || 0) + 1;
        const vTime = normalizeDate(v.timestamp).getTime();
        if (!firstVoteTime[v.playerId] || vTime < firstVoteTime[v.playerId]) {
            firstVoteTime[v.playerId] = vTime;
        }
    });

    const sortedMvps = Object.keys(voteCounts).map(pid => ({
        playerId: pid,
        votes: voteCounts[pid],
        firstVote: firstVoteTime[pid]
    })).sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes;
        // tie breaker based on time (earliest wins)
        return (a.firstVote || 0) - (b.firstVote || 0);
    });

    // Players who actually participated (Starters + Bench)
    const playedPlayerIds = new Set<string>();
    if (match?.lineup) {
        Object.values(match.lineup).forEach((pid: any) => {
            if (pid) playedPlayerIds.add(pid);
        });
    }
    if (match?.bench) {
        match.bench.forEach((pid: any) => {
            if (pid) playedPlayerIds.add(pid);
        });
    }
    const playedPlayers = players.filter(p => playedPlayerIds.has(p.id));

    const renderPitch = () => {
        const formation = match.formation || "2-3-1";
        const lineup = match.lineup || {};

        // Hardcode classnames based on posKey for 7a-side formations
        // We'll use absolute positioning percentages
        const formationsMap: Record<string, any> = {
            '2-2-2': [
                { id: 'pos1', top: '85%', left: '50%' }, // GK
                { id: 'pos2', top: '65%', left: '30%' }, // Def L
                { id: 'pos3', top: '65%', left: '70%' }, // Def R
                { id: 'pos4', top: '45%', left: '30%' }, // Mid L
                { id: 'pos5', top: '45%', left: '70%' }, // Mid R
                { id: 'pos6', top: '25%', left: '35%' }, // Att L
                { id: 'pos7', top: '25%', left: '65%' }, // Att R
            ],
            '2-3-1': [
                { id: 'pos1', top: '85%', left: '50%' }, // GK
                { id: 'pos2', top: '65%', left: '30%' }, // Def L
                { id: 'pos3', top: '65%', left: '70%' }, // Def R
                { id: 'pos4', top: '45%', left: '20%' }, // Mid L
                { id: 'pos5', top: '45%', left: '50%' }, // Mid C
                { id: 'pos6', top: '45%', left: '80%' }, // Mid R
                { id: 'pos7', top: '25%', left: '50%' }, // Att
            ],
            '3-1-2': [
                { id: 'pos1', top: '85%', left: '50%' }, // GK
                { id: 'pos2', top: '70%', left: '20%' }, // Def L
                { id: 'pos3', top: '65%', left: '50%' }, // Def C
                { id: 'pos4', top: '70%', left: '80%' }, // Def R
                { id: 'pos5', top: '45%', left: '50%' }, // Mid C
                { id: 'pos6', top: '25%', left: '35%' }, // Att L
                { id: 'pos7', top: '25%', left: '65%' }, // Att R
            ],
            '3-2-1': [
                { id: 'pos1', top: '85%', left: '50%' }, // GK
                { id: 'pos2', top: '70%', left: '20%' }, // Def L
                { id: 'pos3', top: '65%', left: '50%' }, // Def C
                { id: 'pos4', top: '70%', left: '80%' }, // Def R
                { id: 'pos5', top: '45%', left: '35%' }, // Mid L
                { id: 'pos6', top: '45%', left: '65%' }, // Mid R
                { id: 'pos7', top: '20%', left: '50%' }, // Att
            ]
        };

        const positions = formationsMap[formation] || formationsMap['2-3-1'];

        return (
            <div className="relative w-full max-w-md mx-auto aspect-[2/3] bg-green-800 rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl">
                {/* Pitch Lines */}
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-white/30" />
                <div className="absolute bottom-0 inset-x-1/4 h-1/6 border-x-2 border-t-2 border-white/30" />
                <div className="absolute bottom-0 inset-x-[35%] h-[8%] border-x-2 border-t-2 border-white/30" />
                <div className="absolute top-0 inset-x-1/4 h-1/6 border-x-2 border-b-2 border-white/30" />

                {/* Players */}
                {positions.map((pos: any) => {
                    const playerId = lineup[pos.id];
                    const player = playerId ? getPlayer(playerId) : null;
                    return (
                        <div
                            key={pos.id}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-transform hover:scale-110 z-10"
                            style={{ top: pos.top, left: pos.left }}
                        >
                            {player ? (
                                <>
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#ff5a00] overflow-hidden bg-black shadow-lg shadow-black/50">
                                        <img src={player.image || '/placeholder-player.png'} alt={player.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://i.pravatar.cc/150')} />
                                    </div>
                                    <div className="mt-1 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] md:text-xs font-bold text-white whitespace-nowrap border border-white/10">
                                        {player.name.split(' ').pop()}
                                    </div>
                                </>
                            ) : (
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/20 border-dashed bg-black/40 flex items-center justify-center">
                                    <span className="text-white/30 text-xs">?</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-black via-[#1a1a1a] to-black p-6 border-b border-white/10 shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[url('/noise.png')] mix-blend-overlay pointer-events-none"></div>
                        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20 bg-black/50 rounded-full p-3 border border-white/10 hover:bg-[#ff5a00]/20 hover:border-[#ff5a00]/50 cursor-pointer">
                            <X className="w-6 h-6 pointer-events-none" />
                        </button>

                        <div className="flex flex-col items-center justify-center relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <p className="text-[#ff5a00] font-bold uppercase tracking-widest text-xs">
                                    {normalizeDate(match.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                    match.isHome !== false
                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                }`}>
                                    {match.isHome !== false ? "Casa" : "Trasferta"}
                                </span>
                            </div>
                            <div className="flex items-center justify-center space-x-2 sm:space-x-6 w-full">
                                {/* Left team = home team */}
                                <div className="text-right flex-1 min-w-0">
                                    <h2 className="font-heading text-sm sm:text-xl md:text-3xl lg:text-4xl text-white uppercase leading-tight break-words">
                                        {match.isHome !== false ? "Glass Cannons" : match.opponent}
                                    </h2>
                                    <p className="text-[8px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Casa</p>
                                </div>
                                <div className="bg-black/80 px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-xl border border-white/10 shadow-lg shadow-[#ff5a00]/10 shrink-0 mx-2">
                                    <span className="font-heading text-2xl sm:text-3xl md:text-5xl font-bold bg-gradient-to-br from-white to-gray-400 text-transparent bg-clip-text whitespace-nowrap">
                                        {match.isPlayed
                                            ? match.isHome !== false
                                                ? `${match.we} - ${match.they}`
                                                : `${match.they} - ${match.we}`
                                            : 'VS'}
                                    </span>
                                </div>
                                {/* Right team = away team */}
                                <div className="text-left flex-1 min-w-0">
                                    <h2 className="font-heading text-sm sm:text-xl md:text-3xl lg:text-4xl text-white uppercase leading-tight break-words">
                                        {match.isHome !== false ? match.opponent : "Glass Cannons"}
                                    </h2>
                                    <p className="text-[8px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Trasferta</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/10 shrink-0 bg-black/40">
                        <button
                            onClick={() => setActiveTab('formazione')}
                            className={`flex-1 py-3 md:py-4 font-bold uppercase tracking-wider md:tracking-widest text-[10px] md:text-xs flex flex-col md:flex-row items-center justify-center transition-all ${activeTab === 'formazione' ? 'text-[#ff5a00] bg-white/5 border-b-2 border-[#ff5a00]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        >
                            <Shield className="w-4 h-4 mb-1 md:mb-0 md:mr-2" /> <span>Formazione</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('statistiche')}
                            className={`flex-1 py-3 md:py-4 font-bold uppercase tracking-wider md:tracking-widest text-[10px] md:text-xs flex flex-col md:flex-row items-center justify-center transition-all ${activeTab === 'statistiche' ? 'text-[#ff5a00] bg-white/5 border-b-2 border-[#ff5a00]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        >
                            <Activity className="w-4 h-4 mb-1 md:mb-0 md:mr-2" /> <span>Statistiche</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('mvp')}
                            className={`flex-1 py-3 md:py-4 font-bold uppercase tracking-wider md:tracking-widest text-[10px] md:text-xs flex flex-col md:flex-row items-center justify-center transition-all ${activeTab === 'mvp' ? 'text-[#ff5a00] bg-white/5 border-b-2 border-[#ff5a00]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        >
                            <Star className="w-4 h-4 mb-1 md:mb-0 md:mr-2" /> <span>MVP</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0a0a0a]">

                        {activeTab === 'formazione' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {renderPitch()}
                            </div>
                        )}

                        {activeTab === 'statistiche' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto space-y-4">
                                {!match.isPlayed ? (
                                    <p className="text-center text-gray-500 italic py-10">Le statistiche saranno disponibili a fine partita.</p>
                                ) : (!match.stats || match.stats.length === 0) ? (
                                    <p className="text-center text-gray-500 italic py-10">Nessuna statistica registrata per questa partita.</p>
                                ) : (
                                    <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                                        {['goal', 'assist', 'yellow', 'red'].map((statType) => {
                                            const events = match.stats.filter((s: any) => s.type === statType);
                                            if (events.length === 0) return null;

                                            let icon = null;
                                            let label = "";
                                            let color = "";
                                            if (statType === 'goal') { label = 'Gol'; color = 'text-green-500'; }
                                            if (statType === 'assist') { label = 'Assist'; color = 'text-blue-500'; }
                                            if (statType === 'yellow') { label = 'Ammonizioni'; color = 'text-yellow-500'; icon = <div className="w-3 h-4 bg-yellow-500 rounded-sm" />; }
                                            if (statType === 'red') { label = 'Espulsioni'; color = 'text-red-500'; icon = <div className="w-3 h-4 bg-red-500 rounded-sm" />; }

                                            return (
                                                <div key={statType} className="border-b border-white/5 last:border-b-0 p-4">
                                                    <h4 className={`font-heading text-sm uppercase tracking-widest mb-3 flex items-center ${color}`}>
                                                        {icon && <span className="mr-2">{icon}</span>}
                                                        {!icon && <Activity className="w-4 h-4 mr-2" />}
                                                        {label}
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {events.map((ev: any, idx: number) => {
                                                            const p = getPlayer(ev.playerId);
                                                            return (
                                                                <li key={idx} className="flex items-center space-x-3 text-white">
                                                                    {p && p.image ? (
                                                                        <img src={p.image} alt={p.name} className="w-6 h-6 rounded-full object-cover grayscale" />
                                                                    ) : (
                                                                        <div className="w-6 h-6 rounded-full bg-white/10" />
                                                                    )}
                                                                    <span className="font-bold">{p ? p.name : ev.playerName}</span>
                                                                </li>
                                                            )
                                                        })}
                                                    </ul>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'mvp' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                                {!match.isPlayed ? (
                                    <p className="text-center text-gray-500 italic py-10">La votazione MVP aprirà a fine partita.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                        {/* Voting Section */}
                                        <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                            <h3 className="font-heading text-xl text-[#ff5a00] uppercase mb-4 flex items-center">
                                                <Star className="w-5 h-5 mr-2" /> Vota il tuo MVP
                                            </h3>

                                            {votedPlayerId ? (
                                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
                                                    <div className="text-green-500 mb-2">
                                                        <Star className="w-10 h-10 mx-auto fill-current" />
                                                    </div>
                                                    <p className="text-white font-bold mb-1">Voto Registrato!</p>
                                                    <p className="text-gray-400 text-sm">Hai votato per: <span className="text-[#ff5a00] uppercase tracking-wider">{getPlayer(votedPlayerId)?.name}</span></p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                                    {playedPlayers.length === 0 ? (
                                                        <p className="text-gray-500 italic text-center py-8 uppercase tracking-widest text-xs">Nessun giocatore disponibile per il voto.</p>
                                                    ) : playedPlayers.map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => handleVote(p.id)}
                                                            className="w-full flex items-center justify-between p-3 rounded-lg bg-black/50 border border-white/5 hover:border-[#ff5a00]/50 hover:bg-white/5 transition-all group"
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <img src={p.image || 'https://i.pravatar.cc/150'} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-white/10 grayscale group-hover:grayscale-0 transition-all" onError={(e) => (e.currentTarget.src = 'https://i.pravatar.cc/150')} />
                                                                <span className="text-white font-bold group-hover:text-[#ff5a00] transition-colors">{p.name}</span>
                                                            </div>
                                                            <div className="text-gray-600 group-hover:text-[#ff5a00] opacity-0 group-hover:opacity-100 transition-all text-xs font-bold uppercase tracking-widest">
                                                                VOTA
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Results Section */}
                                        <div className="bg-[#111] p-6 rounded-xl border border-white/10 flex flex-col">
                                            <h3 className="font-heading text-xl text-white uppercase mb-6 flex items-center justify-between">
                                                <span>Classifica MVP</span>
                                                <span className="text-gray-500 text-xs flex items-center"><Clock className="w-3 h-3 mr-1" /> Live</span>
                                            </h3>

                                            {sortedMvps.length === 0 ? (
                                                <div className="flex-1 flex items-center justify-center">
                                                    <p className="text-gray-500 italic">Ancora nessun voto registrato.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {sortedMvps.map((mvp, idx) => {
                                                        const p = getPlayer(mvp.playerId);
                                                        if (!p) return null;
                                                        const isFirst = idx === 0;

                                                        return (
                                                            <div key={mvp.playerId} className={`relative flex items-center justify-between p-4 rounded-lg overflow-hidden ${isFirst ? 'bg-gradient-to-r from-[#ff5a00]/20 to-black border border-[#ff5a00]/50 shadow-lg shadow-[#ff5a00]/10' : 'bg-black/50 border border-white/5'}`}>
                                                                {isFirst && (
                                                                    <div className="absolute top-0 right-0 p-1 pointer-events-none">
                                                                        <Star className="w-16 h-16 text-[#ff5a00] opacity-10 fill-current" />
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center space-x-4 z-10">
                                                                    <div className={`font-heading text-2xl font-bold ${isFirst ? 'text-[#ff5a00]' : 'text-gray-600'}`}>
                                                                        {idx + 1}
                                                                    </div>
                                                                    <img src={p.image || 'https://i.pravatar.cc/150'} alt={p.name} className={`w-12 h-12 rounded-full object-cover border-2 ${isFirst ? 'border-[#ff5a00]' : 'border-white/10 grayscale'}`} />
                                                                    <div>
                                                                        <div className={`font-bold ${isFirst ? 'text-white' : 'text-gray-300'}`}>{p.name}</div>
                                                                        {isFirst && <div className="text-[10px] text-[#ff5a00] uppercase tracking-widest font-bold">Attuale MVP</div>}
                                                                    </div>
                                                                </div>
                                                                <div className="z-10 text-center">
                                                                    <div className={`font-heading text-2xl font-bold ${isFirst ? 'text-white' : 'text-gray-500'}`}>{mvp.votes}</div>
                                                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Voti</div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
