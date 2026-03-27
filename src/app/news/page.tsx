"use client";

import NewsGrid from "@/components/news/NewsGrid";
import { motion } from "framer-motion";
import { LiveEditor } from "@/components/admin/LiveEditor";
import { Editable } from "@/components/ui/Editable";

export default function NewsPage() {
    return (
        <LiveEditor pageId="news">
        <div className="min-h-screen bg-black pt-20">
            {/* Header Hero */}
            <section className="relative py-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] pointer-events-none">
                    <div className="absolute top-[-10%] left-[20%] w-[30%] h-[50%] bg-[#ff5a00]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[20%] right-[20%] w-[20%] h-[40%] bg-[#ff5a00]/5 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-4"
                    >
                        <Editable as="span" blockId="news_header" field="subtitle" initialValue="Glass Cannons News" className="text-[#ff5a00] font-bold uppercase tracking-[0.5em] text-[10px] md:text-sm" />
                        <h1 className="text-white font-heading text-5xl md:text-8xl font-black uppercase tracking-tighter italic whitespace-nowrap flex justify-center gap-4">
                            <Editable as="span" blockId="news_header" field="title1" initialValue="Ultime" />
                            <Editable as="span" blockId="news_header" field="title2" initialValue="Notizie" className="text-[#ff5a00]" />
                        </h1>
                        <Editable as="p" blockId="news_header" field="description" initialValue="Segui ogni colpo, ogni gol e ogni momento della stagione dei Glass Cannons." className="max-w-2xl mx-auto text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs" />
                    </motion.div>
                </div>
            </section>

            {/* Main News Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <NewsGrid />
            </main>
        </div>
        </LiveEditor>
    );
}
