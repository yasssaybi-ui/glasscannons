"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { normalizeDate } from "@/lib/utils";
import MatchDetailsModal from "@/components/matches/MatchDetailsModal";
import { LiveEditor } from "@/components/admin/LiveEditor";
import { Editable } from "@/components/ui/Editable";
import { GlobalLoader } from "@/components/ui/GlobalLoader";

type Match = {
    id: string;
    date: Timestamp;
    opponent: string;
    isPlayed: boolean;
    venue: string;
    isHome?: boolean;
    time?: string;
};

export default function Calendario() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const q = query(collection(db, "matches"), where("isPlayed", "==", false));
                const querySnapshot = await getDocs(q);
                let matchesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as any)
                })) as Match[];

                const now = new Date();
                // Only show truly upcoming matches (future date)
                matchesData = matchesData
                    .filter(m => normalizeDate(m.date).getTime() > now.getTime())
                    .sort((a, b) => normalizeDate(a.date).getTime() - normalizeDate(b.date).getTime());

                setMatches(matchesData);
            } catch (error) {
                console.error("Error fetching calendar:", error);
            }
            setLoading(false);
        };

        fetchMatches();
    }, []);

    return (
        <LiveEditor pageId="calendario">
        <div className="min-h-screen bg-black py-16 pt-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="font-heading text-5xl md:text-7xl font-bold uppercase text-white tracking-widest mb-4 flex justify-center gap-4">
                        <Editable as="span" blockId="calendario_header" field="title1" initialValue="Il" />
                        <Editable as="span" blockId="calendario_header" field="title2" initialValue="Calendario" className="text-[#ff5a00]" />
                    </h1>
                    <Editable as="p" blockId="calendario_header" field="description" initialValue="Prossimi impegni dei Glass Cannons. Preparati a sostenerci." className="text-gray-400 text-lg" />
                    <div className="w-24 h-1 bg-[#ff5a00] mx-auto mt-8 rounded-full" />
                </motion.div>

                <div className="space-y-6">
                    {loading ? (
                        <GlobalLoader />
                    ) : matches.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-[#0f0f0f] border border-white/10 rounded-lg">
                            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-heading text-xl uppercase tracking-wider">Nessuna partita in programma</p>
                        </div>
                    ) : (
                        matches.map((match, i) => (
                            <motion.div
                                key={match.id}
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => setSelectedMatchId(match.id)}
                                className="bg-[#0f0f0f] border border-white/10 rounded-lg p-6 hover:border-[#ff5a00]/50 transition-colors flex flex-col md:flex-row items-center justify-between group relative overflow-hidden cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#ff5a00]/0 via-[#ff5a00]/5 to-[#ff5a00]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="flex-1 mb-4 md:mb-0 text-center md:text-left relative z-10">
                                    <div className="flex items-center justify-center md:justify-start space-x-2 text-[#ff5a00] mb-2 font-bold uppercase tracking-wider text-sm">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span>
                                            {normalizeDate(match.date).toLocaleDateString("it-IT", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric"
                                            })}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ml-2 ${
                                            match.isHome !== false
                                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                        }`}>
                                            {match.isHome !== false ? "Casa" : "Trasferta"}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-heading font-bold text-white uppercase tracking-wide">
                                        {match.isHome !== false ? "Glass Cannons" : match.opponent}
                                        <span className="mx-3 text-gray-600">VS</span>
                                        {match.isHome !== false ? match.opponent : "Glass Cannons"}
                                    </h3>
                                </div>

                                <div className="flex flex-col items-center md:items-end space-y-2 text-gray-400 text-sm relative z-10">
                                    <div className="flex items-center space-x-2">
                                        <Clock className="w-4 h-4 text-[#ff5a00]" />
                                        <span>{match.time || "Orario da definire"}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="w-4 h-4 text-[#ff5a00]" />
                                        <span>{match.venue || "Da definire"}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {selectedMatchId && (
                <MatchDetailsModal
                    matchId={selectedMatchId}
                    onClose={() => setSelectedMatchId(null)}
                />
            )}
        </div>
        </LiveEditor>
    );
}
