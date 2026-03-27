"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, X, ArrowRight, Trophy, Users, Calendar } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp, writeBatch, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import HeroTunnel from "@/components/home/HeroTunnel";
import { GlowingEffect } from "@/components/ui/GlowingEffect";
import { LiveEditor } from "@/components/admin/LiveEditor";
import { useLiveEditor, BlockData } from "@/components/admin/LiveEditorContext";
import { Editable } from "@/components/ui/Editable";
import { SectionInserter } from "@/components/admin/SectionInserter";
import { normalizeDate } from "@/lib/utils";
import MatchDetailsModal from "@/components/matches/MatchDetailsModal";
import NewsCarousel from "@/components/news/NewsCarousel";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

type Match = {
  id: string;
  date: Timestamp;
  opponent: string;
  we: number;
  they: number;
  isPlayed: boolean;
  venue: string;
  isHome?: boolean;
};

type Player = {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
  number?: string;
};

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculate = () => {
      const difference = new Date(targetDate).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60),
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return <div className="text-gray-500 font-bold uppercase tracking-wider">Evento Scaduto</div>;

  const items = [
    { label: 'Giorni', value: timeLeft.d },
    { label: 'Ore', value: timeLeft.h },
    { label: 'Minuti', value: timeLeft.m },
    { label: 'Secondi', value: timeLeft.s },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-4xl px-4">
      {items.map((item, i) => (
        <div key={i} className="bg-black/40 border border-[#ff5a00]/20 backdrop-blur-md rounded-lg p-6 flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(255,90,0,0.1)]">
          <span className="text-4xl md:text-6xl font-heading font-black text-[#ff5a00] mb-2">{item.value.toString().padStart(2, '0')}</span>
          <span className="text-[#ff5a00]/60 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs text-center">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Extracted inner content to use the LiveEditor Context
function HomeBlocksContent() {
  const { blocks, isEditMode, updateBlock, sidebarView, selectedBlockId, setSelectedBlockId, setSidebarView } = useLiveEditor();
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [lastMatches, setLastMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch matches if there is a 'matches' block or we want them globally
    const fetchMatches = async () => {
      try {
        const mq = query(collection(db, "matches"), orderBy("date", "desc"));
        const mSnapshot = await getDocs(mq);
        const matchesData = mSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Match[];

        const now = new Date();
        const played = matchesData.filter(m => m.isPlayed);
        // Only show future unplayed matches as "upcoming"
        const unplayed = matchesData
          .filter(m => !m.isPlayed && normalizeDate(m.date).getTime() > now.getTime())
          .sort((a, b) => normalizeDate(a.date).getTime() - normalizeDate(b.date).getTime());

        if (unplayed.length > 0) setNextMatch(unplayed[0]);
        if (played.length > 0) setLastMatches(played.slice(0, 3));

        // Auto-update Firestore: mark past unplayed matches as played
        const toAutoMark = matchesData.filter(m => {
          if (m.isPlayed) return false;
          const matchDate = normalizeDate(m.date);
          if ((m as any).time) {
            const [h, min] = ((m as any).time as string).split(':').map(Number);
            matchDate.setHours(h, min, 0, 0);
          } else {
            matchDate.setHours(23, 59, 0, 0); // If no time, assume end of day
          }
          return matchDate.getTime() < now.getTime();
        });

        if (toAutoMark.length > 0) {
          const batch = writeBatch(db);
          toAutoMark.forEach(m => {
            batch.update(doc(db, "matches", m.id), { isPlayed: true });
          });
          await batch.commit();
          // Refresh played list after auto-marking
          const updatedPlayed = [...played, ...toAutoMark];
          if (updatedPlayed.length > 0) setLastMatches(updatedPlayed.slice(0, 3));
        }

        // Calculate standings
        const teamsMap = new Map<string, any>();
        teamsMap.set("Glass Cannons", { pos: 0, team: "Glass Cannons", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
        
        for (const match of matchesData) {
          if (!match.isPlayed) continue;
          const opponent = match.opponent;
          if (!teamsMap.has(opponent)) {
            teamsMap.set(opponent, { pos: 0, team: opponent, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
          }

          const we = match.we || 0;
          const they = match.they || 0;
          const gTeam = teamsMap.get("Glass Cannons")!;
          const oTeam = teamsMap.get(opponent)!;

          gTeam.p += 1; oTeam.p += 1;
          gTeam.gf += we; gTeam.ga += they;
          oTeam.gf += they; oTeam.ga += we;

          if (we > they) { gTeam.w += 1; gTeam.pts += 3; oTeam.l += 1; }
          else if (we < they) { oTeam.w += 1; oTeam.pts += 3; gTeam.l += 1; }
          else { gTeam.d += 1; gTeam.pts += 1; oTeam.d += 1; oTeam.pts += 1; }
        }

        const standingsArray = Array.from(teamsMap.values()).map(t => {
          t.gd = t.gf - t.ga;
          return t;
        }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
        standingsArray.forEach((t, i) => t.pos = i + 1);
        setStandings(standingsArray);

        // Fetch players for the squad preview
        const pq = query(collection(db, "players"), orderBy("number", "asc"));
        const pSnapshot = await getDocs(pq);
        const playersData = pSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[];
        setPlayers(playersData);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoadingMatches(false);
    };

    fetchMatches();
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  // Helper function to render a single block
  const getBlockConfigClasses = (config?: Record<string, any>) => {
    if (!config) return "bg-black text-white py-24";
    const { bgColor = "bg-black", textColor = "text-white", padding = "large" } = config;

    let paddingClass = "py-24";
    if (padding === "none") paddingClass = "py-0";
    if (padding === "small") paddingClass = "py-8";
    if (padding === "medium") paddingClass = "py-16";

    return `${bgColor} ${textColor} ${paddingClass}`;
  };

  const getFontSizeClass = (size?: string) => {
    if (size === 'small') return 'text-sm md:text-base';
    if (size === 'medium' || !size) return 'text-lg md:text-xl';
    if (size === 'large') return 'text-xl md:text-2xl';
    if (size === 'xl') return 'text-2xl md:text-4xl';
    return 'text-lg md:text-xl';
  };

  const renderBlock = (block: BlockData, index: number) => {
    const configClasses = getBlockConfigClasses(block.config);

    switch (block.type) {
      case 'hero':
        return <HeroTunnel key={block.id} block={block} />;

      case 'matches':
        const displayNextMatch = nextMatch;
        const displayMatchesRow = displayNextMatch ? lastMatches.slice(0, 2) : lastMatches.slice(1, 3);
        const featuredMatch = displayNextMatch || lastMatches[0];

        return (
          <section key={block.id} className="py-24 bg-[#050505] relative z-20 border-t border-white/5 overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
              <div className="absolute top-[-10%] left-[10%] w-[40%] h-[40%] bg-[#ff5a00]/5 rounded-full blur-[120px]" />
              <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-[#ff5a00]/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div
                className="space-y-12"
              >
                {/* Featured Match (Single, Top) */}
                {featuredMatch && (
                  <div className="w-full">
                    <div
                      onClick={() => !isEditMode && setSelectedMatchId(featuredMatch.id)}
                      className={`relative group bg-black/40 backdrop-blur-sm border rounded-2xl p-10 md:p-16 overflow-hidden transition-all duration-500 hover:scale-[1.02] ${!isEditMode ? 'cursor-pointer' : ''} ${displayNextMatch
                        ? 'border-[#ff5a00]/30 shadow-[0_0_40px_rgba(255,90,0,0.1)]'
                        : 'border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
                        }`}>
                      {/* Decorative gradient corner */}
                      <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#ff5a00]/10 to-transparent blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100 ${displayNextMatch ? 'opacity-80' : 'opacity-40'
                        }`} />

                      <div className="relative z-10 flex flex-col items-center">
                        <div className="flex items-center space-x-3 text-[#ff5a00] font-bold uppercase tracking-widest text-xs mb-8 bg-[#ff5a00]/10 px-4 py-2 rounded-full border border-[#ff5a00]/20">
                          {displayNextMatch ? <Calendar className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                          <span>{displayNextMatch ? "Prossima Partita" : "Ultimo Risultato"}</span>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-4xl gap-2 md:gap-0">
                          {/* Home team on the left */}
                          <div className="flex-1 text-center md:text-right space-y-0">
                            <h4 className="font-heading text-2xl md:text-4xl font-black text-white uppercase tracking-wider">
                              {featuredMatch.isHome !== false ? "Glass Cannons" : featuredMatch.opponent}
                            </h4>
                          </div>

                          {/* Score / VS */}
                          <div className="flex flex-col items-center px-8 md:px-12 py-2 md:py-0">
                            {displayNextMatch ? (
                              <div className="text-4xl md:text-6xl font-heading font-black text-white/20 uppercase tracking-tighter">VS</div>
                            ) : (
                              <div className="flex items-center gap-4 md:gap-8">
                                {featuredMatch.isHome !== false ? (
                                  <>
                                    <span className={`text-5xl md:text-7xl font-heading font-black ${featuredMatch.we > featuredMatch.they ? 'text-[#ff5a00]' : 'text-white'}`}>{featuredMatch.we}</span>
                                    <span className="text-2xl md:text-4xl font-heading font-black text-gray-700">-</span>
                                    <span className={`text-5xl md:text-7xl font-heading font-black ${featuredMatch.they > featuredMatch.we ? 'text-[#ff5a00]' : 'text-white'}`}>{featuredMatch.they}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className={`text-5xl md:text-7xl font-heading font-black ${featuredMatch.they > featuredMatch.we ? 'text-[#ff5a00]' : 'text-white'}`}>{featuredMatch.they}</span>
                                    <span className="text-2xl md:text-4xl font-heading font-black text-gray-700">-</span>
                                    <span className={`text-5xl md:text-7xl font-heading font-black ${featuredMatch.we > featuredMatch.they ? 'text-[#ff5a00]' : 'text-white'}`}>{featuredMatch.we}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Away team on the right */}
                          <div className="flex-1 text-center md:text-left space-y-0">
                            <h4 className="font-heading text-2xl md:text-4xl font-black text-white uppercase tracking-wider">
                              {featuredMatch.isHome !== false ? featuredMatch.opponent : "Glass Cannons"}
                            </h4>
                          </div>
                        </div>

                        <div className="mt-12 flex flex-col items-center space-y-2">
                          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-sm">
                            {normalizeDate(featuredMatch.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-gray-600 text-xs font-medium uppercase tracking-widest flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${displayNextMatch ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`} />
                            {featuredMatch.venue || "Luogo da definire"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Secondary Row (Two Matches) */}
                {displayMatchesRow.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {displayMatchesRow.map((match, idx) => {
                      const isWin = match.we > match.they;
                      const isDraw = match.we === match.they;
                      return (
                        <div key={match.id} className="group">
                          <div
                            onClick={() => !isEditMode && setSelectedMatchId(match.id)}
                            className={`bg-black/40 backdrop-blur-sm border border-white/5 rounded-xl p-8 hover:border-[#ff5a00]/30 transition-all duration-300 relative overflow-hidden h-full ${!isEditMode ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-6">
                              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                {normalizeDate(match.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${isWin ? 'bg-green-500/10 text-green-500' : isDraw ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                                {isWin ? 'Vittoria' : isDraw ? 'Pareggio' : 'Sconfitta'}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 space-y-1">
                                {/* Home team on top, away team below */}
                                <p className="text-white font-bold text-sm uppercase tracking-wide truncate">
                                  {match.isHome !== false ? "Glass Cannons" : match.opponent}
                                </p>
                                <p className="text-gray-400 font-bold text-sm uppercase tracking-wide truncate">
                                  {match.isHome !== false ? match.opponent : "Glass Cannons"}
                                </p>
                              </div>
                              <div className="bg-[#111] border border-white/10 px-4 py-2 rounded-lg font-heading font-bold text-xl text-white shadow-inner flex items-center gap-2">
                                {match.isHome !== false ? (
                                  <>
                                    <span className={isWin ? 'text-[#ff5a00]' : ''}>{match.we}</span>
                                    <span className="text-gray-600">-</span>
                                    <span className={!isWin && !isDraw ? 'text-[#ff5a00]' : ''}>{match.they}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className={!isWin && !isDraw ? 'text-[#ff5a00]' : ''}>{match.they}</span>
                                    <span className="text-gray-600">-</span>
                                    <span className={isWin ? 'text-[#ff5a00]' : ''}>{match.we}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ff5a00]/0 to-transparent group-hover:via-[#ff5a00]/50 transition-all duration-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer Links */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4">
                  <Link href="/calendario" className="group flex items-center text-gray-500 hover:text-[#ff5a00] transition-colors font-bold uppercase tracking-widest text-[10px]">
                    Calendario Completo <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link href="/risultati" className="group flex items-center text-gray-500 hover:text-[#ff5a00] transition-colors font-bold uppercase tracking-widest text-[10px]">
                    Tutti i Risultati <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        );


      case 'history':
        return (
          <section key={block.id} className="py-24 bg-black relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={staggerContainer}
                  className="space-y-8"
                >
                  <div>
                    <Editable
                      as="h2"
                      blockId={block.id}
                      field="title"
                      initialValue={block.title || "La Nostra Storia"}
                      className="text-[#ff5a00] font-bold tracking-widest uppercase text-sm mb-2 block"
                    />
                    <Editable
                      as="h3"
                      blockId={block.id}
                      field="subtitle"
                      initialValue={block.subtitle || "Nati per rompere gli schemi"}
                      className="font-heading text-4xl md:text-5xl font-bold uppercase text-white leading-tight block"
                    />
                  </div>

                  <motion.div variants={fadeIn} className="w-20 h-1 bg-[#ff5a00]" />

                  <Editable
                    as="p"
                    blockId={block.id}
                    field="text1"
                    initialValue={block.text1 || "Testo storia parte 1..."}
                    className="text-gray-400 text-lg leading-relaxed block"
                  />

                  <Editable
                    as="p"
                    blockId={block.id}
                    field="text2"
                    initialValue={block.text2 || "Testo storia parte 2..."}
                    className="text-gray-400 text-lg leading-relaxed block"
                  />

                  <motion.div variants={fadeIn} className="grid grid-cols-2 gap-6 pt-6">
                    <div className="border-l-2 border-[#ff5a00] pl-4">
                      <Editable
                        as="p"
                        blockId={block.id}
                        field="stat1Value"
                        initialValue={block.stat1Value || "112"}
                        className="font-heading text-4xl font-bold text-white mb-1 block"
                      />
                      <Editable
                        as="p"
                        blockId={block.id}
                        field="stat1Label"
                        initialValue={block.stat1Label || "Gol Segnati"}
                        className="text-gray-500 text-sm uppercase tracking-wider font-bold block"
                      />
                    </div>
                    <div className="border-l-2 border-[#ff5a00] pl-4">
                      <Editable
                        as="p"
                        blockId={block.id}
                        field="stat2Value"
                        initialValue={block.stat2Value || "3.4"}
                        className="font-heading text-4xl font-bold text-white mb-1 block"
                      />
                      <Editable
                        as="p"
                        blockId={block.id}
                        field="stat2Label"
                        initialValue={block.stat2Label || "Media Gol/Partita"}
                        className="text-gray-500 text-sm uppercase tracking-wider font-bold block"
                      />
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative aspect-square md:aspect-[4/3] lg:aspect-auto lg:h-[600px] rounded-sm overflow-hidden border border-white/5 group flex justify-center items-center"
                >
                  <div className="absolute inset-0 bg-[#ff5a00]/20 mix-blend-overlay z-10 pointer-events-none" />
                  
                  {block.imageUrl || block.historyImage ? (
                    <>
                      <img
                        src={block.imageUrl || block.historyImage || "/team-photo.png"}
                        alt="Glass Cannons Team"
                        className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:scale-105 transition-all duration-700"
                      />
                      {isEditMode && (
                        <button 
                          onClick={() => updateBlock(block.id, { imageUrl: "", historyImage: "" })} 
                          className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center w-full z-20 relative">
                      <Camera className="w-12 h-12 text-[#ff5a00]/30 mb-4" />
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-6">Immagine della Squadra</p>
                      
                      {isEditMode && (
                        <div className="w-full max-w-sm space-y-6">
                          {/* URL Input */}
                          <div className="space-y-2">
                            <label className="text-[10px] text-[#ff5a00] font-bold uppercase tracking-widest block text-left">Incolla URL Immagine</label>
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="https://esempio.it/foto.jpg"
                                className="flex-1 bg-black/60 border border-white/10 rounded px-3 py-2 text-white text-xs outline-none focus:border-[#ff5a00] transition-colors"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateBlock(block.id, { imageUrl: (e.target as HTMLInputElement).value });
                                  }
                                }}
                                onBlur={(e) => {
                                  if (e.target.value) {
                                    updateBlock(block.id, { imageUrl: e.target.value });
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="h-[1px] bg-white/5 flex-1" />
                            <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Oppure</span>
                            <div className="h-[1px] bg-white/5 flex-1" />
                          </div>
                          
                          {/* File Upload */}
                          <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded font-bold uppercase tracking-widest text-[10px] transition-all block text-center">
                            Scegli file da PC
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={async (e) => {
                                if (!e.target.files?.[0]) return;
                                const file = e.target.files[0];
                                const storageRef = ref(storage, `cms_images/${Date.now()}_${file.name}`);
                                try {
                                  const snapshot = await uploadBytes(storageRef, file);
                                  const url = await getDownloadURL(snapshot.ref);
                                  updateBlock(block.id, { imageUrl: url });
                                } catch (err) { console.error(err); }
                              }} 
                            />
                          </label>
                        </div>
                      )}
                      
                      {!isEditMode && (
                        <img
                          src="/team-photo.png"
                          alt="Glass Cannons Team Default"
                          className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 transition-all duration-700"
                        />
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={block.id} className="py-20 bg-[#0a0a0a] border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {[
                  {
                    icon: <Users className="w-8 h-8 text-[#ff5a00]" />,
                    title: "La Rosa",
                    desc: "Scopri i giocatori, le statistiche dettagliate e il palmarès individuale dei nostri cannonieri.",
                    link: "/squadra"
                  },
                  {
                    icon: <Calendar className="w-8 h-8 text-[#ff5a00]" />,
                    title: "Calendario",
                    desc: "Non perderti nemmeno una partita. Tutte le date, gli orari e i campi dei prossimi match.",
                    link: "/calendario"
                  },
                  {
                    icon: <Trophy className="w-8 h-8 text-[#ff5a00]" />,
                    title: "Risultati & Classifica",
                    desc: "Segui il nostro cammino verso la vetta. Aggiornamenti in tempo reale su punteggi e posizioni.",
                    link: "/classifica"
                  }
                ].map((feature, idx) => {
                  return (
                    <div
                      key={idx}
                      className="relative bg-black p-8 border border-white/5 rounded-sm transition-all duration-300 group overflow-hidden"
                    >
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-[#ff5a00]/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                      <h4 className="font-heading text-2xl font-bold uppercase text-white mb-3">{feature.title}</h4>
                      <p className="text-gray-400 mb-6 leading-relaxed">{feature.desc}</p>
                      <Link href={feature.link} className="inline-flex items-center text-[#ff5a00] font-bold uppercase tracking-wider text-sm hover:text-white transition-colors">
                        Vedi Dettagli <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>

                    <GlowingEffect
                      spread={250}
                      glow={false}
                      disabled={false}
                      proximity={200}
                      borderColor="#ff5a00"
                    />
                  </div>
                );
              })}
              </div>
            </div>
          </section>
        );

      case 'richText':
        return (
          <section key={block.id} className="py-16 bg-black relative">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <Editable
                as="div"
                blockId={block.id}
                field="content"
                initialValue={block.content || "Inserisci testo qui..."}
                className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap"
              />
            </div>
          </section>
        );

      case 'gallery':
        return (
          <section key={block.id} className="py-20 bg-black relative border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-[#ff5a00] font-bold tracking-widest uppercase text-2xl mb-12 text-center font-heading">Galleria Immagini</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(block.images || []).map((imgTitle: any, i: number) => {
                  const img = typeof imgTitle === "string" ? imgTitle : imgTitle.url;
                  return (
                    <div key={i} className="aspect-square relative group overflow-hidden rounded bg-[#0f0f0f] border border-white/5">
                      <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      {isEditMode && (
                        <button
                          onClick={() => {
                            const newImages = [...(block.images || [])];
                            newImages.splice(i, 1);
                            updateBlock(block.id, { images: newImages });
                          }}
                          className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {isEditMode && (
                  <label className="aspect-square border-2 border-dashed border-[#ff5a00]/30 hover:border-[#ff5a00] rounded flex flex-col items-center justify-center cursor-pointer hover:bg-[#ff5a00]/5 transition-all group">
                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                      if (!e.target.files?.[0]) return;
                      const file = e.target.files[0];
                      const storageRef = ref(storage, `cms_images/${Date.now()}_${file.name}`);
                      try {
                        const snapshot = await uploadBytes(storageRef, file);
                        const url = await getDownloadURL(snapshot.ref);
                        updateBlock(block.id, { images: [...(block.images || []), url] });
                      } catch (err) {
                        console.error('Error uploading image', err);
                      }
                    }} />
                    <Camera className="w-8 h-8 text-[#ff5a00]/50 group-hover:text-[#ff5a00] transition-colors mb-2" />
                    <span className="text-[#ff5a00]/50 group-hover:text-[#ff5a00] text-xs font-bold uppercase tracking-wider">Aggiungi Foto</span>
                  </label>
                )}
              </div>
            </div>
          </section>
        );

      case 'genericHero':
        return (
          <section key={block.id} className={`relative flex flex-col justify-center items-center text-center px-4 ${configClasses} min-h-[50vh]`}>
            <div className="max-w-4xl mx-auto z-10">
              {block.config?.showTitle !== false && (
                <Editable as="h1" blockId={block.id} field="title" initialValue={block.title || "Titolo Principale"} className={`font-heading font-black uppercase tracking-wider mb-6 leading-tight ${block.config?.fontSize === 'xl' ? 'text-6xl md:text-8xl' : block.config?.fontSize === 'large' ? 'text-5xl md:text-7xl' : 'text-4xl md:text-6xl'}`} />
              )}
              {block.config?.showSubtitle !== false && (
                <Editable as="p" blockId={block.id} field="subtitle" initialValue={block.subtitle || "Sottotitolo descrittivo..."} className={`mb-8 opacity-80 ${getFontSizeClass(block.config?.fontSize)}`} />
              )}
              {block.config?.showCta !== false && (
                <div className="mt-8 flex justify-center">
                  <Editable as="span" blockId={block.id} field="ctaText" initialValue={block.ctaText || "Scopri di più"} className="bg-[#ff5a00] hover:bg-[#ff5a00]/80 text-white px-8 py-4 rounded font-bold uppercase tracking-widest text-sm transition-colors cursor-pointer shadow-[0_0_20px_rgba(255,90,0,0.3)]" />
                </div>
              )}
            </div>
          </section>
        );

      case 'imageWithText':
        const imgPos = block.config?.imagePosition || 'left';
        const isImageFirst = imgPos === 'left' || imgPos === 'top';
        const isVertical = imgPos === 'top' || imgPos === 'bottom';

        return (
          <section key={block.id} className={`relative ${configClasses}`}>
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex ${isVertical ? 'flex-col' : 'flex-col md:flex-row'} gap-12 items-center`}>
              {/* Content area */}
              <div className={`flex-1 ${!isImageFirst && !isVertical ? 'md:order-2' : ''} ${!isImageFirst && isVertical ? 'order-2' : ''}`}>
                <Editable as="h2" blockId={block.id} field="title" initialValue={block.title || "Titolo Sezione"} className={`font-heading font-bold uppercase tracking-wider mb-6 ${block.config?.fontSize === 'xl' ? 'text-5xl md:text-6xl' : block.config?.fontSize === 'large' ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`} />
                <Editable as="div" blockId={block.id} field="content" initialValue={block.content || "Inserisci testo qui..."} className={`opacity-80 leading-relaxed whitespace-pre-wrap ${getFontSizeClass(block.config?.fontSize)}`} />
              </div>

              {/* Image area */}
              <div className={`flex-1 w-full relative ${isVertical ? 'aspect-video' : 'aspect-square'} rounded-lg overflow-hidden border border-white/10 bg-[#0f0f0f] group flex justify-center items-center`}>
                {block.imageUrl ? (
                  <>
                    <img src={block.imageUrl} alt="Sezione" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    {isEditMode && (
                      <button onClick={() => updateBlock(block.id, { imageUrl: "" })} className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center p-8 opacity-50">
                    <Camera className="w-12 h-12 mx-auto mb-4" />
                    <span className="font-heading uppercase tracking-widest text-sm block mb-4">Nessuna Immagine</span>
                    {isEditMode && (
                      <label className="cursor-pointer bg-[#ff5a00] text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#ff5a00]/80 transition-colors">
                        Carica Immagine
                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                          if (!e.target.files?.[0]) return;
                          const file = e.target.files[0];
                          const storageRef = ref(storage, `cms_images/${Date.now()}_${file.name}`);
                          try {
                            const snapshot = await uploadBytes(storageRef, file);
                            const url = await getDownloadURL(snapshot.ref);
                            updateBlock(block.id, { imageUrl: url });
                          } catch (err) { console.error(err); }
                        }} />
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case 'dynamicData':
        const dataType = block.config?.dataType || 'nextMatch';
        return (
          <section key={block.id} className={`relative ${configClasses}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
              <Editable as="h2" blockId={block.id} field="title" initialValue={block.title || "Dati Dinamici"} className="font-heading font-bold tracking-widest uppercase text-3xl mb-8" />

              {dataType === 'nextMatch' && (
                <div className="bg-black/50 border border-white/10 rounded-lg p-8 w-full max-w-2xl text-center backdrop-blur-sm relative overflow-hidden group hover:border-[#ff5a00]/30 transition-colors">
                  <div className="mb-4 text-[#ff5a00] font-bold uppercase tracking-wider text-sm flex items-center justify-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Prossimo Incontro</span>
                  </div>
                  {loadingMatches ? (
                    <div className="space-y-4 animate-pulse mt-6 mb-4">
                      <div className="h-8 bg-white/10 rounded w-3/4 mx-auto"></div>
                      <div className="h-4 bg-white/5 rounded w-1/2 mx-auto"></div>
                    </div>
                  ) : nextMatch ? (
                    <>
                      <div className="text-4xl font-heading font-black text-white uppercase tracking-wider mb-2">
                        Glass Cannons <span className="text-gray-600">VS</span> {nextMatch.opponent}
                      </div>
                      <div className="text-gray-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center space-x-4">
                        <span>{normalizeDate(nextMatch.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-700" />
                        <span>{nextMatch.venue}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 font-bold uppercase tracking-widest text-sm py-4">Nessuna partita programmata</div>
                  )}
                  <div className="mt-6 pt-6 border-t border-white/5 text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Dati sincronizzati col database</div>
                </div>
              )}

              {dataType === 'lastResults' && (
                <div className="w-full max-w-4xl space-y-4">
                  {loadingMatches ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse border border-white/10 w-full mb-4"></div>
                    ))
                  ) : lastMatches.length > 0 ? lastMatches.map((res: any) => (
                    <div key={res.id} className="bg-black/50 border border-white/10 rounded-lg p-4 flex items-center justify-between backdrop-blur-sm hover:border-[#ff5a00]/30 transition-colors">
                      <div className="flex-1 text-left">
                        <div className="text-[10px] text-[#ff5a00] font-bold uppercase tracking-widest">{normalizeDate(res.date).toLocaleDateString('it-IT')}</div>
                        <div className="text-white font-heading font-bold uppercase truncate">{res.opponent}</div>
                      </div>
                      <div className="flex items-center space-x-4 px-6 border-x border-white/5">
                        <span className="text-2xl font-heading font-black text-white">GC</span>
                        <span className="bg-[#111] px-4 py-1 rounded text-[#ff5a00] font-heading font-bold text-xl">{res.we} - {res.they}</span>
                        <span className="text-2xl font-heading font-black text-gray-500">AVV</span>
                      </div>
                      <div className="flex-1 text-right">
                         <div className={`text-[10px] font-bold uppercase tracking-widest ${res.we > res.they ? 'text-green-500' : res.we < res.they ? 'text-red-500' : 'text-gray-500'}`}>
                           {res.we > res.they ? 'Vittoria' : res.we < res.they ? 'Sconfitta' : 'Pareggio'}
                         </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-gray-500 py-12">Nessun risultato disponibile</div>
                  )}
                </div>
              )}

              {dataType === 'standings' && (
                <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-[10px] uppercase bg-black/60 text-[#ff5a00] font-bold tracking-[0.2em] border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 w-12 text-center">#</th>
                        <th className="px-6 py-4">Squadra</th>
                        <th className="px-6 py-4 text-center">PT</th>
                        <th className="px-6 py-4 text-center">G</th>
                        <th className="px-6 py-4 text-center hidden md:table-cell">V</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingMatches ? (
                        [1,2,3,4,5].map(i => (
                          <tr key={i} className="border-b border-white/5">
                            <td colSpan={5} className="py-4 px-6"><div className="h-4 bg-white/5 rounded w-full animate-pulse"></div></td>
                          </tr>
                        ))
                      ) : standings.slice(0, 5).map((team) => (
                        <tr key={team.team} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${team.team === 'Glass Cannons' ? 'bg-[#ff5a00]/5' : ''}`}>
                          <td className="px-6 py-4 text-center font-heading font-bold text-gray-500">{team.pos}</td>
                          <td className={`px-6 py-4 font-bold ${team.team === 'Glass Cannons' ? 'text-white' : 'text-gray-400'}`}>
                            {team.team}
                            {team.team === 'Glass Cannons' && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-[#ff5a00] inline-block animate-pulse" />}
                          </td>
                          <td className={`px-6 py-4 text-center font-heading font-bold text-lg ${team.team === 'Glass Cannons' ? 'text-[#ff5a00]' : 'text-white'}`}>{team.pts}</td>
                          <td className="px-6 py-4 text-center">{team.p}</td>
                          <td className="px-6 py-4 text-center hidden md:table-cell">{team.w}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 bg-white/5 text-center">
                    <Link href="/risultati" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Vedi Classifica Completa →</Link>
                  </div>
                </div>
              )}
              {dataType === 'squadPreview' && (
                <div className="flex flex-wrap justify-center gap-6 mt-4">
                  {loadingMatches ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="bg-black/50 p-6 border border-white/10 rounded-lg w-48 animate-pulse text-center space-y-4">
                        <div className="w-20 h-20 bg-white/10 rounded-full mx-auto border-2 border-[#ff5a00]/10"></div>
                        <div className="h-4 bg-white/20 rounded w-3/4 mx-auto mt-4"></div>
                        <div className="h-3 bg-white/10 rounded w-1/2 mx-auto"></div>
                      </div>
                    ))
                  ) : (players.length > 0 ? players.slice(0, 6) : [1, 2, 3]).map((player: any, i) => (
                    <div key={player.id || i} className="bg-black/50 p-6 border border-white/10 rounded-lg w-48 text-center group hover:border-[#ff5a00]/50 transition-colors">
                      {player.imageUrl ? (
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-2 border-[#ff5a00]/30 relative">
                          <ImageWithFallback src={player.imageUrl} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <Users className="w-12 h-12 text-[#ff5a00]/40 mx-auto mb-4" />
                      )}
                      <div className="font-heading font-bold text-white uppercase tracking-wider group-hover:text-[#ff5a00] transition-colors line-clamp-1">
                        {player.name || `Giocatore ${i + 1}`}
                      </div>
                      <div className="text-[#ff5a00] font-bold text-[10px] uppercase tracking-widest mt-1 opacity-70">
                        {player.role || 'Ruolo'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );

      case 'carousel':
        return (
          <section key={block.id} className={`relative ${configClasses} overflow-hidden border-t border-white/5`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              {/* Simplified static preview of carousel for now */}
              <div className="flex flex-col items-center py-12">
                <h2 className="text-3xl font-heading font-bold uppercase mb-8 text-[#ff5a00]">Carosello</h2>
                <div className="w-full max-w-4xl bg-[#0a0a0a] aspect-video border border-white/10 rounded-lg overflow-hidden flex items-center justify-center relative shadow-2xl">
                  {block.config?.slides?.[0]?.imageUrl ? (
                    <img src={block.config.slides[0].imageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-500 font-bold uppercase tracking-widest text-sm flex flex-col items-center space-y-4">
                      <Camera className="w-12 h-12 opacity-50" />
                      <span>Configura Slide nel Menu Laterale</span>
                    </div>
                  )}
                  {block.config?.showArrows && (
                    <>
                      <div className="absolute left-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full border border-white/10 flex items-center justify-center"><div className="w-3 h-3 border-t-2 border-l-2 border-white -rotate-45 ml-1"></div></div>
                      <div className="absolute right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full border border-white/10 flex items-center justify-center"><div className="w-3 h-3 border-t-2 border-r-2 border-white rotate-45 mr-1"></div></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        );

      case 'video':
        return (
          <section key={block.id} className={`relative ${configClasses} border-t border-white/5`}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex justify-center items-center">
                {block.videoUrl ? (
                  <iframe
                    src={block.videoUrl.replace("watch?v=", "embed/")}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-gray-500 font-bold uppercase tracking-widest text-sm flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-[#ff5a00]/10 flex items-center justify-center border border-[#ff5a00]/30 mb-6">
                      <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-[#ff5a00] border-b-[10px] border-b-transparent ml-2"></div>
                    </div>
                    Inserisci URL Video dalla Barra Laterale
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case 'countdown':
        return (
          <section key={block.id} className={`relative ${configClasses} overflow-hidden min-h-[60vh] flex items-center justify-center`}>
            {/* Dynamic background element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-radial-gradient from-[#ff5a00]/5 to-transparent pointer-events-none opacity-50" />

            <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col items-center text-center">
              <Editable as="h2" blockId={block.id} field="title" initialValue={block.title || "Prossima Grande Sfida"} className="text-[#ff5a00] font-heading font-black uppercase italic tracking-tighter text-4xl md:text-7xl mb-4 drop-shadow-[0_0_30px_rgba(255,90,0,0.3)]" />
              <Editable blockId={block.id} field="description" initialValue={block.description || "Inizia il countdown per l'evento più atteso dell'anno."} className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] md:text-sm mb-12 max-w-lg mx-auto" />

              {block.targetDate ? (
                <CountdownTimer targetDate={block.targetDate} />
              ) : (
                <div className="text-gray-500 font-bold uppercase tracking-widest text-sm flex flex-col items-center space-y-4">
                  <Calendar className="w-12 h-12 opacity-50" />
                  <span>Configura Data nel Menu Laterale</span>
                </div>
              )}
            </div>
          </section>
        );

      case 'news':
        return <NewsCarousel key={block.id} />;

      default:
        return null;
    }
  };

  return (
    <div className="bg-black transition-all duration-300 min-h-screen">
      {/* Fallback empty state if no blocks */}
      {blocks.length === 0 && isEditMode && (
        <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-white/10 m-8 rounded-xl">
          <h2 className="text-2xl font-bold font-heading text-white uppercase tracking-wider mb-4">Nessuna Sezione Presente</h2>
          <p className="text-gray-400 mb-8 max-w-md">Inizia a costruire la tua pagina aggiungendo sezioni dalla libreria.</p>
          <button onClick={() => setSidebarView('library')} className="bg-[#ff5a00] text-black font-bold uppercase tracking-widest px-6 py-3 rounded hover:bg-white transition-colors">Apri Libreria Sezioni</button>
        </div>
      )}

      {blocks.map((block, index) => {
        const isSelected = isEditMode && selectedBlockId === block.id;

        return (
          <div
            key={block.id}
            className={`relative group/block transition-all duration-300 outline outline-2 outline-offset-[-2px] ${isSelected ? 'outline-[#ff5a00] z-40' : 'outline-transparent'} ${isEditMode ? 'cursor-pointer min-h-[100px]' : ''}`}
            onClick={(e) => {
              if (isEditMode) {
                e.stopPropagation(); // Previene prop a body
                setSelectedBlockId(block.id);
                setSidebarView('settings');
              }
            }}
          >
            {/* Overlay hover per selezione visiva */}
            {isEditMode && !isSelected && (
              <div className="absolute inset-0 bg-white/0 hover:bg-white/[0.02] transition-colors pointer-events-none z-30" />
            )}

            {/* Badge indicatore blocco selezionato */}
            {isSelected && (
              <div className="absolute top-0 left-0 bg-[#ff5a00] text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 z-50 rounded-br shadow-lg">
                {block.type}
              </div>
            )}

            {/* Section inserter between blocks */}
            <div className="relative z-50">
              <SectionInserter index={index} />
            </div>

            <div className={`relative ${isEditMode ? 'pointer-events-none' : ''}`}>
              {/* Permettiamo editable cliccabili anche se il wrapper intercetta clicks. 
                   Editable ha stopPropagation internamente se entra in modalita edit */}
              <div className="pointer-events-auto">
                {renderBlock(block, index)}
              </div>
            </div>

            {/* Section inserter at the bottom */}
            {index === blocks.length - 1 && (
              <div className="relative z-50">
                <SectionInserter index={index + 1} />
              </div>
            )}
          </div>
        );
      })}

      {selectedMatchId && (
        <MatchDetailsModal
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <LiveEditor>
      <HomeBlocksContent />
    </LiveEditor>
  );
}

