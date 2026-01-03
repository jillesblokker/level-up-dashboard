import { safeDecrement, safeIncrement, canDecrement, formatQuantity, isValidQuantity } from '@/lib/quantity-utils';

describe('Quantity Utils', () => {
    describe('safeDecrement', () => {
        it('should decrement normally when result is positive', () => {
            expect(safeDecrement(5, 1)).toBe(4);
            expect(safeDecrement(10, 3)).toBe(7);
        });

        it('should return 0 when decrement exceeds current', () => {
            expect(safeDecrement(1, 5)).toBe(0);
            expect(safeDecrement(0, 1)).toBe(0);
        });

        it('should handle undefined/null current values', () => {
            expect(safeDecrement(0, 1)).toBe(0);
        });

        it('should default to decrement of 1', () => {
            expect(safeDecrement(5)).toBe(4);
        });
    });

    describe('safeIncrement', () => {
        it('should increment normally', () => {
            expect(safeIncrement(5, 1)).toBe(6);
            expect(safeIncrement(0, 10)).toBe(10);
        });

        it('should default to increment of 1', () => {
            expect(safeIncrement(5)).toBe(6);
        });
    });

    describe('canDecrement', () => {
        it('should return true when sufficient quantity exists', () => {
            expect(canDecrement(5, 1)).toBe(true);
            expect(canDecrement(5, 5)).toBe(true);
        });

        it('should return false when insufficient quantity', () => {
            expect(canDecrement(0, 1)).toBe(false);
            expect(canDecrement(3, 5)).toBe(false);
        });
    });

    describe('formatQuantity', () => {
        it('should format positive numbers correctly', () => {
            expect(formatQuantity(5)).toBe('5');
            expect(formatQuantity(100)).toBe('100');
        });

        it('should handle zero and negative', () => {
            expect(formatQuantity(0)).toBe('0');
            expect(formatQuantity(-5)).toBe('0');
        });

        it('should handle undefined/null', () => {
            expect(formatQuantity(undefined)).toBe('0');
            expect(formatQuantity(null)).toBe('0');
        });
    });

    describe('isValidQuantity', () => {
        it('should validate positive numbers', () => {
            expect(isValidQuantity(5)).toBe(true);
            expect(isValidQuantity(0)).toBe(true);
        });

        it('should reject negative numbers', () => {
            expect(isValidQuantity(-1)).toBe(false);
        });

        it('should reject non-numbers', () => {
            expect(isValidQuantity('5')).toBe(false);
            expect(isValidQuantity(null)).toBe(false);
            expect(isValidQuantity(undefined)).toBe(false);
            expect(isValidQuantity(NaN)).toBe(false);
        });
    });
});

describe('Inventory Count Merge Logic', () => {
    // Simulating the mergedItems logic from kingdom-client.tsx
    const simulateMerge = (storedItems: any[], localItems: any[]) => {
        const items = [...storedItems];
        localItems.forEach(localItem => {
            const localName = localItem.name?.toLowerCase();
            const idx = items.findIndex(i => {
                if (i.id === localItem.id) return true;
                if (i.id.toLowerCase() === localItem.id.toLowerCase()) return true;
                if (i.id === `${localItem.id}-item`) return true;
                if (localName && i.name?.toLowerCase() === localName) return true;
                return false;
            });

            if (idx >= 0) {
                const existing = items[idx];
                const newQty = (existing?.quantity || 0) + localItem.quantity;
                items[idx] = { ...existing, quantity: newQty };
            } else {
                items.push(localItem);
            }
        });
        return items;
    };

    it('should merge by exact ID match', () => {
        const stored = [{ id: 'house', name: 'House', quantity: 4 }];
        const local = [{ id: 'house', quantity: -1 }];
        const result = simulateMerge(stored, local);
        expect(result[0].quantity).toBe(3);
    });

    it('should merge by case-insensitive ID match', () => {
        const stored = [{ id: 'House', name: 'House', quantity: 4 }];
        const local = [{ id: 'house', quantity: -1 }];
        const result = simulateMerge(stored, local);
        expect(result[0].quantity).toBe(3);
    });

    it('should merge by name match when IDs differ', () => {
        const stored = [{ id: 'uuid-123', name: 'House', quantity: 4 }];
        const local = [{ id: 'house', name: 'House', quantity: -1 }];
        const result = simulateMerge(stored, local);
        expect(result[0].quantity).toBe(3);
    });

    it('should NOT create separate entries for the same item', () => {
        const stored = [{ id: 'uuid-123', name: 'House', quantity: 4 }];
        const local = [{ id: 'house', name: 'House', quantity: -1 }];
        const result = simulateMerge(stored, local);
        expect(result.length).toBe(1);
    });

    it('should handle multiple placements correctly', () => {
        const stored = [{ id: 'house', name: 'House', quantity: 4 }];
        const local = [
            { id: 'house', quantity: -1 },
            { id: 'house', quantity: -1 },
        ];
        // Apply firstlocal item
        let result = simulateMerge(stored, [local[0]]);
        expect(result[0].quantity).toBe(3);
        // Apply second
        result = simulateMerge(result, [local[1]]);
        expect(result[0].quantity).toBe(2);
    });
});
