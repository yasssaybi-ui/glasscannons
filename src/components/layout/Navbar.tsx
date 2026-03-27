"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Shield } from "lucide-react";

const links = [
    { name: "Home", href: "/" },
    { name: "Rosa", href: "/squadra" },
    { name: "Calendario", href: "/calendario" },
    { name: "News", href: "/news" },
    { name: "Classifica", href: "/classifica" },
    { name: "Risultati", href: "/risultati" },
    { name: "Galleria", href: "/galleria" },
];

function NavLink({ link, isActive }: { link: typeof links[0], isActive: boolean }) {
    return (
        <Link
            href={link.href}
            className={`relative font-heading uppercase tracking-wider text-sm transition-colors hover:text-[#ff5a00] ${isActive ? "text-[#ff5a00]" : "text-gray-300"
                }`}
        >
            {link.name}
            {isActive && (
                <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#ff5a00]"
                    initial={false}
                />
            )}
        </Link>
    );
}

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const leftLinks = links.slice(0, 4);
    const rightLinks = links.slice(4);

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${scrolled ? "bg-black/90 backdrop-blur-md border-b border-white/10" : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Desktop Left Navigation */}
                    <nav className="hidden md:flex flex-1 items-center space-x-8">
                        {leftLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <NavLink key={link.name} link={link} isActive={isActive} />
                            );
                        })}
                    </nav>

                    {/* Logo - Always centered on desktop, handle mobile separately if needed */}
                    <div className="flex-shrink-0 flex items-center justify-center">
                        <Link href="/" className="flex items-center group">
                            <img src="/logo.png" alt="Glass Cannons Logo" className="w-14 h-14 object-contain group-hover:scale-110 transition-transform" />
                        </Link>
                    </div>

                    {/* Desktop Right Navigation */}
                    <nav className="hidden md:flex flex-1 items-center justify-end space-x-8">
                        {rightLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <NavLink key={link.name} link={link} isActive={isActive} />
                            );
                        })}
                    </nav>

                    {/* Mobile Menu Button - Positioned on right */}
                    <div className="md:hidden flex-1 flex justify-end">
                        <button
                            className="text-white hover:text-[#ff5a00] transition-colors"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-black border-b border-white/10 overflow-hidden"
                    >
                        <div className="px-4 py-4 space-y-2">
                            {links.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`block px-3 py-2 rounded-md font-heading uppercase tracking-wider ${isActive
                                            ? "bg-[#ff5a00]/10 text-[#ff5a00]"
                                            : "text-gray-300 hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
