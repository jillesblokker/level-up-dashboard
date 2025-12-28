/**
 * Alliance Manager
 * Handles logic for alliance streaks and social interactions.
 */

import { Alliance, AllianceStreak } from '@/types/alliances';

export type { Alliance, AllianceStreak } from '@/types/alliances';

export async function checkInToAlliance(allianceId: string): Promise<{ success: boolean; streak?: number; message?: string }> {
    try {
        const res = await fetch('/api/alliance/streak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allianceId })
        });
        const data = await res.json();

        if (!res.ok) {
            return { success: false, message: data.error || 'Failed to check in' };
        }

        if (data.message === 'Already checked in today') {
            return { success: false, message: 'You have already contributed your oath to the alliance today.' };
        }

        return { success: true, streak: data.current_streak };
    } catch (err) {
        console.error("Error checking in to alliance:", err);
        return { success: false, message: 'Network error' };
    }
}

export async function getUserAlliances(userId?: string): Promise<Alliance[]> {
    try {
        const query = userId ? `?userId=${userId}` : '';
        const res = await fetch(`/api/alliance${query}`);
        const data = await res.json();
        if (res.ok) return data || [];
        return [];
    } catch (err) {
        console.error("Error fetching alliances:", err);
        return [];
    }
}

export async function createAlliance(name: string, description: string): Promise<{ success: boolean; alliance?: Alliance; error?: string }> {
    try {
        const res = await fetch('/api/alliance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        });
        const data = await res.json();
        if (res.ok) return { success: true, alliance: data.alliance };
        return { success: false, error: data.error };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function inviteToAlliance(allianceId: string, friendId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch('/api/alliance/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allianceId, friendId })
        });
        const data = await res.json();
        if (res.ok) return { success: true };
        return { success: false, error: data.error };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
