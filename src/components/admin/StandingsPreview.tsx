"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Trophy, TrendingUp, Minus, TrendingDown } from "lucide-react";

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
};

export default function StandingsPreview() {
    const [standings, setStandings] = useState<TeamStanding[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndCalculateStandings = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "matches"));
                const matches = querySnapshot.docs.map(doc => doc.data());
                const teamsMap = new Map<string, TeamStanding>();

                // Initialize Glass Cannons
                teamsMap.set("Glass Cannons", { pos: 0, team: "Glass Cannons", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });

                for (const match of matches) {
                    if (!match.isPlayed) continue;
                    const opponent = match.opponent;
                    if (!teamsMap.has(opponent)) {
                        teamsMap.set(opponent, { pos: 0, team: opponent, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
                    }

                    const we = match.we;
                    const they = match.they;
                    const gTeam = teamsMap.get("Glass Cannons")!;
                    const oTeam = teamsMap.get(opponent)!;

                    gTeam.p += 1;
                    oTeam.p += 1;
                    gTeam.gf += we;
                    gTeam.ga += they;
                    oTeam.gf += they;
                    oTeam.ga += we;

                    if (we > they) {
                        gTeam.w += 1; gTeam.pts += 3; oTeam.l += 1;
                    } else if (we < they) {
                        oTeam.w += 1; oTeam.pts += 3; gTeam.l += 1;
                    } else {
                        gTeam.d += 1; gTeam.pts += 1; oTeam.d += 1; oTeam.pts += 1;
                    }
                }

                const standingsArray = Array.from(teamsMap.values()).map(t => {
                    t.gd = t.gf - t.ga;
                    return t;
                }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

                standingsArray.forEach((t, i) => t.pos = i + 1);
                setStandings(standingsArray);
            } catch (error) {
                console.error("Error calculating standings:", error);
            }
            setLoading(false);
        };

        fetchAndCalculateStandings();
    }, []);

    if (loading) return <div className="text-[#ff5a00] font-heading animate-pulse py-12">Calcolo Standings...</div>;

    return (
        <div className="flex-1 p-8 bg-[#0a0a0a] overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center space-x-4 mb-10">
                    <Trophy className="w-10 h-10 text-[#ff5a00]" />
                    <h2 className="font-heading text-4xl font-bold uppercase text-white tracking-widest">Anteprima Classifica</h2>
                </header>

                <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-x-auto shadow-2xl">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                            <tr className="bg-black border-b border-white/10 text-gray-500 font-heading text-xs uppercase tracking-widest">
                                <th className="p-6 w-16 text-center">#</th>
                                <th className="p-6">Squadra</th>
                                <th className="p-6 text-center">G</th>
                                <th className="p-6 text-center">V</th>
                                <th className="p-6 text-center">N</th>
                                <th className="p-6 text-center">P</th>
                                <th className="p-6 text-center text-white">PTS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map((team, i) => (
                                <tr
                                    key={team.team}
                                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${team.team === "Glass Cannons" ? "bg-[#ff5a00]/5" : ""}`}
                                >
                                    <td className="p-6 text-center font-heading font-bold text-gray-400">
                                        {team.pos === 1 ? <span className="text-yellow-500">1</span> : team.pos}
                                    </td>
                                    <td className={`p-6 font-bold flex items-center space-x-3 ${team.team === "Glass Cannons" ? "text-white" : "text-gray-300"}`}>
                                        <span>{team.team}</span>
                                        {team.team === "Glass Cannons" && <span className="w-2 h-2 rounded-full bg-[#ff5a00] animate-pulse" />}
                                    </td>
                                    <td className="p-6 text-center text-gray-500">{team.p}</td>
                                    <td className="p-6 text-center text-gray-500">{team.w}</td>
                                    <td className="p-6 text-center text-gray-500">{team.d}</td>
                                    <td className="p-6 text-center text-gray-500">{team.l}</td>
                                    <td className={`p-6 text-center font-heading font-bold text-2xl ${team.team === "Glass Cannons" ? "text-[#ff5a00]" : "text-white"}`}>
                                        {team.pts}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0f0f0f] p-6 rounded-lg border border-white/5 flex flex-col items-center">
                        <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Top Attacco</p>
                        <p className="text-white font-heading text-xl mt-1">
                            {standings.length > 0 ? [...standings].sort((a, b) => b.gf - a.gf)[0].team : "-"}
                        </p>
                    </div>
                    <div className="bg-[#0f0f0f] p-6 rounded-lg border border-white/5 flex flex-col items-center">
                        <Shield className="w-8 h-8 text-blue-500 mb-2" />
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Miglior Difesa</p>
                        <p className="text-white font-heading text-xl mt-1">
                            {standings.length > 0 ? [...standings].sort((a, b) => a.ga - b.ga)[0].team : "-"}
                        </p>
                    </div>
                    <div className="bg-[#0f0f0f] p-6 rounded-lg border border-white/5 flex flex-col items-center">
                        <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Leader Punti</p>
                        <p className="text-white font-heading text-xl mt-1">
                            {standings.length > 0 ? standings[0].team : "-"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Shield } from "lucide-react";
