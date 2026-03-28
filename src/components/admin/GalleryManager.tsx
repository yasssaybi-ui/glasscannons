"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Edit2, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from "firebase/firestore";

type GalleryImage = {
    id: string;
    year: string;
    url: string;
    title: string;
};

const initialFormState = {
    year: new Date().getFullYear().toString(),
    url: "",
    title: "",
};

export default function GalleryManager() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "gallery"), orderBy("year", "desc"));
            const querySnapshot = await getDocs(q);
            const imagesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as GalleryImage[];
            setImages(imagesData);
        } catch (error) {
            console.error("Error fetching gallery:", error);
        }
        setLoading(false);
    };

    const handleOpenModal = (image?: GalleryImage) => {
        if (image) {
            setEditingId(image.id);
            setFormData({
                year: image.year,
                url: image.url,
                title: image.title,
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingId) {
                await updateDoc(doc(db, "gallery", editingId), formData);
            } else {
                await addDoc(collection(db, "gallery"), formData);
            }
            fetchImages();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving image:", error);
            alert("Errore nel salvataggio. Riprova.");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questa foto?")) {
            setLoading(true);
            try {
                await deleteDoc(doc(db, "gallery", id));
                fetchImages();
            } catch (error) {
                console.error("Error deleting image:", error);
                alert("Errore nell'eliminazione.");
            }
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            <header className="min-h-[5rem] py-4 bg-[#0a0a0a] border-b border-white/10 flex flex-wrap items-center px-4 md:px-8 justify-between gap-4 shrink-0">
                <h2 className="font-heading text-xl sm:text-2xl font-bold uppercase text-white tracking-widest">Gestione Galleria</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-[#ff5a00] text-white px-3 py-2 sm:px-4 rounded text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[#e04e00] transition-colors shadow-lg shadow-[#ff5a00]/20"
                >
                    + Aggiungi <span className="hidden sm:inline">Foto</span>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-[#ff5a00] font-heading text-xl animate-pulse">CARICAMENTO DATI...</div>
                    </div>
                ) : images.length === 0 ? (
                    <div className="bg-[#0f0f0f] border border-white/10 p-12 rounded-lg text-center">
                        <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="font-heading text-xl text-white uppercase tracking-wider mb-2">Nessuna foto</h3>
                        <p className="text-gray-500 mb-6">Non hai ancora aggiunto nessuna foto alla galleria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {images.map((image) => (
                            <div key={image.id} className="bg-[#0f0f0f] border border-white/10 rounded-lg overflow-hidden group relative">
                                <div className="aspect-square relative overflow-hidden bg-black">
                                    <img
                                        src={image.url}
                                        alt={image.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4 backdrop-blur-sm">
                                        <button onClick={() => handleOpenModal(image)} className="bg-white/10 p-3 rounded-full text-white hover:bg-[#ff5a00] transition-colors">
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(image.id)} className="bg-white/10 p-3 rounded-full text-white hover:bg-red-500 transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-white uppercase tracking-wider text-sm truncate">{image.title}</h4>
                                    <p className="text-[#ff5a00] text-xs font-bold mt-1 uppercase">Stagione {image.year}</p>
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
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0f0f0f] border border-white/10 rounded-lg shadow-2xl w-full max-w-[calc(100vw-2rem)] md:max-w-lg p-4 sm:p-6 md:p-8 flex flex-col max-h-[85vh] sm:max-h-none overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-white/10 pb-4 shrink-0">
                                <h3 className="font-heading text-xl sm:text-2xl font-bold uppercase text-white tracking-wider sm:tracking-widest">
                                    {editingId ? "Modifica Foto" : "Aggiungi Foto"}
                                </h3>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors shrink-0">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Link Foto (URL)</label>
                                    <input type="url" name="url" value={formData.url} onChange={handleInputChange} required className="w-full bg-black border border-white/10 rounded p-2 text-white focus:border-[#ff5a00] outline-none" placeholder="https://..." />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Titolo / Didascalia</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full bg-black border border-white/10 rounded p-2 text-white focus:border-[#ff5a00] outline-none" placeholder="Es: Vittoria Derby" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Anno / Stagione</label>
                                    <input type="text" name="year" value={formData.year} onChange={handleInputChange} required className="w-full bg-black border border-white/10 rounded p-2 text-white focus:border-[#ff5a00] outline-none" placeholder="Es: 2026" />
                                </div>

                                {formData.url && (
                                    <div className="mt-4 border border-white/10 rounded-lg p-2 bg-black">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 text-center">Anteprima Foto</p>
                                        <img src={formData.url} alt="Preview" className="w-full h-40 object-cover rounded pointer-events-none grayscale opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    </div>
                                )}

                                <div className="flex justify-end space-x-4 pt-6 border-t border-white/10 mt-6">
                                    <button type="button" onClick={handleCloseModal} className="px-6 py-2 border border-white/10 rounded font-bold uppercase tracking-wider text-sm text-gray-400 hover:text-white transition-colors">
                                        Annulla
                                    </button>
                                    <button type="submit" disabled={loading} className="px-6 py-2 bg-[#ff5a00] rounded font-bold uppercase tracking-wider text-sm text-white hover:bg-[#e04e00] transition-colors shadow-lg shadow-[#ff5a00]/20 disabled:opacity-50">
                                        {loading ? "Salvataggio..." : "Salva Foto"}
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
