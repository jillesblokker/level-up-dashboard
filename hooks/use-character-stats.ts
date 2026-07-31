"use client"

import { useState, useEffect } from "react"
import { getCharacterStats, updateCharacterStats as updateStatsService, CharacterStats } from "@/lib/character-stats-service"

export function useCharacterStats() {
    const [stats, setStats] = useState<CharacterStats>(getCharacterStats());

    useEffect(() => {
        // Initial load from local cache
        setStats(getCharacterStats());

        // Immediately fetch fresh stats from server and merge so user level stays in sync across browsers
        const { fetchFreshCharacterStats } = require("@/lib/character-stats-service");
        fetchFreshCharacterStats().catch(() => {});

        // Listen for updates
        const handleUpdate = () => {
            setStats({ ...getCharacterStats() });
        };

        window.addEventListener('character-stats-update', handleUpdate);

        return () => {
            window.removeEventListener('character-stats-update', handleUpdate);
        };
    }, []);

    const updateStats = (updates: Partial<CharacterStats>, source?: string) => {
        updateStatsService(updates, source);
    };

    return {
        stats,
        updateCharacterStats: updateStats,
        // Helper accessors
        level: stats.level,
        gold: stats.gold,
        experience: stats.experience,
        displayName: stats.display_name,
        title: stats.title
    };
}

// Re-export specific update function for non-hook usage if needed, though usually hooked is better for UI
export const updateCharacterStats = updateStatsService;
