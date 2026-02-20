
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely serializes data by converting it to JSON and back.
 * This removes any non-serializable parts of an object, such as functions or complex class instances,
 * making it safe to pass from Server Components to Client Components.
 * @param data The data to serialize.
 * @returns A plain, serializable version of the data.
 */
export function safeSerialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
