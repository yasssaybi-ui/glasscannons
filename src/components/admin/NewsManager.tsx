"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, X, Edit2, Trash2, Globe, Eye, EyeOff, LayoutPanelTop, Check, Search } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from "firebase/firestore";
import { slugify, normalizeDate } from "@/lib/utils";

type NewsArticle = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    category: string;
    publishedAt: any;
    isVisible: boolean;
    showInHomepage: boolean;
    homepageOrder: number;
};

const initialFormState = {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "Prima Squadra",
    publishedAt: new Date().toISOString().split('T')[0],
    isVisible: true,
    showInHomepage: false,
    homepageOrder: 0,
};

export default function NewsManager() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState(initialFormState);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "news"), orderBy("publishedAt", "desc"));
            const querySnapshot = await getDocs(q);
            const newsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as NewsArticle[];
            setNews(newsData);
        } catch (error) {
            console.error("Error fetching news:", error);
        }
        setLoading(false);
    };

    const handleOpenModal = (article?: NewsArticle) => {
        if (article) {
            setEditingId(article.id);
            setFormData({
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt || "",
                content: article.content || "",
                coverImage: article.coverImage || "",
                category: article.category || "Prima Squadra",
                publishedAt: normalizeDate(article.publishedAt).toISOString().split('T')[0],
                isVisible: article.isVisible,
                showInHomepage: article.showInHomepage || false,
                homepageOrder: article.homepageOrder || 0,
            });
        } else {
            setEditingId(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData(initialFormState);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => {
            const newState = {
                ...prev,
                [name]: type === "checkbox" ? checked : (name === "homepageOrder" ? Number(value) : value)
            };

            // Auto-generate slug from title if title changes and we're not manually editing slug
            if (name === "title" && !editingId) {
                newState.slug = slugify(value);
            }

            return newState;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const articleData = {
            ...formData,
            publishedAt: Timestamp.fromDate(new Date(formData.publishedAt)),
            updatedAt: Timestamp.now()
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, "news", editingId), articleData);
            } else {
                await addDoc(collection(db, "news"), {
                    ...articleData,
                    createdAt: Timestamp.now()
                });
            }
            fetchNews();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving news:", error);
            alert("Errore nel salvataggio.");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questa notizia?")) {
            setLoading(true);
            try {
                await deleteDoc(doc(db, "news", id));
                fetchNews();
            } catch (error) {
                console.error("Error deleting news:", error);
                alert("Errore nell'eliminazione.");
            }
            setLoading(false);
        }
    };

    const toggleVisibility = async (article: NewsArticle) => {
        try {
            await updateDoc(doc(db, "news", article.id), {
                isVisible: !article.isVisible
            });
            fetchNews();
        } catch (error) {
            console.error("Error toggling visibility:", error);
        }
    };

    const toggleHomepage = async (article: NewsArticle) => {
        try {
            await updateDoc(doc(db, "news", article.id), {
                showInHomepage: !article.showInHomepage
            });
            fetchNews();
        } catch (error) {
            console.error("Error toggling homepage:", error);
        }
    };

    const filteredNews = news.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0a0a0a]">
            <header className="min-h-[5rem] py-4 bg-[#0a0a0a] border-b border-white/10 flex flex-wrap items-center px-4 md:px-8 justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2 sm:space-x-4">
                    <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff5a00]" />
                    <h2 className="font-heading text-xl sm:text-2xl font-bold uppercase text-white tracking-widest">Gestione News</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:space-x-4 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Cerca news..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-black border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:border-[#ff5a00] outline-none w-full sm:w-64 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-[#ff5a00] text-white px-4 shrink-0 sm:px-6 py-2 rounded text-[10px] sm:text-sm font-bold uppercase tracking-wider hover:bg-[#e04e00] transition-colors shadow-lg shadow-[#ff5a00]/20 flex items-center space-x-2"
                    >
                        <span>+ Nuova <span className="hidden sm:inline">News</span></span>
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8">
                {loading && news.length === 0 ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-[#ff5a00] font-heading text-xl animate-pulse">CARICAMENTO NEWS...</div>
                    </div>
                ) : filteredNews.length === 0 ? (
                    <div className="bg-[#0f0f0f] border border-white/10 p-12 rounded-lg text-center">
                        <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="font-heading text-xl text-white uppercase tracking-wider mb-2">Nessuna notizia trovata</h3>
                        <p className="text-gray-500 mb-6">Inizia a scrivere la tua prima notizia per popolare il sito.</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="text-[#ff5a00] font-bold uppercase tracking-wider hover:underline"
                        >
                            Crea la prima news
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNews.map((article) => (
                            <div key={article.id} className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden flex flex-col group hover:border-[#ff5a00]/30 transition-all duration-300">
                                <div className="relative aspect-video overflow-hidden bg-black">
                                    {article.coverImage ? (
                                        <img src={article.coverImage} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                                            <Newspaper className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 flex space-x-2">
                                        <span className="bg-black/60 backdrop-blur-md text-[#ff5a00] text-[10px] font-bold uppercase px-2 py-1 rounded border border-[#ff5a00]/20">
                                            {article.category}
                                        </span>
                                        {article.showInHomepage && (
                                            <span className="bg-[#ff5a00] text-white text-[10px] font-bold uppercase px-2 py-1 rounded shadow-lg flex items-center space-x-1">
                                                <LayoutPanelTop className="w-3 h-3" />
                                                <span>Home</span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                                        {normalizeDate(article.publishedAt).toLocaleDateString('it-IT')}
                                    </div>
                                    <h3 className="text-white font-heading font-black uppercase text-lg leading-tight mb-3 line-clamp-2 group-hover:text-[#ff5a00] transition-colors">
                                        {article.title}
                                    </h3>
                                    <p className="text-gray-400 text-xs line-clamp-2 mb-6 flex-1">
                                        {article.excerpt || "Nessuna anteprima inserita."}
                                    </p>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => toggleVisibility(article)}
                                                className={`p-2 rounded-lg transition-colors ${article.isVisible ? 'text-green-500 bg-green-500/10 hover:bg-green-500/20' : 'text-gray-500 bg-white/5 hover:bg-white/10'}`}
                                                title={article.isVisible ? "Visibile" : "Nascosto"}
                                            >
                                                {article.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => toggleHomepage(article)}
                                                className={`p-2 rounded-lg transition-colors ${article.showInHomepage ? 'text-blue-500 bg-blue-500/10 hover:bg-blue-500/20' : 'text-gray-500 bg-white/5 hover:bg-white/10'}`}
                                                title={article.showInHomepage ? "In Homepage" : "Nascondi da Home"}
                                            >
                                                <LayoutPanelTop className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleOpenModal(article)}
                                                className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                                                title="Modifica"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(article.id)}
                                                className="p-2 text-gray-500 hover:text-red-500 bg-white/5 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Elimina"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto py-8 sm:py-20"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-[calc(100vw-2rem)] md:max-w-5xl p-4 sm:p-8 flex flex-col max-h-[85vh] sm:max-h-none relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#ff5a00]" />
                            
                            <div className="flex justify-between items-center mb-6 sm:mb-8 shrink-0">
                                <div className="space-y-8 overflow-y-auto flex-1 pr-2 custom-scrollbar p-1">
                                    <h3 className="font-heading text-xl sm:text-3xl font-black uppercase text-white tracking-wider sm:tracking-widest leading-tight">
                                        {editingId ? "Modifica Articolo" : "Nuovo Articolo"}
                                    </h3>
                                    <p className="text-[#ff5a00] text-[10px] font-bold uppercase tracking-[0.3em]">Editor News Glass Cannons</p>
                                </div>
                                <button onClick={handleCloseModal} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-red-500/20 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* Left Column: Content */}
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Titolo Articolo</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Inserisci un titolo accattivante..."
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xl font-heading font-bold text-white focus:border-[#ff5a00] outline-none transition-all placeholder:text-gray-700 shadow-inner"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Slug (URL)</label>
                                            <input
                                                type="text"
                                                name="slug"
                                                value={formData.slug}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-gray-400 focus:border-[#ff5a00] outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Data Pubblicazione</label>
                                            <input
                                                type="date"
                                                name="publishedAt"
                                                value={formData.publishedAt}
                                                onChange={handleInputChange}
                                                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#ff5a00] outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Anteprima (Excerpt)</label>
                                        <textarea
                                            name="excerpt"
                                            value={formData.excerpt}
                                            onChange={handleInputChange}
                                            rows={2}
                                            placeholder="Breve riassunto per la card..."
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-gray-300 focus:border-[#ff5a00] outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Contenuto (HTML/Text)</label>
                                        <textarea
                                            name="content"
                                            value={formData.content}
                                            onChange={handleInputChange}
                                            required
                                            rows={12}
                                            placeholder="Scrivi qui il corpo dell'articolo..."
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:border-[#ff5a00] outline-none transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Sidebar */}
                                <div className="lg:col-span-4 space-y-8 bg-black/30 p-6 rounded-2xl border border-white/5 h-fit">
                                    <div className="space-y-4">
                                        <h4 className="text-[#ff5a00] text-xs font-black uppercase tracking-widest border-b border-[#ff5a00]/20 pb-2">Impostazioni Meta</h4>
                                        
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Categoria</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-[#ff5a00] outline-none transition-all"
                                            >
                                                <option value="Prima Squadra">Prima Squadra</option>
                                                <option value="Torneo">Torneo</option>
                                                <option value="Societá">Societá</option>
                                                <option value="Calciomercato">Calciomercato</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">URL Immagine Copertina</label>
                                            <input
                                                type="url"
                                                name="coverImage"
                                                value={formData.coverImage}
                                                onChange={handleInputChange}
                                                placeholder="https://..."
                                                className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#ff5a00] outline-none transition-all"
                                            />
                                        </div>

                                        {formData.coverImage && (
                                            <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 bg-black">
                                                <img src={formData.coverImage} className="w-full h-full object-cover" alt="Preview" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-white/10">
                                        <h4 className="text-[#ff5a00] text-xs font-black uppercase tracking-widest border-b border-[#ff5a00]/20 pb-2">Visibilitá e Layout</h4>
                                        
                                        <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 cursor-pointer hover:bg-black/60 transition-colors">
                                            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Pubblicato</span>
                                            <input
                                                type="checkbox"
                                                name="isVisible"
                                                checked={formData.isVisible}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 accent-[#ff5a00]"
                                            />
                                        </label>

                                        <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 cursor-pointer hover:bg-black/60 transition-colors">
                                            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">In Homepage</span>
                                            <input
                                                type="checkbox"
                                                name="showInHomepage"
                                                checked={formData.showInHomepage}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 accent-[#ff5a00]"
                                            />
                                        </label>

                                        {formData.showInHomepage && (
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ordine Home (0-10)</label>
                                                <input
                                                    type="number"
                                                    name="homepageOrder"
                                                    value={formData.homepageOrder}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-[#ff5a00] outline-none transition-all"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-[#ff5a00] text-white rounded-xl font-heading font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-[0_10px_30px_rgba(255,90,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? "Sincronizzazione..." : editingId ? "Aggiorna Articolo" : "Pubblica News"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
