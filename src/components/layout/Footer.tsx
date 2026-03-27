import Link from "next/link";
import { Shield, Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black border-t border-white/10 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center space-x-2 mb-4 group inline-flex">
                            <img src="/logo.png" alt="Glass Cannons Logo" className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />
                            <span className="font-heading text-2xl font-bold tracking-wider text-white">
                                GLASS <span className="text-[#ff5a00]">CANNONS</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 max-w-sm">
                            Una squadra costruita per dominare. Potenza esplosiva in attacco, impenetrabile in difesa.
                            Siamo i Glass Cannons.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-heading text-lg font-bold mb-4 text-white">Link Rapidi</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link href="/squadra" className="hover:text-[#ff5a00] transition-colors">La Rosa</Link></li>
                            <li><Link href="/calendario" className="hover:text-[#ff5a00] transition-colors">Calendario</Link></li>
                            <li><Link href="/classifica" className="hover:text-[#ff5a00] transition-colors">Classifica</Link></li>
                            <li><Link href="/risultati" className="hover:text-[#ff5a00] transition-colors">Risultati</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-heading text-lg font-bold mb-4 text-white">Seguici</h3>
                        <div className="flex space-x-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#ff5a00] hover:text-white transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#ff5a00] hover:text-white transition-all">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#ff5a00] hover:text-white transition-all">
                                <Facebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-500 text-sm mb-4 md:mb-0">
                        &copy; {new Date().getFullYear()} <Link href="/admin-segreto/login" className="hover:text-white transition-colors cursor-default">Glass Cannons FC</Link>. Tutti i diritti riservati.
                    </p>
                    <div className="flex space-x-4 text-sm text-gray-500">
                        {/* Hidden admin links can also go here */}
                    </div>
                </div>
            </div>
        </footer>
    );
}
