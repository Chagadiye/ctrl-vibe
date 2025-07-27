import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6969/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
