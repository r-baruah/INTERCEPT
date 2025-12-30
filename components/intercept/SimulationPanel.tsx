'use client';

import { useState, useEffect } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { SpaceWeatherData } from '@/types/nasa';
import { mapSpaceWeatherToAudio } from '@/lib/audio/sonification';

/**
 * Simulation Panel - "The God Mode"
 * Hidden interface to force specific states for demo purposes.
 * Trigger: Ctrl + Shift + S
 */
export function SimulationPanel() {
    const [isVisible, setIsVisible] = useState(false);
    const { overrideSpaceWeatherData, updateAudioParams, setDemoMode, setKpIndex, setWindSpeed } = useAudioStore();

    // Keyboard Shortcut Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                setIsVisible(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const runSimulation = (scenario: 'nominal' | 'storm' | 'extremis') => {
        let mockData: SpaceWeatherData;
        const now = new Date().toISOString();

        switch (scenario) {
            case 'nominal':
                mockData = {
                    solar_wind: { speed: 350, density: 4.5, temperature: 50000, timestamp: now },
                    geomagnetic: { kp_index: 2, storm_active: false, storm_level: 'None', timestamp: now },
                    flares: [],
                    data_source: 'demo',
                    timestamp: now
                };
                break;

            case 'storm':
                mockData = {
                    solar_wind: { speed: 650, density: 15.0, temperature: 150000, timestamp: now },
                    geomagnetic: { kp_index: 6, storm_active: true, storm_level: 'Moderate', timestamp: now },
                    flares: [{
                        id: `sim_flare_${Date.now()}`,
                        flareClass: 'M5.4',
                        classType: 'M',
                        magnitude: 5.4,
                        timestamp: now,
                        sourceRegion: 'N14E22',
                        peakTime: now
                    }],
                    data_source: 'demo',
                    timestamp: now
                };
                break;

            case 'extremis':
                mockData = {
                    solar_wind: { speed: 950, density: 45.0, temperature: 500000, timestamp: now },
                    geomagnetic: { kp_index: 8.6, storm_active: true, storm_level: 'Severe', timestamp: now },
                    flares: [{
                        id: `sim_flare_x_${Date.now()}`,
                        flareClass: 'X2.1',
                        classType: 'X',
                        magnitude: 2.1,
                        timestamp: now,
                        sourceRegion: 'N14E22',
                        peakTime: now
                    }],
                    data_source: 'demo',
                    timestamp: now
                };
                break;
        }

        // 1. Enable demo mode to stop real polling
        setDemoMode(true);

        // 2. Inject Data
        overrideSpaceWeatherData(mockData);

        // 3. Also update direct engine controls for immediate effect
        setKpIndex(mockData.geomagnetic.kp_index);
        setWindSpeed(mockData.solar_wind.speed);

        // 4. Update Audio Parameters
        const params = mapSpaceWeatherToAudio(mockData);
        updateAudioParams(params);

        console.log(`[SIMULATION] Running scenario: ${scenario} (Kp=${mockData.geomagnetic.kp_index}, Wind=${mockData.solar_wind.speed})`);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] bg-black border border-red-500 p-6 shadow-[0_0_50px_rgba(255,0,0,0.3)] min-w-[300px]">
            <div className="font-mono text-xs text-red-500 tracking-[0.3em] mb-6 text-center border-b border-red-900 pb-2">
                SIMULATION OVERRIDE
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => runSimulation('nominal')}
                    className="w-full py-3 border border-zinc-800 hover:bg-zinc-900 hover:border-emerald-500 hover:text-emerald-500 font-mono text-xs transition-colors"
                >
                    SCENARIO: NOMINAL
                    <span className="block text-[10px] text-zinc-500 mt-1">Kp=2, Wind=350km/s</span>
                </button>
                <button
                    onClick={() => runSimulation('storm')}
                    className="w-full py-3 border border-zinc-800 hover:bg-zinc-900 hover:border-amber-500 hover:text-amber-500 font-mono text-xs transition-colors"
                >
                    SCENARIO: STORM (G2)
                    <span className="block text-[10px] text-zinc-500 mt-1">Kp=6, Wind=650km/s, M5.4 Flare</span>
                </button>
                <button
                    onClick={() => runSimulation('extremis')}
                    className="w-full py-3 border border-zinc-800 hover:bg-red-900/20 hover:border-red-500 hover:text-red-500 font-mono text-xs transition-colors animate-pulse-subtle"
                >
                    SCENARIO: CARRINGTON (X-CLASS)
                    <span className="block text-[10px] text-zinc-500 mt-1">Kp=8.6, Wind=950km/s, X2.1 Flare</span>
                </button>
            </div>

            <div className="mt-6 text-center">
                <button
                    onClick={() => setIsVisible(false)}
                    className="font-mono text-[10px] text-zinc-600 hover:text-white"
                >
                    CLOSE CONSOLE
                </button>
            </div>
        </div>
    );
}
