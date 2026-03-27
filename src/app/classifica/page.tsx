"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { LiveEditor } from "@/components/admin/LiveEditor";
import { Editable } from "@/components/ui/Editable";
import { GlobalLoader } from "@/components/ui/GlobalLoader";

type TeamStanding = {
    pos: number;
    team: string;
    p: number;
    w: number;
    d: number;
    l: number;
    gf: number;
    ga: number;
    gd: number;
    pts: number;
    isAuto?: boolean;
};

export default function Classifica() {
    const [standings, setStandings] = useState<TeamStanding[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndCalculateStandings = async () => {
            try {
                // 1. Load manual teams from "standings" collection
                const standingsSnap = await getDocs(collection(db, "standings"));
                const manualTeams: TeamStanding[] = standingsSnap.docs.map(d => {
                    const data = d.data();
                    return {
                        pos: 0, team: data.team, p: data.p || 0, w: data.w || 0,
                        d: data.d || 0, l: data.l || 0, gf: data.gf || 0,
                        ga: data.ga || 0, gd: 0, pts: data.pts || 0,
                    };
                });

                // 2. Calculate Glass Cannons from matches
                const matchSnap = await getDocs(
                    query(collection(db, "matches"), where("isPlayed", "==", true))
                );
                const matches = matchSnap.docs.map(d => d.data());

                const gc: TeamStanding = {
                    pos: 0, team: "Glass Cannons",
                    p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, isAuto: true
                };

                for (const match of matches) {
                    if (match.matchType && match.matchType !== "campionato") continue;
                    gc.p++;
                    gc.gf += match.we;
                    gc.ga += match.they;
                    if (match.we > match.they) { gc.w++; gc.pts += 3; }
                    else if (match.we < match.they) { gc.l++; }
                    else { gc.d++; gc.pts++; }
                }

                // 3. Combine and sort
                const all = [...manualTeams, gc].map(t => ({ ...t, gd: t.gf - t.ga }));
                all.sort((a, b) => {
                    if (b.pts !== a.pts) return b.pts - a.pts;
                    if (b.gd !== a.gd) return b.gd - a.gd;
                    return b.gf - a.gf;
                });
                all.forEach((t, i) => t.pos = i + 1);

                setStandings(all);
            } catch (error) {
                console.error("Error calculating standings:", error);
            }
            setLoading(false);
        };

        fetchAndCalculateStandings();
    }, []);


    return (
        <LiveEditor pageId="classifica">
        <div className="min-h-screen bg-black py-16 pt-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="font-heading text-5xl md:text-7xl font-bold uppercase text-white tracking-widest mb-4 flex justify-center gap-4">
                        <Editable as="span" blockId="classifica_header" field="title1" initialValue="La" />
                        <Editable as="span" blockId="classifica_header" field="title2" initialValue="Classifica" className="text-[#ff5a00]" />
                    </h1>
                    <div className="w-24 h-1 bg-[#ff5a00] mx-auto mt-8 rounded-full" />
                    <p className="text-gray-600 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">Campionato</p>
                </motion.div>

                {loading ? (
                    <GlobalLoader />
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#0f0f0f] border border-white/10 rounded-lg overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-full sm:min-w-[600px]">
                                <thead>
                                    <tr className="bg-black border-b border-white/10 text-gray-500 font-heading text-sm uppercase tracking-wider">
                                        <th className="p-2 sm:p-4 w-12 text-center">#</th>
                                        <th className="p-2 sm:p-4">Squadra</th>
                                        <th className="p-2 sm:p-4 text-center">Pt</th>
                                        <th className="p-2 sm:p-4 text-center hidden sm:table-cell">G</th>
                                        <th className="p-2 sm:p-4 text-center hidden sm:table-cell">V</th>
                                        <th className="p-2 sm:p-4 text-center hidden sm:table-cell">N</th>
                                        <th className="p-2 sm:p-4 text-center hidden sm:table-cell">P</th>
                                        <th className="p-2 sm:p-4 text-center hidden md:table-cell">GF</th>
                                        <th className="p-2 sm:p-4 text-center hidden md:table-cell">GS</th>
                                        <th className="p-2 sm:p-4 text-center">DR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map((row, i) => (
                                        <motion.tr
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            key={row.team}
                                            className={`border-b border-white/5 hover:bg-white/5 transition-colors ${row.team === "Glass Cannons" ? "bg-[#ff5a00]/10" : ""}`}
                                        >
                                            <td className="p-2 sm:p-4 text-center font-bold text-gray-400">
                                                {row.pos === 1 ? <span className="text-yellow-500">1</span> : row.pos}
                                            </td>
                                            <td className={`p-2 sm:p-4 font-bold text-sm sm:text-base ${row.team === "Glass Cannons" ? "text-white" : "text-gray-300"}`}>
                                                {row.team}
                                            </td>
                                            <td className={`p-2 sm:p-4 text-center font-bold text-base sm:text-lg ${row.team === "Glass Cannons" ? "text-[#ff5a00]" : "text-white"}`}>
                                                {row.pts}
                                            </td>
                                            <td className="p-2 sm:p-4 text-center text-gray-500 hidden sm:table-cell">{row.p}</td>
                                            <td className="p-2 sm:p-4 text-center text-gray-500 hidden sm:table-cell">{row.w}</td>
                                            <td className="p-2 sm:p-4 text-center text-gray-500 hidden sm:table-cell">{row.d}</td>
                                            <td className="p-2 sm:p-4 text-center text-gray-500 hidden sm:table-cell">{row.l}</td>
                                            <td className="p-2 sm:p-4 text-center text-gray-500 hidden md:table-cell">{row.gf}</td>
                                            <td className="p-2 sm:p-4 text-center text-gray-500 hidden md:table-cell">{row.ga}</td>
                                            <td className="p-2 sm:p-4 text-center text-gray-500 text-sm sm:text-base">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
        </LiveEditor>
    );
}
