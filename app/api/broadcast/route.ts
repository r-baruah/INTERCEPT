/**
 * Broadcast API Route
 * 
 * Provides real-time broadcast messages for the Cosmic Radio frontend
 * Integrates with EventDetector and BroadcastService
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBroadcastService } from '@/lib/broadcast/BroadcastService';
import { BroadcastMessage, BroadcastAPIResponse } from '@/types/broadcast';

// In-memory broadcast queue (in production, use Redis or similar)
let pendingBroadcasts: BroadcastMessage[] = [];
let lastPollTime: Record<string, number> = {};

/**
 * GET /api/broadcast
 * 
 * Long-polling endpoint for fetching new broadcasts
 * Clients should poll this endpoint periodically
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const clientId = searchParams.get('clientId') || 'default';
        const since = parseInt(searchParams.get('since') || '0', 10);

        const broadcastService = getBroadcastService();

        // Get broadcasts since the last poll time
        const lastPoll = lastPollTime[clientId] || since || 0;
        const history = broadcastService.getHistory(20);

        // Filter broadcasts that are newer than last poll
        const newBroadcasts = history
            .filter(entry => entry.receivedAt.getTime() > lastPoll)
            .map(entry => ({
                ...entry.broadcast,
                timestamp: entry.broadcast.timestamp.toISOString() as unknown as Date,
            }));

        // Update last poll time for this client
        lastPollTime[clientId] = Date.now();

        // Get stats
        const stats = broadcastService.getStats();

        const response: BroadcastAPIResponse = {
            broadcasts: newBroadcasts,
            nextPollIn: 5000, // Suggest 5 second poll interval
            serverTime: new Date().toISOString(),
            connectionId: clientId,
        };

        return NextResponse.json(response, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Broadcast API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch broadcasts' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/broadcast
 * 
 * Create a new broadcast (admin/internal use)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, headline, content, priority } = body;

        if (!headline || !content) {
            return NextResponse.json(
                { error: 'Missing required fields: headline, content' },
                { status: 400 }
            );
        }

        const broadcastService = getBroadcastService();
        let message: BroadcastMessage;

        switch (type) {
            case 'system':
                message = broadcastService.broadcastSystem(headline, content, priority);
                break;
            case 'alert':
                message = broadcastService.broadcastAlert(headline, content);
                break;
            case 'dj':
                message = broadcastService.broadcastDJAnnouncement(content);
                break;
            default:
                message = broadcastService.broadcastSystem(headline, content);
        }

        return NextResponse.json({
            success: true,
            broadcast: {
                ...message,
                timestamp: message.timestamp.toISOString(),
            },
        });
    } catch (error) {
        console.error('Broadcast creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create broadcast' },
            { status: 500 }
        );
    }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
