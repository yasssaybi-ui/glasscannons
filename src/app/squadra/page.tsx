"use client";

import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { LiveEditor } from "@/components/admin/LiveEditor";
import { Editable } from "@/components/ui/Editable";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import PlayerStatsModal from "@/components/players/PlayerStatsModal";

type Player = {
    id: string;
    name: string;
    number: number;
    role: string;
    image: string;
    personal: { age: number; height: string };
    stats: { 
        goals: number; 
        assists: number; 
        appearances: number; 
        yellowCards: number; 
        redCards: number;
        saves?: number;
        goalsConceded?: number;
        cleanSheets?: number;
    };
};

export default function Squadra() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                // Fetch players ordered by number
                const q = query(collection(db, "players"), orderBy("number", "asc"));
                const querySnapshot = await getDocs(q);
                const playersData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as any)
                })) as Player[];
                setPlayers(playersData);
            } catch (error) {
                console.error("Error fetching players:", error);
            }
            setLoading(false);
        };

        fetchPlayers();
    }, []);

    const rolesOrder = ["Portieri", "Difensori", "Centrocampisti", "Attaccanti"];

    // Grouping players
    const groupedPlayers = players.reduce((acc, player) => {
        let roleGroup = "Attaccanti";
        if (player.role === "Portiere") roleGroup = "Portieri";
        else if (player.role === "Difensore") roleGroup = "Difensori";
        else if (player.role === "Centrocampista") roleGroup = "Centrocampisti";

        if (!acc[roleGroup]) acc[roleGroup] = [];
        acc[roleGroup].push(player);
        return acc;
    }, {} as Record<string, Player[]>);

    return (
        <>
        <LiveEditor pageId="squadra">
            <div className="min-h-screen bg-black py-16 pt-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="font-heading text-5xl md:text-7xl font-bold uppercase text-white tracking-widest mb-4 flex justify-center gap-4">
                        <Editable as="span" blockId="squadra_header" field="title1" initialValue="La" />
                        <Editable as="span" blockId="squadra_header" field="title2" initialValue="Rosa" className="text-[#ff5a00]" />
                    </h1>
                    <Editable as="p" blockId="squadra_header" field="description" initialValue="I giocatori che scendono in campo per portare la gloria ai Glass Cannons. Statistiche aggiornate all'ultima partita." className="text-gray-400 max-w-2xl mx-auto text-lg" />
                    <div className="w-24 h-1 bg-[#ff5a00] mx-auto mt-8 rounded-full" />
                </div>

                {loading ? (
                    <GlobalLoader />
                ) : players.length === 0 ? (
                    <div className="text-center text-gray-500 py-12 border border-white/10 rounded-lg bg-[#0f0f0f]">
                        <p className="font-heading text-xl uppercase tracking-wider mb-2">Rosa non disponibile</p>
                        <p>Il mister non ha ancora convocato nessun giocatore.</p>
                    </div>
                ) : (
                    rolesOrder.map((roleGroupName) => {
                        const rolePlayers = groupedPlayers[roleGroupName];
                        if (!rolePlayers || rolePlayers.length === 0) return null;

                        return (
                            <div key={roleGroupName} className="mb-20">
                                <h2 className="font-heading text-3xl font-bold uppercase text-white tracking-widest border-b border-white/10 pb-4 mb-8 flex items-center">
                                    <div className="w-2 h-8 bg-[#ff5a00] mr-4" />
                                    {roleGroupName}
                                </h2>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                                    {rolePlayers.map((player) => (
                                        <div
                                            key={player.id}
                                            onClick={() => setSelectedPlayer(player)}
                                            className="bg-[#0f0f0f] rounded-lg overflow-hidden border border-white/10 hover:border-[#ff5a00]/50 transition-all group flex flex-col cursor-pointer hover:shadow-lg hover:shadow-[#ff5a00]/5 active:scale-[0.98]"
                                        >
                                            {/* Player Image & Header */}
                                            <div className="relative aspect-square overflow-hidden bg-black flex items-center justify-center shrink-0">
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent z-10" />
                                                {player.image ? (
                                                    <ImageWithFallback
                                                        src={player.image}
                                                        alt={player.name}
                                                        containerClassName="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-110"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1a1a]">
                                                        <span className="font-heading text-6xl text-white/5">{player.number}</span>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-4 left-4 z-20">
                                                    <span className="font-heading text-6xl font-black text-white/50 group-hover:text-[#ff5a00]/80 transition-colors drop-shadow-md">
                                                        {player.number}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Player Info */}
                                            <div className="p-4 md:p-6 flex-1 flex flex-col">
                                                <h3 className="font-heading text-lg md:text-2xl font-bold text-white uppercase tracking-wider mb-1 group-hover:text-[#ff5a00] transition-colors truncate">{player.name}</h3>
                                                <p className="text-[#ff5a00] font-bold text-xs md:text-sm uppercase tracking-widest mb-4">{player.role}</p>

                                                <div className="flex text-[10px] md:text-xs text-gray-500 mb-4 md:mb-6 uppercase tracking-wider font-bold space-x-2 md:space-x-4">
                                                    <span>Età: {player.personal?.age || '-'}</span>
                                                    <span>Alt: {player.personal?.height || '-'}</span>
                                                </div>

                                                {/* Main Stats Grid */}
                                                <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-4 mt-auto">
                                                    <div className="bg-black/50 p-1 sm:p-2 md:p-3 rounded-md border border-white/5 text-center flex flex-col justify-center">
                                                        <p className="text-[#ff5a00] font-heading font-bold text-base sm:text-lg md:text-xl">{player.stats?.goals || 0}</p>
                                                        <p className="text-[7px] sm:text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider font-bold truncate">Gol</p>
                                                    </div>
                                                    <div className="bg-black/50 p-1 sm:p-2 md:p-3 rounded-md border border-white/5 text-center flex flex-col justify-center">
                                                        <p className="text-white font-heading font-bold text-base sm:text-lg md:text-xl">{player.stats?.assists || 0}</p>
                                                        <p className="text-[7px] sm:text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider font-bold truncate">Assist</p>
                                                    </div>
                                                    <div className="bg-black/50 p-1 sm:p-2 md:p-3 rounded-md border border-white/5 text-center flex flex-col justify-center">
                                                        <p className="text-white font-heading font-bold text-base sm:text-lg md:text-xl">{player.stats?.appearances || 0}</p>
                                                        <p className="text-[7px] sm:text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider font-bold truncate">Pres</p>
                                                    </div>
                                                </div>

                                                {/* Secondary Stats */}
                                                <div className="flex justify-end items-center text-xs md:text-sm border-t border-white/10 pt-3 md:pt-4 mt-2">
                                                    <div className="flex items-center space-x-2 md:space-x-3">
                                                        <div className="flex items-center text-gray-400" title="Cartellini Gialli">
                                                            <div className="w-2 h-3 md:w-3 md:h-4 bg-yellow-500 rounded-sm mr-1" />
                                                            <span>{player.stats?.yellowCards || 0}</span>
                                                        </div>
                                                        <div className="flex items-center text-gray-400" title="Cartellini Rossi">
                                                            <div className="w-2 h-3 md:w-3 md:h-4 bg-red-600 rounded-sm mr-1" />
                                                            <span>{player.stats?.redCards || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>

        </LiveEditor>
        {/* Player Stats Modal */}
        {selectedPlayer && (
            <PlayerStatsModal
                player={selectedPlayer}
                onClose={() => setSelectedPlayer(null)}
            />
        )}
        </>
    );
}
