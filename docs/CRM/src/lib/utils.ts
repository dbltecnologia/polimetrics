
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const COLORS = [
    '#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6',
    '#14b8a6', '#ec4899', '#f59e0b', '#6366f1', '#d946ef'
];

// Simple hash function to get a consistent index for a string
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getTagColor(tagText: string): string {
  if (!tagText) return '#64748b'; // a default color for safety
  const hash = simpleHash(tagText.toLowerCase());
  const index = hash % COLORS.length;
  return COLORS[index];
}

export const getStatusColor = (status: string) => {
    switch (status) {
        case "Novo": return "bg-gray-200 text-gray-800";
        case "Em Follow-up": return "bg-blue-200 text-blue-800";
        case "Reunião Agendada": return "bg-yellow-200 text-yellow-800";
        case "Ganhamos": return "bg-green-200 text-green-800";
        case "Perdemos": return "bg-red-200 text-red-800";
        default: return "bg-gray-100 text-gray-600";
    }
}
