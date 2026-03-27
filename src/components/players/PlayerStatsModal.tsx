"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Zap, Shield, AlertTriangle, TrendingUp, Star, HandMetal } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { normalizeDate } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, PieChart, Pie,
  CartesianGrid, ReferenceLine
} from "recharts";

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

interface PlayerStatsModalProps {
  player: Player;
  onClose: () => void;
}

type MatchStat = {
  label: string;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  played: boolean;
};

// Custom tooltip per i grafici
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
            {p.name}: <span className="text-white">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function PlayerStatsModal({ player, onClose }: PlayerStatsModalProps) {
  const [matchStats, setMatchStats] = useState<MatchStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<"performance" | "discipline" | "radar">("performance");

  useEffect(() => {
    const fetchMatchStats = async () => {
      try {
        const q = query(collection(db, "matches"), where("isPlayed", "==", true));
        const snap = await getDocs(q);
        const matches = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .sort((a, b) => normalizeDate(a.date).getTime() - normalizeDate(b.date).getTime());

        const stats: MatchStat[] = matches.map((match, i) => {
          const events: any[] = match.stats || [];
          const playerEvents = events.filter((e: any) => e.playerId === player.id);

          // Check if player participated (in lineup or bench)
          const inLineup = match.lineup ? Object.values(match.lineup).includes(player.id) : false;
          const inBench = match.bench ? (match.bench as string[]).includes(player.id) : false;
          const played = inLineup || inBench;

          return {
            label: `P${i + 1}`,
            goals: playerEvents.filter((e: any) => e.type === "goal").length,
            assists: playerEvents.filter((e: any) => e.type === "assist").length,
            yellow: playerEvents.filter((e: any) => e.type === "yellow").length,
            red: playerEvents.filter((e: any) => e.type === "red").length,
            played,
          };
        });

        setMatchStats(stats);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchMatchStats();
  }, [player.id]);

  const isGoalkeeper = player.role === "Portiere";

  const totalMatches = matchStats.length;
  const playedMatches = matchStats.filter(m => m.played).length;
  const presencePercent = totalMatches > 0 ? Math.round((playedMatches / totalMatches) * 100) : 0;
  const goals = player.stats?.goals || 0;
  const assists = player.stats?.assists || 0;
  const yellowCards = player.stats?.yellowCards || 0;
  const redCards = player.stats?.redCards || 0;
  // Goalkeeper specific
  const saves = player.stats?.saves || 0;
  const goalsConceded = player.stats?.goalsConceded || 0;
  const cleanSheets = player.stats?.cleanSheets || 0;
  const savePercent = saves + goalsConceded > 0
    ? Math.round((saves / (saves + goalsConceded)) * 100)
    : 0;

  // Donut data
  const presenceData = [
    { name: "Presenze", value: playedMatches, color: "#ff5a00" },
    { name: "Assenze", value: Math.max(0, totalMatches - playedMatches), color: "#1a1a1a" },
  ];

  // Radar data — different axes for GK
  const radarMax = { goals: 10, assists: 10, appearances: 20, discipline: 10, efficiency: 10 };
  const disciplineScore = Math.max(0, 10 - yellowCards * 1 - redCards * 3);
  const efficiencyScore = goals + assists > 0 && playedMatches > 0
    ? Math.min(10, Math.round(((goals + assists) / playedMatches) * 5))
    : 0;

  const radarData = isGoalkeeper
    ? [
        { subject: "Rigori Parati", value: Math.min(10, (saves / Math.max(saves + 1, 20)) * 10), fullMark: 10 },
        { subject: "Clean Sheet", value: Math.min(10, (cleanSheets / Math.max(playedMatches, 1)) * 10), fullMark: 10 },
        { subject: "% Rig. Parati", value: (savePercent / 100) * 10, fullMark: 10 },
        { subject: "Presenze", value: Math.min(10, (playedMatches / 20) * 10), fullMark: 10 },
        { subject: "Disciplina", value: disciplineScore, fullMark: 10 },
      ]
    : [
        { subject: "Gol", value: Math.min(10, (goals / radarMax.goals) * 10), fullMark: 10 },
        { subject: "Assist", value: Math.min(10, (assists / radarMax.assists) * 10), fullMark: 10 },
        { subject: "Presenze", value: Math.min(10, (playedMatches / radarMax.appearances) * 10), fullMark: 10 },
        { subject: "Disciplina", value: disciplineScore, fullMark: 10 },
        { subject: "Efficacia", value: efficiencyScore, fullMark: 10 },
      ];

  // Rating score (0-99)
  const rating = Math.min(99, Math.round(
    (radarData.reduce((s, d) => s + d.value, 0) / radarData.length) * 9.9
  ));

  const CHART_TABS = [
    { key: "performance" as const, label: "Rendimento", icon: TrendingUp },
    { key: "discipline" as const, label: "Disciplina", icon: AlertTriangle },
    { key: "radar" as const, label: "Radar", icon: Star },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-6 bg-black/95 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-[#ff5a00]/10 via-black to-black p-6 border-b border-white/5 shrink-0">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-[#ff5a00]/5 rounded-full blur-3xl" />
            </div>
            <button
              onClick={onClose}
              className="absolute top-2 right-2 md:top-4 md:right-4 text-gray-500 hover:text-white transition-all bg-white/5 rounded-full w-12 h-12 flex items-center justify-center hover:bg-[#ff5a00]/30 hover:border-[#ff5a00]/50 border border-white/10 z-[30] cursor-pointer shadow-lg active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-5 relative z-10 pr-14">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 border-[#ff5a00]/50 bg-[#111]">
                  {player.image ? (
                    <img src={player.image} alt={player.name} className="w-full h-full object-cover" onError={e => (e.currentTarget.src = "https://i.pravatar.cc/150")} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-heading text-4xl text-white/20">{player.number}</span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#ff5a00] text-black text-xs font-black px-2 py-0.5 rounded font-heading">
                  #{player.number}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[#ff5a00] font-bold uppercase tracking-widest text-[10px] mb-1">{player.role}</p>
                <h2 className="font-heading text-2xl md:text-4xl font-black text-white uppercase tracking-wider truncate">{player.name}</h2>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                  {player.personal?.age && <span>Età: <span className="text-gray-300">{player.personal.age}</span></span>}
                  {player.personal?.height && <span>Alt: <span className="text-gray-300">{player.personal.height}</span></span>}
                </div>
              </div>

              {/* Rating */}
              <div className="shrink-0 text-center hidden md:block">
                <div className="relative">
                  <svg viewBox="0 0 80 80" className="w-20 h-20">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#1a1a1a" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke="#ff5a00" strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(rating / 99) * 213.6} 213.6`}
                      transform="rotate(-90 40 40)"
                      style={{ transition: "stroke-dasharray 1s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-heading text-2xl font-black text-white">{rating}</span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest">Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-5 gap-0 shrink-0 border-b border-white/5">
            {(isGoalkeeper
              ? [
                  { icon: HandMetal, label: "Rigori Parati", value: saves, color: "text-cyan-400" },
                  { icon: Shield, label: "Clean Sheet", value: cleanSheets, color: "text-green-400" },
                  { icon: Target, label: "Gol Subiti", value: goalsConceded, color: "text-red-500" },
                  { icon: TrendingUp, label: "% Rig. Parati", value: `${savePercent}%`, color: "text-[#ff5a00]" },
                  { icon: Shield, label: "Presenze", value: `${presencePercent}%`, color: "text-purple-400" },
                ]
              : [
                  { icon: Target, label: "Gol", value: goals, color: "text-[#ff5a00]" },
                  { icon: Zap, label: "Assist", value: assists, color: "text-blue-400" },
                  { icon: Shield, label: "Presenze", value: `${presencePercent}%`, color: "text-green-400" },
                  { icon: AlertTriangle, label: "Gialli", value: yellowCards, color: "text-yellow-400" },
                  { icon: AlertTriangle, label: "Rossi", value: redCards, color: "text-red-500" },
                ]
            ).map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex flex-col items-center justify-center py-4 border-r border-white/5 last:border-r-0 hover:bg-white/[0.02] transition-colors"
              >
                <stat.icon className={`w-4 h-4 mb-1 ${stat.color} opacity-60`} />
                <p className={`font-heading text-xl md:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[8px] md:text-[10px] text-gray-600 uppercase tracking-widest font-bold">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Chart Navigation */}
          <div className="flex border-b border-white/5 shrink-0 bg-black/40">
            {CHART_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveChart(tab.key)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  activeChart === tab.key
                    ? "text-[#ff5a00] border-b-2 border-[#ff5a00] bg-white/5"
                    : "text-gray-600 hover:text-gray-300"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Charts Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#050505]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-2 border-[#ff5a00] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : matchStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-700">
                <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-heading text-lg uppercase tracking-wider">Nessuna partita registrata</p>
                <p className="text-sm mt-2">Le statistiche appariranno dopo le prime partite</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* PERFORMANCE CHART */}
                {activeChart === "performance" && (
                  <motion.div
                    key="performance"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {isGoalkeeper ? (
                      /* --- GOALKEEPER PERFORMANCE --- */
                      <>
                        <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4 md:p-6">
                          <h3 className="font-heading text-sm uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                            <HandMetal className="w-4 h-4 text-cyan-400" />
                            Statistiche Portiere
                          </h3>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { label: "Rigori Parati", value: saves, max: Math.max(saves + 1, 20), color: "#22d3ee" },
                              { label: "Gol Subiti", value: goalsConceded, max: Math.max(goalsConceded + 1, 10), color: "#ef4444" },
                              { label: "Clean Sheet", value: cleanSheets, max: Math.max(playedMatches, 1), color: "#22c55e" },
                            ].map(item => (
                              <div key={item.label} className="text-center">
                                <p className="font-heading text-4xl font-black mb-1" style={{ color: item.color }}>{item.value}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{item.label}</p>
                                <div className="mt-2 h-1.5 bg-[#111] rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.value / item.max) * 100}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className="h-full rounded-full"
                                    style={{ background: item.color }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Save % progress bar */}
                          <div className="mt-6 pt-4 border-t border-white/5">
                            <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wider">
                              <span className="text-gray-500">% Rigori Parati</span>
                              <span className="text-[#ff5a00]">{savePercent}%</span>
                            </div>
                            <div className="h-3 bg-[#111] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${savePercent}%` }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className="h-full rounded-full"
                                style={{ background: "linear-gradient(to right, #ff5a00, #fbbf24)" }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Presence donut for GK */}
                        <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4 md:p-6">
                          <h3 className="font-heading text-sm uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-400" />
                            Presenza in Squadra
                          </h3>
                          <div className="flex items-center gap-6">
                            <div className="relative w-28 h-28 shrink-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={presenceData} cx="50%" cy="50%" innerRadius={38} outerRadius={52} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                                    {presenceData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="font-heading text-2xl font-black text-white">{presencePercent}%</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5a00]" />
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Presenze: <span className="text-white">{playedMatches}</span></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a] border border-white/20" />
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Assenze: <span className="text-white">{Math.max(0, totalMatches - playedMatches)}</span></span>
                              </div>
                              <div className="pt-1 border-t border-white/5">
                                <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">Clean Sheet ratio: <span className="text-gray-400">{playedMatches > 0 ? Math.round((cleanSheets / playedMatches) * 100) : 0}%</span></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* --- OUTFIELD PLAYER PERFORMANCE --- */
                      <>
                        <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4 md:p-6">
                          <h3 className="font-heading text-sm uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-[#ff5a00]" />
                            Gol & Assist per Partita
                          </h3>
                          <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={matchStats} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                              <XAxis dataKey="label" tick={{ fill: "#555", fontSize: 11, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }} iconType="circle" />
                              <ReferenceLine y={0} stroke="#333" />
                              <Line type="monotone" dataKey="goals" name="Gol" stroke="#ff5a00" strokeWidth={2.5} dot={{ fill: "#ff5a00", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#ff5a00", stroke: "#fff", strokeWidth: 2 }} />
                              <Line type="monotone" dataKey="assists" name="Assist" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4 md:p-6">
                            <h3 className="font-heading text-sm uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-green-400" />
                              Presenza in Squadra
                            </h3>
                            <div className="flex items-center gap-6">
                              <div className="relative w-28 h-28 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie data={presenceData} cx="50%" cy="50%" innerRadius={38} outerRadius={52} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                                      {presenceData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="font-heading text-2xl font-black text-white">{presencePercent}%</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5a00]" />
                                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Presenze: <span className="text-white">{playedMatches}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a] border border-white/20" />
                                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Assenze: <span className="text-white">{Math.max(0, totalMatches - playedMatches)}</span></span>
                                </div>
                                <div className="pt-1 border-t border-white/5">
                                  <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">Totale partite: <span className="text-gray-400">{totalMatches}</span></span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4 md:p-6">
                            <h3 className="font-heading text-sm uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                              <Target className="w-4 h-4 text-[#ff5a00]" />
                              Contributi Totali
                            </h3>
                            <div className="space-y-3">
                              {[
                                { label: "Gol", value: goals, max: Math.max(goals + 1, 10), color: "#ff5a00" },
                                { label: "Assist", value: assists, max: Math.max(assists + 1, 10), color: "#3b82f6" },
                                { label: "Goal + Assist", value: goals + assists, max: Math.max(goals + assists + 1, 10), color: "#8b5cf6" },
                              ].map(item => (
                                <div key={item.label}>
                                  <div className="flex justify-between text-xs mb-1 font-bold uppercase tracking-wider">
                                    <span className="text-gray-500">{item.label}</span>
                                    <span style={{ color: item.color }}>{item.value}</span>
                                  </div>
                                  <div className="h-2 bg-[#111] rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(item.value / item.max) * 100}%` }}
                                      transition={{ duration: 0.8, delay: 0.2 }}
                                      className="h-full rounded-full"
                                      style={{ background: item.color }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* DISCIPLINE CHART: Yellow/Red cards per match */}
                {activeChart === "discipline" && (
                  <motion.div
                    key="discipline"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4 md:p-6">
                      <h3 className="font-heading text-sm uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        Cartellini per Partita
                      </h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={matchStats} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barGap={2}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                          <XAxis dataKey="label" tick={{ fill: "#555", fontSize: 11, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            wrapperStyle={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}
                            iconType="square"
                          />
                          <Bar dataKey="yellow" name="Giallo" fill="#eab308" radius={[4, 4, 0, 0]} maxBarSize={28} />
                          <Bar dataKey="red" name="Rosso" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Discipline summary */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Cartellini Gialli", value: yellowCards, color: "#eab308", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                        { label: "Cartellini Rossi", value: redCards, color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/20" },
                        { label: "Punteggio Disciplina", value: `${disciplineScore}/10`, color: disciplineScore >= 7 ? "#22c55e" : disciplineScore >= 4 ? "#eab308" : "#ef4444", bg: "bg-white/5", border: "border-white/10" },
                      ].map(item => (
                        <div key={item.label} className={`${item.bg} border ${item.border} rounded-xl p-4 text-center`}>
                          <p className="font-heading text-3xl font-black mb-1" style={{ color: item.color }}>{item.value}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-tight">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* RADAR CHART: Overall profile */}
                {activeChart === "radar" && (
                  <motion.div
                    key="radar"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4 md:p-6">
                      <h3 className="font-heading text-sm uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4 text-[#ff5a00]" />
                        Profilo Giocatore — Radar
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                          <PolarGrid stroke="#1a1a1a" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: "#666", fontSize: 12, fontWeight: "bold" }}
                          />
                          <Radar
                            name={player.name}
                            dataKey="value"
                            stroke="#ff5a00"
                            fill="#ff5a00"
                            fillOpacity={0.15}
                            strokeWidth={2}
                          />
                          <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Attribute bars */}
                    <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4 md:p-6">
                      <h3 className="font-heading text-sm uppercase tracking-widest text-gray-500 mb-4">Attributi Dettagliati</h3>
                      <div className="space-y-3">
                        {radarData.map((attr, i) => (
                          <div key={attr.subject} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider w-20 shrink-0">{attr.subject}</span>
                            <div className="flex-1 h-2.5 bg-[#111] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(attr.value / attr.fullMark) * 100}%` }}
                                transition={{ duration: 0.7, delay: i * 0.1 }}
                                className="h-full rounded-full"
                                style={{
                                  background: `linear-gradient(to right, #ff5a00, ${attr.value > 7 ? "#fbbf24" : attr.value > 4 ? "#ff5a00" : "#ef4444"})`
                                }}
                              />
                            </div>
                            <span className="text-xs font-black text-white w-10 text-right">
                              {Math.round(attr.value * 9.9)}/99
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
