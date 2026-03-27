"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Calendar, Trophy, Camera, LogOut, LayoutTemplate, Newspaper, Menu, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import PlayersManager from "@/components/admin/PlayersManager";
import MatchesManager from "@/components/admin/MatchesManager";
import GalleryManager from "@/components/admin/GalleryManager";
import StandingsManager from "@/components/admin/StandingsManager";
import NewsManager from "@/components/admin/NewsManager";

export default function AdminDashboard() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState("La Rosa");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
            } else {
                router.push("/admin-segreto/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    if (!isAuthenticated) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="text-[#ff5a00] font-heading text-2xl animate-pulse">CARICAMENTO...</div></div>;

    const tabs = [
        { name: "La Rosa", icon: <Users className="w-5 h-5" /> },
        { name: "Partite", icon: <Calendar className="w-5 h-5" /> },
        { name: "News", icon: <Newspaper className="w-5 h-5" /> },
        { name: "Galleria", icon: <Camera className="w-5 h-5" /> },
        { name: "Classifica", icon: <Trophy className="w-5 h-5" /> },
    ];

    return (
        <div className="flex h-screen bg-black overflow-hidden relative z-50">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0a] border-b border-white/10 absolute top-0 left-0 right-0 z-50">
                <div className="flex items-center space-x-2">
                    <img src="/logo.png" alt="Glass Cannons Logo" className="w-8 h-8 object-contain" />
                    <span className="font-heading font-bold uppercase tracking-widest text-white text-xs">Admin Panel</span>
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
                    {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition duration-200 ease-in-out z-50 w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col pt-16 md:pt-0`}>
                <div className="hidden md:flex p-6 items-center space-x-3 border-b border-white/10 mb-4">
                    <img src="/logo.png" alt="Glass Cannons Logo" className="w-10 h-10 object-contain" />
                    <span className="font-heading text-lg font-bold uppercase tracking-widest text-white leading-tight">
                        Admin <br /><span className="text-[#ff5a00]">Panel</span>
                    </span>
                </div>

                <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => { setActiveTab(tab.name); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${activeTab === tab.name
                                ? "bg-[#ff5a00] text-white shadow-[0_0_20px_rgba(255,90,0,0.3)]"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            {tab.icon}
                            <span className="font-bold uppercase text-xs tracking-widest">{tab.name}</span>
                        </button>
                    ))}

                    <div className="pt-4 mt-4 border-t border-white/10">
                        <a href="/?edit=true" target="_blank" rel="noopener noreferrer" className="w-full flex items-center space-x-4 px-4 py-3 rounded-lg text-[#ff5a00] bg-[#ff5a00]/10 hover:bg-[#ff5a00]/20 transition-colors cursor-pointer border border-[#ff5a00]/30 shadow-lg shadow-[#ff5a00]/10">
                            <LayoutTemplate className="w-5 h-5" />
                            <span className="font-bold uppercase text-xs tracking-widest">Sito Live (Editor)</span>
                        </a>
                    </div>
                </nav>

                <div className="p-6 border-t border-white/10">
                    <button onClick={handleLogout} className="flex items-center justify-center w-full px-4 py-3 space-x-3 text-gray-400 hover:text-red-500 transition-colors cursor-pointer group">
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Esci</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative overflow-x-hidden overflow-y-auto bg-[#000] pt-16 md:pt-0">
                {activeTab === "La Rosa" && <PlayersManager />}
                {activeTab === "Partite" && <MatchesManager />}
                {activeTab === "News" && <NewsManager />}
                {activeTab === "Galleria" && <GalleryManager />}
                {activeTab === "Classifica" && <StandingsManager />}
            </div>
        </div>
    );
}
