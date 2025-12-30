/**
 * Broadcast Service
 * 
 * Manages real-time cosmic broadcasts, event notifications,
 * and DJ announcements for the Cosmic Radio experience.
 */

import {
    BroadcastMessage,
    BroadcastType,
    BroadcastPriority,
    BroadcastTone,
    BroadcastConfig,
    BroadcastListener,
    BroadcastHistoryEntry,
    BroadcastStats,
    DEFAULT_BROADCAST_CONFIG,
    severityToPriority,
    severityToTone,
} from '@/types/broadcast';
import { SpaceWeatherData } from '@/types/nasa';
import { AnySpaceWeatherEvent, SpaceWeatherEventType, EventSeverity } from '@/types/events';

// Simple UUID generator
const generateId = (): string => {
    return 'bc-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

/**
 * BroadcastService - Singleton service for managing cosmic broadcasts
 */
export class BroadcastService {
    private static instance: BroadcastService | null = null;

    private config: BroadcastConfig;
    private listeners: Set<BroadcastListener> = new Set();
    private history: BroadcastHistoryEntry[] = [];
    private currentBroadcast: BroadcastMessage | null = null;
    private queue: BroadcastMessage[] = [];
    private startTime: number;
    private pollingInterval: NodeJS.Timeout | null = null;
    private stats: BroadcastStats;

    private constructor(config: Partial<BroadcastConfig> = {}) {
        this.config = { ...DEFAULT_BROADCAST_CONFIG, ...config };
        this.startTime = Date.now();
        this.stats = {
            totalReceived: 0,
            alertCount: 0,
            eventCount: 0,
            lastBroadcastAt: null,
            uptime: 0,
        };
    }

    /**
     * Get singleton instance
     */
    static getInstance(config?: Partial<BroadcastConfig>): BroadcastService {
        if (!BroadcastService.instance) {
            BroadcastService.instance = new BroadcastService(config);
        }
        return BroadcastService.instance;
    }

    /**
     * Subscribe to broadcasts
     */
    subscribe(listener: BroadcastListener): () => void {
        this.listeners.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(message: BroadcastMessage): void {
        this.listeners.forEach(listener => {
            try {
                listener(message);
            } catch (error) {
                console.error('Error in broadcast listener:', error);
            }
        });
    }

    /**
     * Create and queue a broadcast from a space weather event
     */
    broadcastEvent(event: AnySpaceWeatherEvent): BroadcastMessage {
        const priority = severityToPriority(event.severity);
        const tone = severityToTone(event.severity);

        const headline = this.generateEventHeadline(event);
        const content = this.generateEventContent(event);
        const icon = this.getEventIcon(event);

        const message: BroadcastMessage = {
            id: generateId(),
            type: BroadcastType.COSMIC_EVENT,
            priority,
            tone,
            headline,
            content,
            timestamp: new Date(),
            ttl: this.calculateTTL(priority),
            event,
            weatherData: event.data,
            icon,
            hasAudio: priority >= BroadcastPriority.HIGH,
            tags: [event.type, event.severity],
        };

        this.queueBroadcast(message);
        this.stats.eventCount++;

        return message;
    }

    /**
     * Create a weather update broadcast
     */
    broadcastWeatherUpdate(data: SpaceWeatherData): BroadcastMessage {
        const headline = `Solar Wind: ${data.solar_wind.speed.toFixed(0)} km/s | Kp: ${data.geomagnetic.kp_index}`;
        const content = this.formatWeatherSummary(data);

        const message: BroadcastMessage = {
            id: generateId(),
            type: BroadcastType.WEATHER_UPDATE,
            priority: BroadcastPriority.NORMAL,
            tone: this.getWeatherTone(data),
            headline,
            content,
            timestamp: new Date(),
            ttl: 60000, // 1 minute
            weatherData: data,
            icon: '☀️',
            tags: ['weather', 'update'],
        };

        this.queueBroadcast(message);
        return message;
    }

    /**
     * Create a DJ announcement broadcast
     */
    broadcastDJAnnouncement(script: string, event?: AnySpaceWeatherEvent): BroadcastMessage {
        const message: BroadcastMessage = {
            id: generateId(),
            type: BroadcastType.DJ_ANNOUNCEMENT,
            priority: event ? severityToPriority(event.severity) : BroadcastPriority.NORMAL,
            tone: BroadcastTone.CINEMATIC,
            headline: 'TRANSMISSION FROM THE VOID',
            content: script,
            timestamp: new Date(),
            ttl: 15000, // 15 seconds
            event,
            icon: '🎙️',
            hasAudio: true,
            tags: ['dj', 'announcement'],
        };

        this.queueBroadcast(message);
        return message;
    }

    /**
     * Create a system notification
     */
    broadcastSystem(headline: string, content: string, priority: BroadcastPriority = BroadcastPriority.LOW): BroadcastMessage {
        const message: BroadcastMessage = {
            id: generateId(),
            type: BroadcastType.SYSTEM,
            priority,
            tone: BroadcastTone.NEUTRAL,
            headline,
            content,
            timestamp: new Date(),
            ttl: 8000,
            icon: '⚙️',
            tags: ['system'],
        };

        this.queueBroadcast(message);
        return message;
    }

    /**
     * Create an emergency alert
     */
    broadcastAlert(headline: string, content: string, severity: EventSeverity = EventSeverity.SEVERE): BroadcastMessage {
        const priority = severityToPriority(severity);

        const message: BroadcastMessage = {
            id: generateId(),
            type: BroadcastType.ALERT,
            priority,
            tone: BroadcastTone.DANGER,
            headline: `⚠️ ALERT: ${headline}`,
            content,
            timestamp: new Date(),
            ttl: this.calculateTTL(priority) * 2, // Alerts stay longer
            icon: '🚨',
            hasAudio: true,
            tags: ['alert', severity],
        };

        this.queueBroadcast(message);
        this.stats.alertCount++;

        return message;
    }

    /**
     * Queue a broadcast message
     */
    private queueBroadcast(message: BroadcastMessage): void {
        // Filter based on config
        if (!this.config.enabled) return;
        if (message.priority < this.config.minDisplayPriority) return;
        if (!this.config.subscribedChannels.includes(message.type)) return;

        // Add to queue sorted by priority
        this.queue.push(message);
        this.queue.sort((a, b) => b.priority - a.priority);

        // Update stats
        this.stats.totalReceived++;
        this.stats.lastBroadcastAt = new Date();

        // Process queue
        this.processQueue();
    }

    /**
     * Process the broadcast queue
     */
    private processQueue(): void {
        if (this.queue.length === 0) return;

        // Take highest priority message
        const message = this.queue.shift()!;
        this.currentBroadcast = message;

        // Add to history
        this.addToHistory(message);

        // Notify listeners
        this.notifyListeners(message);

        // Auto-acknowledge after delay
        if (this.config.autoAcknowledgeDelay > 0) {
            setTimeout(() => {
                this.acknowledgeBroadcast(message.id);
            }, this.config.autoAcknowledgeDelay);
        }
    }

    /**
     * Add broadcast to history
     */
    private addToHistory(message: BroadcastMessage): void {
        const entry: BroadcastHistoryEntry = {
            broadcast: message,
            receivedAt: new Date(),
            displayedFor: message.ttl,
        };

        this.history.unshift(entry);

        // Trim history
        if (this.history.length > this.config.maxHistorySize) {
            this.history = this.history.slice(0, this.config.maxHistorySize);
        }
    }

    /**
     * Acknowledge a broadcast
     */
    acknowledgeBroadcast(id: string): void {
        const entry = this.history.find(h => h.broadcast.id === id);
        if (entry) {
            entry.broadcast.acknowledged = true;
            entry.userAction = 'dismissed';
        }

        if (this.currentBroadcast?.id === id) {
            this.currentBroadcast = null;
            // Process next in queue
            this.processQueue();
        }
    }

    /**
     * Get current broadcast
     */
    getCurrentBroadcast(): BroadcastMessage | null {
        return this.currentBroadcast;
    }

    /**
     * Get broadcast history
     */
    getHistory(limit?: number): BroadcastHistoryEntry[] {
        return limit ? this.history.slice(0, limit) : [...this.history];
    }

    /**
     * Get recent broadcasts by type
     */
    getRecentByType(type: BroadcastType, limit: number = 5): BroadcastHistoryEntry[] {
        return this.history
            .filter(h => h.broadcast.type === type)
            .slice(0, limit);
    }

    /**
     * Get broadcast statistics
     */
    getStats(): BroadcastStats {
        return {
            ...this.stats,
            uptime: Date.now() - this.startTime,
        };
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<BroadcastConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Clear history
     */
    clearHistory(): void {
        this.history = [];
    }

    // Helper methods

    private generateEventHeadline(event: AnySpaceWeatherEvent): string {
        switch (event.type) {
            case SpaceWeatherEventType.MAJOR_FLARE:
                return `🌟 SOLAR FLARE DETECTED`;
            case SpaceWeatherEventType.GEOMAGNETIC_STORM:
                return `🌀 GEOMAGNETIC STORM ACTIVE`;
            case SpaceWeatherEventType.SEVERE_STORM:
                return `⚡ SEVERE STORM WARNING`;
            case SpaceWeatherEventType.HIGH_SOLAR_WIND:
                return `💨 HIGH SOLAR WIND`;
            case SpaceWeatherEventType.EXTREME_SOLAR_WIND:
                return `🌪️ EXTREME SOLAR WIND`;
            case SpaceWeatherEventType.COMPOUND_EVENT:
                return `🔥 MULTIPLE EVENTS DETECTED`;
            default:
                return `📡 COSMIC EVENT`;
        }
    }

    private generateEventContent(event: AnySpaceWeatherEvent): string {
        return event.description;
    }

    private getEventIcon(event: AnySpaceWeatherEvent): string {
        switch (event.type) {
            case SpaceWeatherEventType.MAJOR_FLARE:
                return '☀️';
            case SpaceWeatherEventType.GEOMAGNETIC_STORM:
            case SpaceWeatherEventType.SEVERE_STORM:
                return '🌀';
            case SpaceWeatherEventType.HIGH_SOLAR_WIND:
            case SpaceWeatherEventType.EXTREME_SOLAR_WIND:
                return '💨';
            case SpaceWeatherEventType.COMPOUND_EVENT:
                return '🔥';
            default:
                return '📡';
        }
    }

    private getWeatherTone(data: SpaceWeatherData): BroadcastTone {
        if (data.geomagnetic.kp_index >= 7 || data.solar_wind.speed >= 700) {
            return BroadcastTone.DANGER;
        }
        if (data.geomagnetic.kp_index >= 5 || data.solar_wind.speed >= 550) {
            return BroadcastTone.WARNING;
        }
        return BroadcastTone.NEUTRAL;
    }

    private formatWeatherSummary(data: SpaceWeatherData): string {
        let summary = `Solar Wind: ${data.solar_wind.speed.toFixed(0)} km/s (density: ${data.solar_wind.density.toFixed(1)} p/cm³)\n`;
        summary += `Kp Index: ${data.geomagnetic.kp_index} (${data.geomagnetic.storm_level})\n`;
        summary += `Active Flares: ${data.flares.length}`;
        return summary;
    }

    private calculateTTL(priority: BroadcastPriority): number {
        switch (priority) {
            case BroadcastPriority.LOW:
                return 5000;
            case BroadcastPriority.NORMAL:
                return 8000;
            case BroadcastPriority.HIGH:
                return 12000;
            case BroadcastPriority.URGENT:
                return 15000;
            case BroadcastPriority.CRITICAL:
                return 20000;
            default:
                return 8000;
        }
    }
}

