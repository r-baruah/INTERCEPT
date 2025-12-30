import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client
// Note: Requires GROQ_API_KEY in environment variables
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'dummy_key',
});

export async function POST(req: Request) {
    try {
        const { context, type } = await req.json();

        // Construct a prompt based on the context
        const systemPrompt = `You are "Cosmic Radio", an advanced AI operating a deep-space telemetry station. 
Your task is to generate short, atmospheric, and scientifically grounded broadcast messages based on real-time space weather data.
Keep it brief (under 30 words), technical but poetic, and slightly ominous or awe-inspiring.`;

        const userPrompt = `Context: ${context}
Event Type: ${type}
Generate a single broadcast message.`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            // user requested moonshotai/kimi-k2-instruct-0905
            model: "moonshotai/kimi-k2-instruct-0905",
            temperature: 0.7,
            max_tokens: 128,
        });

        const content = completion.choices[0]?.message?.content?.trim() || "Signal interference... trying to re-establish connection.";

        return NextResponse.json({ content });

    } catch (error) {
        console.error('Groq API Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate broadcast content' },
            { status: 500 }
        );
    }
}
