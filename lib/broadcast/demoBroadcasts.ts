/**
 * Demo Broadcast Generator
 * 
 * Generates simulated broadcasts for testing and demo purposes
 */

import { BroadcastMessage, BroadcastType, BroadcastPriority, BroadcastTone } from '@/types/broadcast';

const generateId = () => 'demo-' + Math.random().toString(36).substring(2, 9);

// Pre-defined demo broadcasts
export const DEMO_BROADCASTS: Omit<BroadcastMessage, 'id' | 'timestamp'>[] = [
    {
        type: BroadcastType.SYSTEM,
        priority: BroadcastPriority.NORMAL,
        tone: BroadcastTone.NEUTRAL,
        headline: 'SYSTEM ONLINE',
        content: 'Cosmic Radio telemetry systems initialized. All subsystems nominal.',
        ttl: 8000,
        icon: '⚡',
        tags: ['system', 'startup'],
    },
    {
        type: BroadcastType.WEATHER_UPDATE,
        priority: BroadcastPriority.NORMAL,
        tone: BroadcastTone.NEUTRAL,
        headline: 'SOLAR WIND UPDATE',
        content: 'Current solar wind velocity: 425 km/s. Density nominal at 5.2 p/cm³.',
        ttl: 10000,
        icon: '☀️',
        tags: ['weather'],
    },
    {
        type: BroadcastType.DJ_ANNOUNCEMENT,
        priority: BroadcastPriority.HIGH,
        tone: BroadcastTone.CINEMATIC,
        headline: 'TRANSMISSION FROM THE VOID',
        content: 'Greetings, cosmic travelers. The Sun whispers its secrets across 150 million kilometers of void. Tonight, we listen.',
        ttl: 15000,
        icon: '🎙️',
        hasAudio: true,
        tags: ['dj'],
    },
    {
        type: BroadcastType.COSMIC_EVENT,
        priority: BroadcastPriority.HIGH,
        tone: BroadcastTone.WARNING,
        headline: 'ELEVATED SOLAR ACTIVITY',
        content: 'Minor C-class flare detected from Active Region AR3842. Monitoring for follow-up activity.',
        ttl: 12000,
        icon: '🌟',
        tags: ['event', 'flare'],
    },
    {
        type: BroadcastType.ALERT,
        priority: BroadcastPriority.URGENT,
        tone: BroadcastTone.DANGER,
        headline: 'GEOMAGNETIC STORM WARNING',
        content: 'G2 Moderate geomagnetic storm in progress. Kp index elevated to 6. Aurora visible at mid-latitudes.',
        ttl: 20000,
        icon: '🚨',
        hasAudio: true,
        tags: ['alert', 'storm'],
    },
    {
        type: BroadcastType.SYSTEM,
        priority: BroadcastPriority.LOW,
        tone: BroadcastTone.POSITIVE,
        headline: 'DATA SYNC COMPLETE',
        content: 'Successfully synchronized with NASA DONKI database. 47 new records processed.',
        ttl: 6000,
        icon: '✓',
        tags: ['system', 'sync'],
    },
];

/**
 * Get a random demo broadcast
 */
export function getRandomDemoBroadcast(): BroadcastMessage {
    const template = DEMO_BROADCASTS[Math.floor(Math.random() * DEMO_BROADCASTS.length)];
    return {
        ...template,
        id: generateId(),
        timestamp: new Date(),
    };
}

/**
 * Get the startup broadcast
 */
export function getStartupBroadcast(): BroadcastMessage {
    return {
        ...DEMO_BROADCASTS[0],
        id: generateId(),
        timestamp: new Date(),
    };
}

/**
 * Get a sequence of demo broadcasts for initial display
 */
export function getInitialBroadcasts(count: number = 3): BroadcastMessage[] {
    const shuffled = [...DEMO_BROADCASTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(template => ({
        ...template,
        id: generateId(),
        timestamp: new Date(Date.now() - Math.random() * 300000), // Random time in last 5 min
    }));
}
