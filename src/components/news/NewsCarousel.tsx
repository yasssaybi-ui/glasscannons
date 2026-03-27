"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { normalizeDate } from "@/lib/utils";

type NewsArticle = {
    id: string;
    title: string;
    slug: string;
    coverImage: string;
    category: string;
    publishedAt: any;
    isVisible?: boolean;
    homepageOrder?: number;
    showInHomepage?: boolean;
};

export default function NewsCarousel() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const q = query(
                    collection(db, "news"),
                    where("showInHomepage", "==", true)
                );
                const querySnapshot = await getDocs(q);
                let newsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as NewsArticle[];

                // Filter and sort in-memory to avoid composite index
                newsData = newsData
                    .filter(n => n.isVisible !== false)
                    .sort((a, b) => (a.homepageOrder || 0) - (b.homepageOrder || 0))
                    .slice(0, 8);

                setNews(newsData);
            } catch (error) {
                console.error("Error fetching homepage news:", error);
            }
            setLoading(false);
        };
        fetchNews();
    }, []);

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const scrollAmount = 420;
        scrollRef.current.scrollBy({
            left: direction === "right" ? scrollAmount : -scrollAmount,
            behavior: "smooth",
        });
    };

    if (loading) return (
        <section className="bg-black py-12 px-4 md:px-12">
            <div className="flex space-x-4 overflow-hidden">
                {[1, 2, 3].map(i => (
                    <div key={i} className="shrink-0 w-[340px] aspect-[4/3] bg-[#111] rounded-lg animate-pulse" />
                ))}
            </div>
        </section>
    );

    if (news.length === 0) return null;

    return (
        <section className="bg-black py-12 overflow-hidden">
            {/* Header */}
            <div className="flex items-end justify-between px-4 md:px-12 mb-6">
            <div className="space-y-1">
                    <p className="text-[#ff5a00] font-bold uppercase tracking-[0.4em] text-[10px]">
                        Glass Cannons
                    </p>
                    <Link href="/news" className="group inline-block">
                        <h2 className="text-white font-heading font-black uppercase text-3xl md:text-5xl italic tracking-tighter group-hover:text-[#ff5a00] transition-colors whitespace-nowrap">
                            Ultime Notizie
                        </h2>
                    </Link>
                </div>
                <div className="flex items-center space-x-6">
                    <Link
                        href="/news"
                        className="hidden md:flex items-center space-x-2 text-gray-400 hover:text-[#ff5a00] transition-colors font-bold uppercase tracking-[0.3em] text-[10px] border-b border-transparent hover:border-[#ff5a00] pb-1"
                    >
                        <span>Tutti i Contenuti</span>
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => scroll("left")}
                            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all group"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all group"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Cards Strip */}
            <div
                ref={scrollRef}
                className="flex space-x-4 overflow-x-auto scroll-smooth pl-4 md:pl-12 pr-4 pb-2 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {news.map((article, i) => (
                    <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="group shrink-0 w-[300px] md:w-[360px] rounded-xl overflow-hidden bg-[#0c0c0c] border border-white/5 hover:border-[#ff5a00]/30 transition-all duration-300 cursor-pointer"
                    >
                        <Link href={`/news/${article.slug}`} className="block">
                            {/* Image */}
                            <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#111]">
                                {article.coverImage ? (
                                    <img
                                        src={article.coverImage}
                                        alt={article.title}
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-gray-800 font-heading text-3xl uppercase font-black">GC</span>
                                    </div>
                                )}
                                {/* Category badge */}
                                <div className="absolute top-3 left-3">
                                    <span className="bg-[#ff5a00] text-white text-[9px] font-bold uppercase px-2.5 py-1 tracking-widest shadow-lg">
                                        {article.category}
                                    </span>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            </div>

                            {/* Text Content */}
                            <div className="p-5 space-y-3">
                                <span className="text-[#ff5a00]/50 text-[9px] font-bold uppercase tracking-[0.25em]">
                                    {normalizeDate(article.publishedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <h3 className="text-white font-heading font-black uppercase leading-tight text-base md:text-lg group-hover:text-[#ff5a00] transition-colors line-clamp-2">
                                    {article.title}
                                </h3>
                                <div className="flex items-center space-x-2 text-white/30 group-hover:text-white/60 transition-colors text-[9px] font-bold uppercase tracking-widest pt-2 border-t border-white/5">
                                    <span>Leggi l&apos;articolo</span>
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}

                {/* "See All" card at the end */}
                <Link
                    href="/news"
                    className="group shrink-0 w-[200px] rounded-xl overflow-hidden bg-[#0c0c0c] border border-white/5 hover:border-[#ff5a00]/40 flex flex-col items-center justify-center space-y-4 p-8 transition-all duration-300 mr-4 md:mr-12"
                >
                    <div className="w-12 h-12 rounded-full border border-white/20 group-hover:border-[#ff5a00] group-hover:bg-[#ff5a00] flex items-center justify-center transition-all duration-300">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white/50 group-hover:text-[#ff5a00] font-bold uppercase tracking-[0.25em] text-[9px] text-center transition-colors">
                        Tutti i<br />contenuti
                    </span>
                </Link>
            </div>
        </section>
    );
}
