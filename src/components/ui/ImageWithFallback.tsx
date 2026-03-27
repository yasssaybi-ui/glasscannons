import React, { useState } from 'react';

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & {
    fallbackSrc?: string;
    containerClassName?: string;
};

export function ImageWithFallback({ src, alt, className, containerClassName, fallbackSrc, ...props }: ImageWithFallbackProps) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
        <div className={`relative w-full h-full overflow-hidden ${containerClassName || ''}`}>
            {/* Loading Skeleton */}
            {!loaded && !error && (
                <div className="absolute inset-0 bg-[#1a1a1a] animate-pulse rounded-full md:rounded-none z-0"></div>
            )}
            
            {/* Actual Image */}
            <img
                src={error ? (fallbackSrc || '/placeholder-player.png') : src}
                alt={alt || "Image"}
                className={`${className || ''} transition-opacity duration-500 ease-in-out z-10 relative ${
                    loaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setLoaded(true)}
                onError={() => {
                    setError(true);
                    setLoaded(true); // Stop the skeleton if it errors out
                }}
                {...props}
            />
        </div>
    );
}
