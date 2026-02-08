/**
 * Tests for Date Utilities
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
    formatDate,
    getToday,
    getYesterday,
    getDaysAgo,
    isSameDay,
    isToday,
    isPastDate,
    isFutureDate,
    daysDifference,
    formatRelativeTime,
    isStreakValid,
    getPeriodKey,
    getDateRange,
} from '@/lib/date-utils'

// Mock the current date for consistent testing
const mockDate = new Date('2024-03-15T12:00:00.000Z')

describe('Date Utilities', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        jest.setSystemTime(mockDate)
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('formatDate', () => {
        it('should return null for null or undefined input', () => {
            expect(formatDate(null)).toBeNull()
            expect(formatDate(undefined)).toBeNull()
        })

        it('should format a Date object', () => {
            const result = formatDate(new Date('2024-03-15'))
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        })

        it('should pass through YYYY-MM-DD strings', () => {
            expect(formatDate('2024-03-15')).toBe('2024-03-15')
        })

        it('should extract date from ISO datetime strings', () => {
            expect(formatDate('2024-03-15T12:30:00.000Z')).toBe('2024-03-15')
        })
    })

    describe('getToday', () => {
        it('should return today in YYYY-MM-DD format', () => {
            const result = getToday()
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        })
    })

    describe('getYesterday', () => {
        it('should return yesterday in YYYY-MM-DD format', () => {
            const result = getYesterday()
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        })
    })

    describe('getDaysAgo', () => {
        it('should return a date N days ago', () => {
            const result = getDaysAgo(7)
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        })
    })

    describe('isSameDay', () => {
        it('should return true for same dates', () => {
            expect(isSameDay('2024-03-15', '2024-03-15')).toBe(true)
        })

        it('should return true for same date with different formats', () => {
            expect(isSameDay('2024-03-15', '2024-03-15T12:00:00.000Z')).toBe(true)
        })

        it('should return false for different dates', () => {
            expect(isSameDay('2024-03-15', '2024-03-16')).toBe(false)
        })
    })

    describe('isToday', () => {
        it('should return true for today', () => {
            const today = getToday()
            expect(isToday(today)).toBe(true)
        })

        it('should return false for other dates', () => {
            expect(isToday('2024-01-01')).toBe(false)
        })
    })

    describe('isPastDate', () => {
        it('should return true for past dates', () => {
            expect(isPastDate('2024-01-01')).toBe(true)
        })

        it('should return false for today', () => {
            expect(isPastDate(getToday())).toBe(false)
        })

        it('should return false for future dates', () => {
            expect(isPastDate('2025-12-31')).toBe(false)
        })
    })

    describe('isFutureDate', () => {
        it('should return true for future dates', () => {
            expect(isFutureDate('2025-12-31')).toBe(true)
        })

        it('should return false for today', () => {
            expect(isFutureDate(getToday())).toBe(false)
        })

        it('should return false for past dates', () => {
            expect(isFutureDate('2024-01-01')).toBe(false)
        })
    })

    describe('daysDifference', () => {
        it('should return 0 for same date', () => {
            expect(daysDifference('2024-03-15', '2024-03-15')).toBe(0)
        })

        it('should return positive difference', () => {
            expect(daysDifference('2024-03-15', '2024-03-20')).toBe(5)
        })

        it('should return absolute difference', () => {
            expect(daysDifference('2024-03-20', '2024-03-15')).toBe(5)
        })
    })

    describe('isStreakValid', () => {
        it('should return false for null date', () => {
            expect(isStreakValid(null)).toBe(false)
        })

        it('should return true for today', () => {
            expect(isStreakValid(getToday())).toBe(true)
        })

        it('should return true for yesterday', () => {
            expect(isStreakValid(getYesterday())).toBe(true)
        })

        it('should return false for older dates', () => {
            expect(isStreakValid(getDaysAgo(2))).toBe(false)
        })
    })

    describe('getPeriodKey', () => {
        it('should return date for day period', () => {
            expect(getPeriodKey('2024-03-15', 'day')).toBe('2024-03-15')
        })

        it('should return year-month for month period', () => {
            expect(getPeriodKey('2024-03-15', 'month')).toBe('2024-03')
        })

        it('should return year for year period', () => {
            expect(getPeriodKey('2024-03-15', 'year')).toBe('2024')
        })

        it('should return week key for week period', () => {
            const result = getPeriodKey('2024-03-15', 'week')
            expect(result).toMatch(/^\d{4}-W\d{2}$/)
        })
    })

    describe('getDateRange', () => {
        it('should return array of dates between start and end', () => {
            const result = getDateRange('2024-03-10', '2024-03-15')
            expect(result).toHaveLength(6)
            expect(result[0]).toBe('2024-03-10')
            expect(result[5]).toBe('2024-03-15')
        })

        it('should return single date for same start and end', () => {
            const result = getDateRange('2024-03-15', '2024-03-15')
            expect(result).toHaveLength(1)
            expect(result[0]).toBe('2024-03-15')
        })
    })
})
