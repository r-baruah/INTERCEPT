/**
 * Broadcast System Types
 * 
 * Types for the real-time cosmic broadcast system
 * Handles announcements, alerts, and live event updates
 */

import { SpaceWeatherData } from './nasa';
import { AnySpaceWeatherEvent, EventSeverity } from './events';

/**
 * Broadcast message types
 */
export enum BroadcastType {
    /** Real-time space weather update */
    WEATHER_UPDATE = 'WEATHER_UPDATE',
    /** Detected cosmic event (flare, storm, etc.) */
    COSMIC_EVENT = 'COSMIC_EVENT',
    /** DJ announcement */
    DJ_ANNOUNCEMENT = 'DJ_ANNOUNCEMENT',
    /** System notification */
    SYSTEM = 'SYSTEM',
    /** Emergency alert */
    ALERT = 'ALERT',
    /** Scheduled transmission */
    SCHEDULED = 'SCHEDULED',
}

/**
 * Priority levels for broadcasts
 */
export enum BroadcastPriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    URGENT = 3,
    CRITICAL = 4,
}

/**
 * Visual/audio tone for broadcast
 */
export enum BroadcastTone {
    NEUTRAL = 'NEUTRAL',
    POSITIVE = 'POSITIVE',
    WARNING = 'WARNING',
    DANGER = 'DANGER',
    CINEMATIC = 'CINEMATIC',
}

/**
 * Broadcast message structure
 */
export interface BroadcastMessage {
    /** Unique broadcast ID */
    id: string;

    /** Type of broadcast */
    type: BroadcastType;

    /** Priority level */
    priority: BroadcastPriority;

    /** Visual/audio tone */
    tone: BroadcastTone;

    /** Short headline (max 60 chars) */
    headline: string;

    /** Detailed message content */
    content: string;

    /** When the broadcast was created */
    timestamp: Date;

    /** Time to live in ms (how long to display) */
    ttl: number;

    /** Optional associated space weather data */
    weatherData?: SpaceWeatherData;

    /** Optional associated event */
    event?: AnySpaceWeatherEvent;

    /** Icon identifier */
    icon?: string;

    /** Whether the user has acknowledged this */
    acknowledged?: boolean;

    /** Whether this broadcast has audio */
    hasAudio?: boolean;

    /** Optional meta tags for filtering */
    tags?: string[];
}

/**
 * Broadcast channel subscription
 */
export interface BroadcastChannel {
    id: string;
    name: string;
    description: string;
    types: BroadcastType[];
    enabled: boolean;
}

/**
 * Broadcast history entry
 */
export interface BroadcastHistoryEntry {
    broadcast: BroadcastMessage;
    receivedAt: Date;
    displayedFor: number; // ms
    userAction?: 'dismissed' | 'expanded' | 'clicked';
}

/**
 * Broadcast statistics
 */
export interface BroadcastStats {
    totalReceived: number;
    alertCount: number;
    eventCount: number;
    lastBroadcastAt: Date | null;
    uptime: number; // ms since connection
}

/**
 * Broadcast listener callback
 */
export type BroadcastListener = (message: BroadcastMessage) => void;

/**
 * Broadcast service configuration
 */
export interface BroadcastConfig {
    /** Enable/disable broadcasts */
    enabled: boolean;

    /** Maximum messages to keep in history */
    maxHistorySize: number;

    /** Polling interval in ms (if not using WebSocket) */
    pollingInterval: number;

    /** Auto-acknowledge delay in ms (0 = manual) */
    autoAcknowledgeDelay: number;

    /** Channels to subscribe to */
    subscribedChannels: BroadcastType[];

    /** Minimum priority to display */
    minDisplayPriority: BroadcastPriority;

    /** Play audio for broadcasts */
    enableAudio: boolean;
}

/**
 * Default broadcast configuration
 */
export const DEFAULT_BROADCAST_CONFIG: BroadcastConfig = {
    enabled: true,
    maxHistorySize: 50,
    pollingInterval: 30000, // 30 seconds
    autoAcknowledgeDelay: 10000, // 10 seconds
    subscribedChannels: [
        BroadcastType.WEATHER_UPDATE,
        BroadcastType.COSMIC_EVENT,
        BroadcastType.DJ_ANNOUNCEMENT,
        BroadcastType.ALERT,
    ],
    minDisplayPriority: BroadcastPriority.NORMAL,
    enableAudio: true,
};

/**
 * Broadcast API response
 */
export interface BroadcastAPIResponse {
    broadcasts: BroadcastMessage[];
    nextPollIn: number; // suggested next poll time in ms
    serverTime: string;
    connectionId?: string;
}

/**
 * Utility: Map event severity to broadcast priority
 */
export function severityToPriority(severity: EventSeverity): BroadcastPriority {
    switch (severity) {
        case EventSeverity.LOW:
            return BroadcastPriority.LOW;
        case EventSeverity.MODERATE:
            return BroadcastPriority.NORMAL;
        case EventSeverity.HIGH:
            return BroadcastPriority.HIGH;
        case EventSeverity.SEVERE:
            return BroadcastPriority.URGENT;
        case EventSeverity.EXTREME:
            return BroadcastPriority.CRITICAL;
        default:
            return BroadcastPriority.NORMAL;
    }
}

/**
 * Utility: Map event severity to broadcast tone
 */
export function severityToTone(severity: EventSeverity): BroadcastTone {
    switch (severity) {
        case EventSeverity.LOW:
        case EventSeverity.MODERATE:
            return BroadcastTone.NEUTRAL;
        case EventSeverity.HIGH:
            return BroadcastTone.WARNING;
        case EventSeverity.SEVERE:
        case EventSeverity.EXTREME:
            return BroadcastTone.DANGER;
        default:
            return BroadcastTone.NEUTRAL;
    }
}
