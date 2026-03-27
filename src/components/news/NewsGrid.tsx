"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import NewsGridCard from "./NewsGridCard";
import { Search, ChevronDown } from "lucide-react";
import { normalizeDate } from "@/lib/utils";
import { GlobalLoader } from "@/components/ui/GlobalLoader";

type NewsArticle = {
    id: string;
    title: string;
    slug: string;
    coverImage: string;
    category: string;
    publishedAt: any;
    isVisible?: boolean;
};

export default function NewsGrid() {
    const [allNews, setAllNews] = useState<NewsArticle[]>([]);
    const [displayedNews, setDisplayedNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const ITEMS_PER_PAGE = 9;

    useEffect(() => {
        fetchAllNews();
    }, []);

    useEffect(() => {
        paginateNews(1, true);
    }, [allNews, searchTerm]);

    const fetchAllNews = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "news"),
                where("isVisible", "==", true)
            );
            const snapshot = await getDocs(q);
            const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NewsArticle[];

            // Sort by published date descending
            newsData.sort((a, b) => {
                const dateA = normalizeDate(a.publishedAt).getTime();
                const dateB = normalizeDate(b.publishedAt).getTime();
                return dateB - dateA;
            });

            setAllNews(newsData);
        } catch (error) {
            console.error("Error fetching news grid:", error);
        }
        setLoading(false);
    };

    const paginateNews = (targetPage: number, reset: boolean = false) => {
        let filtered = allNews;

        if (searchTerm) {
            filtered = filtered.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        const itemsToShow = targetPage * ITEMS_PER_PAGE;
        setDisplayedNews(filtered.slice(0, itemsToShow));
        setHasMore(itemsToShow < filtered.length);
        if (reset) {
            setPage(1);
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        paginateNews(nextPage, false);
    };

    return (
        <div className="space-y-12">
            {/* Search Header */}
            <div className="flex justify-end bg-[#0f0f0f] p-4 md:p-6 rounded-2xl border border-white/5 shadow-2xl relative z-30">
                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#ff5a00] transition-colors" />
                    <input
                        type="text"
                        placeholder="Cerca tra le notizie..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-[#ff5a00] outline-none transition-all placeholder:text-gray-700"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="relative">
                {loading && allNews.length === 0 ? (
                    <GlobalLoader />
                ) : displayedNews.length === 0 ? (
                    <div className="py-24 text-center space-y-4">
                        <Search className="w-12 h-12 text-gray-800 mx-auto" />
                        <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm">Nessun risultato trovato</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                        {displayedNews.map((article, index) => (
                            <NewsGridCard
                                key={article.id}
                                article={article}
                                featured={index === 0 && !searchTerm}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Load More */}
            {hasMore && !loading && (
                <div className="flex justify-center pt-8">
                    <button
                        onClick={loadMore}
                        className="group flex flex-col items-center space-y-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="font-bold uppercase tracking-[0.4em] text-[10px]">Carica altro</span>
                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#ff5a00] group-hover:text-[#ff5a00] transition-all">
                            <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
