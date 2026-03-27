import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function normalizeDate(date: any): Date {
    if (!date) return new Date();
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date.toDate === 'function') return date.toDate();
    if (typeof date === 'string') return new Date(date);
    if (date instanceof Date) return date;
    if (date && typeof date === 'object' && 'seconds' in date) {
        return new Timestamp(date.seconds, date.nanoseconds || 0).toDate();
    }
    return new Date();
}
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')    // Remove all non-word chars
        .replace(/--+/g, '-')       // Replace multiple - with single -
        .replace(/^-+/, '')         // Trim - from start of text
        .replace(/-+$/, '');        // Trim - from end of text
}
