/**
 * Date Utilities
 * 
 * Standardized date handling for the application.
 * Uses Netherlands timezone (Europe/Amsterdam) as the default for consistency.
 */

// Default timezone for the app
export const APP_TIMEZONE = 'Europe/Amsterdam';

// Formatters
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-NL', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
});

const shortDateFormatter = new Intl.DateTimeFormat('en-NL', {
    timeZone: APP_TIMEZONE,
    month: 'short',
    day: 'numeric'
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto'
});

/**
 * Format a date to YYYY-MM-DD in the app's timezone
 */
export function formatDate(input?: Date | string | null): string | null {
    if (!input) return null;

    if (typeof input === 'string') {
        // If already in YYYY-MM-DD format, return as is
        const normalized = input.includes('T') ? (input.split('T')[0] ?? input) : input;
        if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
            return normalized;
        }

        // Try to parse and format
        const parsed = new Date(input);
        if (!Number.isNaN(parsed.getTime())) {
            return dateFormatter.format(parsed);
        }

        return normalized;
    }

    return dateFormatter.format(input);
}

/**
 * Get today's date in YYYY-MM-DD format in the app's timezone
 */
export function getToday(): string {
    return dateFormatter.format(new Date());
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export function getYesterday(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateFormatter.format(yesterday);
}

/**
 * Get a date N days ago in YYYY-MM-DD format
 */
export function getDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return dateFormatter.format(date);
}

/**
 * Get the start of the current week (Monday)
 */
export function getStartOfWeek(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is start of week
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    return dateFormatter.format(monday);
}

/**
 * Get the start of the current month
 */
export function getStartOfMonth(): string {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return dateFormatter.format(firstDay);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
    return formatDate(date1) === formatDate(date2);
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
    return formatDate(date) === getToday();
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date | string): boolean {
    const formatted = formatDate(date);
    if (!formatted) return false;
    return formatted < getToday();
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
    const formatted = formatDate(date);
    if (!formatted) return false;
    return formatted > getToday();
}

/**
 * Get the difference in days between two dates
 */
export function daysDifference(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format a date/time for display
 */
export function formatDateTime(input: Date | string): string {
    const date = typeof input === 'string' ? new Date(input) : input;
    return dateTimeFormatter.format(date);
}

/**
 * Format a date in short format (e.g., "Jan 15")
 */
export function formatShortDate(input: Date | string): string {
    const date = typeof input === 'string' ? new Date(input) : input;
    return shortDateFormatter.format(date);
}

/**
 * Format a relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.round(diffMs / (1000 * 60));

    if (Math.abs(diffDays) >= 1) {
        return relativeTimeFormatter.format(diffDays, 'day');
    }
    if (Math.abs(diffHours) >= 1) {
        return relativeTimeFormatter.format(diffHours, 'hour');
    }
    return relativeTimeFormatter.format(diffMinutes, 'minute');
}

/**
 * Get the day of week name
 */
export function getDayOfWeek(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en', {
        weekday: 'long',
        timeZone: APP_TIMEZONE
    }).format(d);
}

/**
 * Parse a date string safely
 */
export function parseDate(input: string): Date | null {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Check if a streak is still valid (completed yesterday or today)
 */
export function isStreakValid(lastCompletedDate: Date | string | null): boolean {
    if (!lastCompletedDate) return false;
    const formatted = formatDate(lastCompletedDate);
    if (!formatted) return false;
    return formatted === getToday() || formatted === getYesterday();
}

/**
 * Get the period key for a date (for grouping by period)
 */
export function getPeriodKey(
    date: Date | string,
    period: 'day' | 'week' | 'month' | 'year'
): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    switch (period) {
        case 'day':
            return formatDate(d) || '';
        case 'week':
            // Get ISO week number
            const startOfYear = new Date(d.getFullYear(), 0, 1);
            const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
            const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
            return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        case 'month':
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        case 'year':
            return String(d.getFullYear());
    }
}

/**
 * Create a date range array
 */
export function getDateRange(startDate: Date | string, endDate: Date | string): string[] {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const dates: string[] = [];

    const current = new Date(start);
    while (current <= end) {
        const formatted = formatDate(current);
        if (formatted) dates.push(formatted);
        current.setDate(current.getDate() + 1);
    }

    return dates;
}
