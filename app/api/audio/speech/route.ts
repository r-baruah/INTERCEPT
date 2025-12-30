import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Text is required and must be a string' },
                { status: 400 }
            );
        }

        if (!GROQ_API_KEY) {
            console.warn('Groq API key not configured, returning fallback');
            return NextResponse.json(
                { error: 'Groq API key not configured', fallback: true },
                { status: 500 }
            );
        }

        const client = new Groq({
            apiKey: GROQ_API_KEY,
        });

        // Using Groq's mocked OpenAI-compatible endpoint or PlayAI integration if available
        // Based on user request to use "playai-tts" or "canopylabs/orpheus-v1-english"

        // Note: As of December 2025, Groq has specific audio endpoints. 
        // We will try the standard speech endpoint structure.

        // Direct fetch to Groq's OpenAI-compatible audio endpoint
        // This avoids issues with the current SDK version's audio namespace support
        try {
            const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "canopylabs/orpheus-v1-english",
                    voice: "autumn",
                    input: text,
                    response_format: "wav"
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Groq API failed: ${response.status} ${errorText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'audio/wav',
                    'Content-Length': buffer.length.toString(),
                    'Cache-Control': 'no-cache',
                },
            });

        } catch (groqError) {
            console.error("Groq direct fetch failed:", groqError);
            // Consider falling back to other providers here if available in the future
            throw groqError;
        }

    } catch (error) {
        console.error('TTS API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', fallback: true },
            { status: 500 }
        );
    }
}
