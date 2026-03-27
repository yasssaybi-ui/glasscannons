"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Folder, ChevronLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { LiveEditor } from "@/components/admin/LiveEditor";
import { Editable } from "@/components/ui/Editable";
import { GlobalLoader } from "@/components/ui/GlobalLoader";

type Photo = {
    id: string;
    url: string;
    title: string;
    year: string;
};

export default function Galleria() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const q = query(collection(db, "gallery"), orderBy("year", "desc"));
                const querySnapshot = await getDocs(q);
                const galleryData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as any)
                })) as Photo[];
                setPhotos(galleryData);
            } catch (error) {
                console.error("Error fetching gallery:", error);
            }
            setLoading(false);
        };

        fetchGallery();
    }, []);

    // Group photos by year
    const groupedPhotos = photos.reduce((acc, photo) => {
        if (!acc[photo.year]) acc[photo.year] = [];
        acc[photo.year].push(photo);
        return acc;
    }, {} as Record<string, Photo[]>);

    // Get sorted years
    const sortedYears = Object.keys(groupedPhotos).sort((a, b) => Number(b) - Number(a));

    return (
        <LiveEditor pageId="galleria">
        <div className="min-h-screen bg-black py-16 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="font-heading text-3xl sm:text-5xl md:text-7xl font-bold uppercase text-white tracking-widest mb-4 flex flex-wrap justify-center gap-2 sm:gap-4">
                        <Editable as="span" blockId="galleria_header" field="title1" initialValue="La" />
                        <Editable as="span" blockId="galleria_header" field="title2" initialValue="Galleria" className="text-[#ff5a00]" />
                    </h1>
                    <Editable as="p" blockId="galleria_header" field="description" initialValue="I momenti più iconici della nostra storia calcistica, anno per anno." className="text-gray-400 max-w-2xl mx-auto text-lg" />
                    <div className="w-24 h-1 bg-[#ff5a00] mx-auto mt-8 rounded-full" />
                </motion.div>

                {loading ? (
                    <GlobalLoader />
                ) : sortedYears.length === 0 ? (
                    <div className="text-center text-gray-500 py-12 border border-white/10 rounded-lg bg-[#0f0f0f]">
                        <p className="font-heading text-xl uppercase tracking-wider mb-2">Galleria Vuota</p>
                        <p>Il fotografo ufficiale deve ancora caricare le foto.</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {!selectedYear ? (
                            // Folders View
                            <motion.div
                                key="folders"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                            >
                                {sortedYears.map((year) => (
                                    <motion.div
                                        key={year}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSelectedYear(year)}
                                        className="bg-[#0f0f0f] border border-white/10 hover:border-[#ff5a00]/50 rounded-lg p-8 cursor-pointer flex flex-col items-center justify-center group transition-colors shadow-lg"
                                    >
                                        <div className="relative mb-4">
                                            <Folder className="w-24 h-24 text-gray-600 group-hover:text-[#ff5a00] transition-colors" />
                                            <div className="absolute inset-0 flex items-center justify-center mt-2 font-bold text-black text-sm">
                                                {groupedPhotos[year].length}
                                            </div>
                                        </div>
                                        <h2 className="font-heading text-3xl font-bold uppercase text-white tracking-widest mb-2">{year}</h2>
                                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors">
                                            {groupedPhotos[year].length} Foto
                                        </p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            // Photos View
                            <motion.div
                                key="photos"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="mb-20"
                            >
                                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                                    <div className="flex items-center space-x-4">
                                        <Camera className="w-8 h-8 text-[#ff5a00]" />
                                        <h2 className="font-heading text-4xl font-bold uppercase text-white tracking-widest">Stagione {selectedYear}</h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedYear(null)}
                                        className="flex items-center space-x-2 text-gray-400 hover:text-[#ff5a00] transition-colors font-bold uppercase tracking-wider text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span>Indietro</span>
                                    </button>
                                </div>

                                <motion.div
                                    initial="hidden"
                                    animate="show"
                                    variants={{
                                        show: { transition: { staggerChildren: 0.1 } }
                                    }}
                                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                                >
                                    {groupedPhotos[selectedYear].map((photo) => (
                                        <motion.div
                                            key={photo.id}
                                            variants={{
                                                hidden: { opacity: 0, scale: 0.9 },
                                                show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } }
                                            }}
                                            className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg bg-[#0f0f0f] border border-white/5 hover:border-[#ff5a00]/50 transition-colors"
                                            onClick={() => setSelectedImage(photo.url)}
                                        >
                                            <img
                                                src={photo.url}
                                                alt={photo.title}
                                                className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-end p-4">
                                                <p className="text-white font-bold uppercase tracking-wider text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    {photo.title}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-12 cursor-pointer"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            className="absolute top-6 right-6 text-white hover:text-[#ff5a00] transition-colors p-2 bg-black/50 rounded-full"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            src={selectedImage}
                            alt="Immagine Ingrandita"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        </LiveEditor>
    );
}
