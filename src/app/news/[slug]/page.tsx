"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Calendar, User, Tag } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { normalizeDate } from "@/lib/utils";

type NewsArticle = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    category: string;
    publishedAt: any;
};

export default function ArticlePage() {
    const { slug } = useParams();
    const router = useRouter();
    const [article, setArticle] = useState<NewsArticle | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const q = query(
                    collection(db, "news"),
                    where("slug", "==", slug),
                    limit(1)
                );
                const snapshot = await getDocs(q);
                if (snapshot.empty) {
                    setLoading(false);
                    return;
                }
                const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as NewsArticle;
                setArticle(data);
            } catch (error) {
                console.error("Error fetching article:", error);
            }
            setLoading(false);
        };
        fetchArticle();
    }, [slug]);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-[#ff5a00] font-heading text-2xl animate-pulse uppercase tracking-[0.3em]">Caricamento...</div>
        </div>
    );

    if (!article) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-8 p-10 text-center">
            <h1 className="text-white font-heading text-4xl uppercase font-black">Articolo non trovato</h1>
            <p className="text-gray-500 uppercase tracking-widest text-xs">L'articolo che cerchi potrebbe essere stato rimosso o spostato.</p>
            <Link href="/news" className="text-[#ff5a00] font-bold uppercase tracking-widest hover:underline flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Torna alle news</span>
            </Link>
        </div>
    );

    return (
        <article className="min-h-screen bg-black overflow-hidden pt-20">
            {/* Header Hero */}
            <header className="relative w-full h-[60vh] md:h-[80vh] flex flex-col justify-end pb-20 px-4">
                <div className="absolute inset-0">
                    <img 
                        src={article.coverImage} 
                        alt={article.title}
                        className="w-full h-full object-cover grayscale opacity-50" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>

                <div className="max-w-5xl mx-auto w-full relative z-10 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <Link 
                            href="/news" 
                            className="inline-flex items-center space-x-2 text-[#ff5a00] font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>News</span>
                        </Link>
                        
                        <div className="flex items-center space-x-4">
                            <span className="bg-[#ff5a00] text-white px-3 py-1 rounded-sm text-[10px] md:text-xs font-bold uppercase tracking-widest">
                                {article.category}
                            </span>
                            <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center">
                                <Calendar className="w-3 h-3 mr-2 text-[#ff5a00]/60" />
                                {normalizeDate(article.publishedAt).toLocaleDateString('it-IT')}
                            </span>
                        </div>

                        <h1 className="text-white font-heading text-4xl md:text-7xl font-black uppercase italic leading-[0.9] tracking-tighter">
                            {article.title}
                        </h1>
                    </motion.div>
                </div>

                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent" />
            </header>

            {/* Content Area */}
            <main className="max-w-4xl mx-auto px-6 py-20 bg-black relative">
                <div className="flex flex-col md:flex-row gap-12">
                    {/* Sidebar / Social Share */}
                    <aside className="md:w-16 flex flex-row md:flex-col items-center md:items-start space-x-4 md:space-x-0 md:space-y-6 shrink-0">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#ff5a00] hover:text-white transition-all cursor-pointer">
                            <Share2 className="w-5 h-5" />
                        </div>
                    </aside>

                    {/* Article Body */}
                    <div className="flex-1 space-y-12">
                        {/* Excerpt */}
                        {article.excerpt && (
                            <p className="text-xl md:text-2xl text-gray-300 font-bold uppercase tracking-wide leading-relaxed border-l-4 border-[#ff5a00] pl-6 md:pl-10">
                                {article.excerpt}
                            </p>
                        )}

                        {/* Rich Content - Using whitespace rendering for simple text, or HTML if needed */}
                        <div 
                            className="prose prose-invert prose-orange max-w-none text-gray-400 text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-sans space-y-6"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />

                        {/* Footer Tags */}
                        <footer className="pt-16 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                                    <Tag className="w-3 h-3 mr-2 text-[#ff5a00]/60" />
                                    <span>{article.category}</span>
                                </div>
                                <span className="w-1 h-1 bg-white/10 rounded-full" />
                                <div className="flex items-center text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                                    <User className="w-3 h-3 mr-2 text-[#ff5a00]/60" />
                                    <span>Glass Cannons Redazione</span>
                                </div>
                            </div>
                            
                            <Link 
                                href="/news" 
                                className="px-8 py-3 border border-white/10 rounded-sm text-white font-bold uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all"
                            >
                                Tutte le News
                            </Link>
                        </footer>
                    </div>
                </div>
            </main>

            {/* Background Decorative Graphic */}
            <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-[#ff5a00]/5 rounded-full blur-[150px] -z-10 opacity-30 pointer-events-none" />
        </article>
    );
}
