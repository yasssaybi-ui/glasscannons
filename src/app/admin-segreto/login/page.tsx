"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Lock, Mail } from "lucide-react";

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const { signInWithEmailAndPassword } = await import("firebase/auth");
            const { auth } = await import("@/lib/firebase");
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/admin-segreto/dashboard");
        } catch (err: any) {
            setError("Email o password non validi.");
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
            <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbb6b4923e?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center grayscale" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#0f0f0f] border border-white/10 p-8 rounded-lg shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <img src="/logo.png" alt="Glass Cannons Logo" className="w-24 h-24 object-contain mb-4 drop-shadow-lg" />
                    <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-white">Area Admin</h1>
                    <p className="text-gray-500 text-sm mt-2">Accedi al pannello di gestione</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-md bg-black text-white focus:outline-none focus:ring-1 focus:ring-[#ff5a00] focus:border-[#ff5a00] sm:text-sm transition-colors"
                                placeholder="admin@glasscannons.it"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-md bg-black text-white focus:outline-none focus:ring-1 focus:ring-[#ff5a00] focus:border-[#ff5a00] sm:text-sm transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold uppercase tracking-widest text-white bg-[#ff5a00] hover:bg-[#e04e00] focus:outline-none transition-colors mt-8"
                    >
                        Accedi
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <a href="/" className="text-sm text-gray-500 hover:text-white transition-colors">Torna al sito pubblico</a>
                </div>
            </motion.div>
        </div>
    );
}
