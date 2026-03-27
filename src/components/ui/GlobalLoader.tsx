import React from 'react';

export function GlobalLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-black w-full z-[1000]">
            <div className="relative w-24 h-24 md:w-32 md:h-32 mb-8 animate-[spin_3s_linear_infinite] drop-shadow-[0_0_20px_rgba(255,90,0,0.5)]">
                <img 
                    src="/logo.png" 
                    alt="Caricamento in corso" 
                    className="w-full h-full object-contain"
                />
            </div>
            <div className="font-heading text-[#ff5a00] font-black uppercase tracking-[0.3em] text-lg md:text-xl animate-pulse text-center px-4">
                Caricamento
            </div>
        </div>
    );
}
