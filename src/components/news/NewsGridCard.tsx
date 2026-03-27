"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { normalizeDate } from "@/lib/utils";

type NewsGridCardProps = {
    article: {
        id: string;
        title: string;
        slug: string;
        coverImage: string;
        category: string;
        publishedAt: any;
    };
    featured?: boolean;
};

export default function NewsGridCard({ article, featured = false }: NewsGridCardProps) {
    return (
        <div
            className={`group h-full flex flex-col bg-[#0f0f0f] border border-white/5 rounded-xl overflow-hidden transition-all duration-500 hover:border-[#ff5a00]/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
        >
            <Link href={`/news/${article.slug}`} className="flex flex-col h-full">
                {/* Image Section */}
                <div className={`relative overflow-hidden bg-black ${featured ? 'aspect-[16/10] md:aspect-auto md:flex-1' : 'aspect-video'}`}>
                    {article.coverImage ? (
                        <img 
                            src={article.coverImage} 
                            alt={article.title}
                            className="w-full h-full object-cover grayscale opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                            <span className="text-gray-800 font-heading text-4xl uppercase font-black">News</span>
                        </div>
                    )}
                    
                    {/* Category Pin */}
                    <div className="absolute top-4 left-4 z-10">
                        <span className="bg-[#ff5a00] text-white text-[9px] font-bold uppercase px-3 py-1 tracking-[0.2em] shadow-lg">
                            {article.category}
                        </span>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    
                    {/* Hover Icon */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6 md:p-8 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <span className="text-[#ff5a00]/60 text-[10px] font-bold uppercase tracking-[0.3em]">
                            {normalizeDate(article.publishedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                        <h3 className={`text-white font-heading font-black uppercase leading-tight group-hover:text-[#ff5a00] transition-colors ${featured ? 'text-2xl md:text-4xl' : 'text-xl'}`}>
                            {article.title}
                        </h3>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-white/40 text-[9px] font-bold uppercase tracking-widest pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <span>Leggi l'articolo</span>
                        <div className="w-4 h-[1px] bg-[#ff5a00]" />
                    </div>
                </div>
            </Link>
        </div>
    );
}
