import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function vibrate(duration: number = 50) {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    navigator.vibrate(duration)
  }
}
