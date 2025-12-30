/**
 * Space Weather API Route
 * Next.js 14 API route for fetching real-time space weather data
 * Implements 5-minute server-side caching to avoid NASA API rate limits
 * Enhanced with broadcast integration for event detection
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { fetchSpaceWeather } from '@/lib/data/nasaClient';
import { getBroadcastService } from '@/lib/broadcast/instance';
import { EventDetector } from '@/lib/events/EventDetector';
import type { SpaceWeatherData } from '@/types/nasa';

// Cache for 5 minutes to avoid rate limits
let cachedData: SpaceWeatherData | null = null;
let cacheTimestamp: number = 0;
let previousData: SpaceWeatherData | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Event detector instance for detecting significant events
const eventDetector = new EventDetector({
  flareClassesToDetect: ['M', 'X'],
  minKpForStorm: 5,
  detectCompoundEvents: true,
});

// Subscribe event detector to broadcast service
const broadcastService = getBroadcastService();
eventDetector.addEventListener((event) => {
  // Broadcast detected events
  broadcastService.broadcastEvent(event);
});

/**
 * Check for significant changes between data updates
 */
function detectSignificantChanges(newData: SpaceWeatherData, oldData: SpaceWeatherData | null): void {
  if (!oldData) return;

  // Check for solar wind speed change > 100 km/s
  const speedDelta = Math.abs(newData.solar_wind.speed - oldData.solar_wind.speed);
  if (speedDelta > 100) {
    const direction = newData.solar_wind.speed > oldData.solar_wind.speed ? 'increased' : 'decreased';
    broadcastService.broadcastSystem(
      `Solar Wind ${direction.toUpperCase()}`,
      `Solar wind speed ${direction} by ${speedDelta.toFixed(0)} km/s to ${newData.solar_wind.speed.toFixed(0)} km/s`
    );
  }

  // Check for Kp index change >= 2
  const kpDelta = newData.geomagnetic.kp_index - oldData.geomagnetic.kp_index;
  if (Math.abs(kpDelta) >= 2) {
    const direction = kpDelta > 0 ? 'elevated' : 'subsided';
    broadcastService.broadcastSystem(
      `Geomagnetic Activity ${direction.toUpperCase()}`,
      `Kp index ${direction} from ${oldData.geomagnetic.kp_index} to ${newData.geomagnetic.kp_index}`
    );
  }

  // Check for new flares
  const oldFlareIds = new Set(oldData.flares.map(f => f.id));
  const newFlares = newData.flares.filter(f => !oldFlareIds.has(f.id));
}

/**
 * GET /api/space-weather
 * Returns current space weather data with caching
 * Triggers broadcast events on significant changes
 */
export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still valid
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        ...cachedData,
        data_source: 'cached',
        cache_age: Math.floor((now - cacheTimestamp) / 1000),
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Content-Type': 'application/json',
          'X-Cache-Status': 'HIT',
          'X-Cache-Age': Math.floor((now - cacheTimestamp) / 1000).toString(),
        }
      });
    }

        // Fetch fresh data from NASA API
        let data;
        try {
            data = await fetchSpaceWeather();
        } catch (fetchError) {
            console.error('Data fetch failed, using mock fallback:', fetchError);
            const { getMockSpaceWeather } = await import('@/lib/demo/mockSpaceWeather');
            data = getMockSpaceWeather();
        }
    
        // Detect significant changes (triggers broadcasts)
        if (previousData) {
            try {
                detectSignificantChanges(data, previousData);
            } catch (e) {
                console.error('Error detecting changes:', e);
            }
        }
    
        // Run event detector for significant events
        let events: any[] = [];
        try {
            events = eventDetector.analyzeData(data);
        } catch (e) {
            console.error('Error analyzing events:', e);
        }
    
        // Update cache and previous data    previousData = cachedData;
    cachedData = data;
    cacheTimestamp = now;

    // Calculate cache age for response headers
    const cacheAge = 0; // Fresh data
    const maxAge = Math.floor(CACHE_DURATION / 1000);

    // Broadcast weather update (throttled to significant updates only)
    if (!previousData || data.data_source === 'live') {
      broadcastService.broadcastWeatherUpdate(data);
    }

    return NextResponse.json({
      ...data,
      events_detected: events.length,
      cache_age: cacheAge,
    }, {
      headers: {
        'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=600`,
        'Content-Type': 'application/json',
        'X-Cache-Status': 'MISS',
        'X-Cache-Age': cacheAge.toString(),
        'X-Events-Detected': events.length.toString(),
      }
    });
  } catch (error) {
    console.error('Space weather API error:', error);

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to fetch space weather data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

/**
 * POST /api/space-weather/simulate
 * Trigger simulated events for testing (development only)
 * Updates the cached data so frontend polling detects the event
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;
    const now = new Date();

    // Initialize cachedData if null (using standard mock logic would be better but simple object works for now)
    // Initialize cachedData if null (using standard mock logic would be better but simple object works for now)
    if (!cachedData) {
      // Fallback or wait for first fetch? Let's just create a base skeleton
      cachedData = {
        timestamp: now.toISOString(),
        solar_wind: { speed: 450, density: 5, temperature: 100000, timestamp: now.toISOString() },
        geomagnetic: { kp_index: 2, storm_active: false, storm_level: "None", timestamp: now.toISOString() },
        flares: [],
        data_source: 'demo'
      };
    }

    // Capture non-null reference for spread operations
    const currentCache = cachedData;

    // Modify cachedData based on simulation type
    if (type === 'flare') {
      const simulatedFlare = {
        id: `SIM-FLR-${Date.now()}`,
        flareClass: 'X5.0',
        classType: 'X' as const,
        magnitude: 5.0,
        timestamp: now.toISOString(),
        sourceRegion: 'AR3664',
        peakTime: new Date(now.getTime() + 600000).toISOString()
      };

      cachedData = {
        ...currentCache,
        flares: [simulatedFlare, ...currentCache.flares],
        timestamp: now.toISOString(),
        data_source: 'demo'
      };

      broadcastService.broadcastAlert(
        'SIMULATED X-CLASS FLARE',
        'Testing: X5.0 solar flare detected from AR3664. This is a simulation.',
      );
    } else if (type === 'storm') {
      cachedData = {
        ...currentCache,
        geomagnetic: {
          kp_index: 8,
          storm_active: true,
          storm_level: "Severe",
          timestamp: now.toISOString()
        },
        timestamp: now.toISOString(),
        data_source: 'demo'
      };

      broadcastService.broadcastAlert(
        'SIMULATED GEOMAGNETIC STORM',
        'Testing: G4 severe geomagnetic storm in progress. Kp=8. This is a simulation.',
      );
    } else if (type === 'dj') {
      broadcastService.broadcastDJAnnouncement(
        'Greetings, cosmic travelers. This is a test transmission from the void. The sun whispers secrets to those who listen...',
      );
    } else {
      // Reset to nominal (using currentCache structure but resetting values)
      cachedData = {
        ...currentCache,
        geomagnetic: {
          kp_index: 2,
          storm_active: false,
          storm_level: "None",
          timestamp: now.toISOString()
        },
        data_source: 'demo'
      };
      broadcastService.broadcastSystem(
        'TEST TRANSMISSION',
        'This is a test broadcast from Cosmic Radio. All systems nominal.',
      );
    }

    // Update timestamp to ensure cache doesn't look stale immediately (or maybe it should be fresh)
    cacheTimestamp = Date.now();

    return NextResponse.json({ success: true, simulated: type });
  } catch (error) {
    console.error("Simulation error", error);
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 });
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}