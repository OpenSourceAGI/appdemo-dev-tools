/**
 * @file utils.ts
 * @description General utility functions for the documentation site.
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS class names using `clsx` and `tailwind-merge`,
 * resolving conflicts between utility classes.
 * @param inputs - Class values (strings, arrays, objects, etc.).
 * @returns A single merged class name string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
