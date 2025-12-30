/**
 * Generate Script API Route
 * 
 * Groq LLM integration for "The Operator" AI DJ personality.
 * Generates witty, HAL 9000-inspired space weather announcements.
 */

import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import type { DJScriptRequest, DJScriptResponse, AnySpaceWeatherEvent } from '@/types/events';
import { buildPrompt, getSystemPrompt } from '@/lib/events/promptBuilder';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// Cache recent scripts to avoid duplicates
const scriptCache = new Map<string, { script: string; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Clean up expired cache entries
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of scriptCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      scriptCache.delete(key);
    }
  }
}

/**
 * POST /api/generate-script
 * Generate AI DJ script for a space weather event
 */
export async function POST(request: Request) {
  try {
    const body: DJScriptRequest = await request.json();
    const { event, includeContext, currentData } = body;

    // Validate request
    if (!event || !event.id || !event.type) {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      );
    }

    // Clean old cache entries
    cleanCache();

    // Check cache first
    const cacheKey = `${event.id}-${event.type}`;
    const cached = scriptCache.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        script: cached.script,
        event_id: event.id,
        timestamp: new Date().toISOString(),
        character_count: cached.script.length,
        cached: true
      } as DJScriptResponse);
    }

    // Validate Groq API key
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not configured');
      return NextResponse.json(
        { 
          error: 'AI service not configured',
          script: getFallbackScript(event),
          fallback: true
        } as DJScriptResponse,
        { status: 500 }
      );
    }

    // Build prompt based on event type
    const prompt = buildPrompt(event, currentData);
    const systemPrompt = getSystemPrompt();

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.85,
      max_tokens: 100,
      top_p: 0.9
    });

    let script = completion.choices[0]?.message?.content?.trim() || '';

    // Fallback if no response
    if (!script) {
      script = getFallbackScript(event);
      console.warn('No script generated, using fallback');
    }

    // Enforce character limit (150 chars for TTS compatibility)
    const truncatedScript = script.length > 150 
      ? script.substring(0, 147) + '...' 
      : script;

    // Cache the result
    scriptCache.set(cacheKey, {
      script: truncatedScript,
      timestamp: Date.now()
    });

    const response: DJScriptResponse = {
      script: truncatedScript,
      event_id: event.id,
      timestamp: new Date().toISOString(),
      character_count: truncatedScript.length
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Groq API error:', error);
    
    // Try to extract event for fallback
    let fallbackScript = 'Cosmic Radio experiencing solar interference. Stand by.';
    try {
      const body: DJScriptRequest = await request.json();
      if (body.event) {
        fallbackScript = getFallbackScript(body.event);
      }
    } catch {
      // Use default fallback
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate script',
        script: fallbackScript,
        event_id: 'unknown',
        timestamp: new Date().toISOString(),
        character_count: fallbackScript.length,
        fallback: true
      } as DJScriptResponse,
      { status: 500 }
    );
  }
}

/**
 * Fallback scripts for error cases
 * Used when Groq API is unavailable or fails
 */
function getFallbackScript(event: AnySpaceWeatherEvent): string {
  const fallbacks: Record<string, string> = {
    MAJOR_FLARE: 'Solar flare detected. Electromagnetic disturbance in progress. This is Cosmic Radio.',
    GEOMAGNETIC_STORM: 'Geomagnetic storm approaching. Magnetosphere responding. Stand by for updates.',
    SEVERE_STORM: 'Severe geomagnetic storm in progress. Magnetic field lines distorted. Cosmic Radio monitoring.',
    HIGH_SOLAR_WIND: 'High-speed solar wind stream detected. Particle flux increasing. Cosmic Radio observing.',
    EXTREME_SOLAR_WIND: 'Extreme solar wind velocities recorded. Plasma surge detected. This is Cosmic Radio.',
    COMPOUND_EVENT: 'Multiple space weather events converging. Conditions intensifying. Cosmic Radio on watch.'
  };
  
  return fallbacks[event.type] || 'Space weather event detected. This is Cosmic Radio.';
}

/**
 * GET /api/generate-script
 * Health check endpoint
 */
export async function GET() {
  const isConfigured = !!process.env.GROQ_API_KEY;
  
  return NextResponse.json({
    status: 'ok',
    service: 'Groq LLM DJ Script Generator',
    configured: isConfigured,
    model: 'llama-3.3-70b-versatile',
    cache_size: scriptCache.size,
    personality: 'The Operator'
  });
}