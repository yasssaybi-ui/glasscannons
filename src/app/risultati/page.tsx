"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { normalizeDate } from "@/lib/utils";
import MatchDetailsModal from "@/components/matches/MatchDetailsModal";
import { LiveEditor } from "@/components/admin/LiveEditor";
import { Editable } from "@/components/ui/Editable";
import { GlobalLoader } from "@/components/ui/GlobalLoader";

type MatchResult = {
    id: string;
    date: Timestamp;
    opponent: string;
    we: number;
    they: number;
    isPlayed: boolean;
    matchType?: string;
    isHome?: boolean;
};

type TabType = "campionato" | "coppa" | "amichevole";

const TABS: { key: TabType; label: string }[] = [
    { key: "campionato", label: "Campionato" },
    { key: "coppa", label: "Coppa" },
    { key: "amichevole", label: "Amichevoli" },
];

export default function Risultati() {
    const [results, setResults] = useState<MatchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("campionato");

    useEffect(() => {
        const fetchResults = async () => {
            try {
                // Fetch all matches (both played and unplayed)
                const q = query(collection(db, "matches"));
                const querySnapshot = await getDocs(q);
                const now = new Date();

                let matchesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as any)
                })) as MatchResult[];

                // Show: played matches + past-date unplayed matches (auto-played)
                matchesData = matchesData
                    .filter(m => m.isPlayed || normalizeDate(m.date).getTime() < now.getTime())
                    .sort((a, b) => normalizeDate(b.date).getTime() - normalizeDate(a.date).getTime());

                setResults(matchesData);
            } catch (error) {
                console.error("Error fetching results:", error);
            }
            setLoading(false);
        };

        fetchResults();
    }, []);

    const filteredResults = results.filter(r => (r.matchType || "campionato") === activeTab);

    return (
        <LiveEditor pageId="risultati">
        <div className="min-h-screen bg-black py-16 pt-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="font-heading text-5xl md:text-7xl font-bold uppercase text-white tracking-widest mb-4 flex justify-center gap-4">
                        <Editable as="span" blockId="risultati_header" field="title1" initialValue="I" />
                        <Editable as="span" blockId="risultati_header" field="title2" initialValue="Risultati" className="text-[#ff5a00]" />
                    </h1>
                    <div className="w-24 h-1 bg-[#ff5a00] mx-auto mt-8 rounded-full" />
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-[#0f0f0f] p-2 rounded-xl border border-white/5">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-widest text-xs transition-all duration-200 ${
                                activeTab === tab.key
                                    ? "bg-[#ff5a00] text-white shadow-[0_4px_15px_rgba(255,90,0,0.3)]"
                                    : "text-gray-500 hover:text-white"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <GlobalLoader />
                    ) : filteredResults.length === 0 ? (
                        <div className="text-center py-16 text-gray-600 bg-[#0f0f0f] border border-white/5 rounded-lg">
                            <p className="font-heading text-lg uppercase tracking-wider">Nessun risultato per questa sezione</p>
                        </div>
                    ) : (
                        filteredResults.map((res, i) => {
                            const isWin = res.we > res.they;
                            const isDraw = res.we === res.they;
                            const isLoss = res.we < res.they;

                            return (
                                <motion.div
                                    key={res.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => setSelectedMatchId(res.id)}
                                    className={`bg-[#0f0f0f] border-l-4 rounded-r-lg p-6 flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-white/5 transition-colors ${
                                        isWin ? "border-green-500" : isLoss ? "border-red-600" : "border-yellow-500"
                                    }`}
                                >
                                    <div className="text-gray-500 text-sm md:w-1/4 text-center md:text-left mb-2 md:mb-0 space-y-1">
                                        <div>{normalizeDate(res.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                        <div className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                            res.isHome !== false
                                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                        }`}>
                                            {res.isHome !== false ? "Casa" : "Trasferta"}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center space-x-4 md:w-1/2">
                                        {/* Home team on the left */}
                                        <div className="font-bold text-white text-right w-[40%]">
                                            {res.isHome !== false ? "Glass Cannons" : res.opponent}
                                        </div>

                                        <div className="bg-black border border-white/10 px-4 py-2 rounded font-heading font-black text-xl text-white tracking-widest min-w-[80px] text-center shrink-0">
                                            {res.isHome !== false
                                                ? `${res.we} - ${res.they}`
                                                : `${res.they} - ${res.we}`}
                                        </div>

                                        {/* Away team on the right */}
                                        <div className="font-bold text-gray-400 text-left w-[40%]">
                                            {res.isHome !== false ? res.opponent : "Glass Cannons"}
                                        </div>
                                    </div>

                                    <div className="md:w-1/4 flex justify-end mt-4 md:mt-0">
                                        <div className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                                            isWin ? "bg-green-500/10 text-green-500" : isLoss ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                                        }`}>
                                            {isWin ? "Vittoria" : isLoss ? "Sconfitta" : "Pareggio"}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
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
