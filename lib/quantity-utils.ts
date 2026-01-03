/**
 * QUANTITY UTILITIES
 * 
 * Safe utilities for handling quantity operations to prevent
 * negative values and edge cases.
 */

/**
 * Safely decrements a quantity, ensuring it never goes below zero.
 * @param current Current quantity
 * @param decrement Amount to subtract
 * @returns New quantity (minimum 0)
 */
export function safeDecrement(current: number, decrement: number = 1): number {
    return Math.max(0, (current || 0) - decrement);
}

/**
 * Safely increments a quantity.
 * @param current Current quantity
 * @param increment Amount to add
 * @returns New quantity
 */
export function safeIncrement(current: number, increment: number = 1): number {
    return (current || 0) + increment;
}

/**
 * Checks if an item can be decremented by the specified amount.
 * @param current Current quantity
 * @param amount Amount to check
 * @returns True if current >= amount
 */
export function canDecrement(current: number, amount: number = 1): boolean {
    return (current || 0) >= amount;
}

/**
 * Formats a quantity for display with proper fallback.
 * @param quantity Quantity to format
 * @returns Formatted string (e.g., "5" or "0")
 */
export function formatQuantity(quantity: number | undefined | null): string {
    return String(Math.max(0, quantity || 0));
}

/**
 * Validates that a quantity is a positive number.
 * @param quantity Value to validate
 * @returns True if valid positive number
 */
export function isValidQuantity(quantity: unknown): quantity is number {
    return typeof quantity === 'number' && !isNaN(quantity) && quantity >= 0;
}
