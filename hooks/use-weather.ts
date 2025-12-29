
import { useState, useEffect } from 'react';

export type WeatherType = 'sunny' | 'rainy' | 'snowy';

export function useWeather() {
    const [weather, setWeather] = useState<WeatherType>('sunny');

    useEffect(() => {
        // Simple deterministic weather system based on days since epoch
        const updateWeather = () => {
            const now = new Date();
            const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
            const cycle = daysSinceEpoch % 3;

            if (cycle === 0) setWeather('sunny');
            else if (cycle === 1) setWeather('rainy');
            else setWeather('snowy');
        };

        updateWeather();
        // Update every hour just in case
        const interval = setInterval(updateWeather, 1000 * 60 * 60);
        return () => clearInterval(interval);
    }, []);

    const getWeatherName = (type: WeatherType) => {
        switch (type) {
            case 'sunny': return 'Sunny Skies';
            case 'rainy': return 'Nourishing Rain';
            case 'snowy': return 'Snowy Blizzard';
        }
    };

    const getWeatherDescription = (type: WeatherType) => {
        switch (type) {
            case 'sunny': return '+10% Gold from Farms';
            case 'rainy': return '+20% Growth Speed (Passive XP)';
            case 'snowy': return '-25% Move Speed, Higher Critical Drop Rate';
        }
    };

    return { weather, getWeatherName, getWeatherDescription };
}
