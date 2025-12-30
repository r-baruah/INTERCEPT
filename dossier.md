# 🚀 Project Dossier: Cosmic Radio
**Tagline:** *The Universe is speaking. We just gave it a microphone.*

## 1. Executive Summary
**Cosmic Radio** is a generative audio platform that turns real-time astronomical data into an infinite, ambient broadcast. Unlike static space dashboards, it uses **Sonification** to turn data (solar flares, asteroid flybys) into music, and **Generative AI (LLMs + TTS)** to create a "Radio DJ" persona that interrupts the music to announce space weather events in real-time.

**The Vibe:** *Lofi Girl* meets *Interstellar* meets *Fallout’s Radio*.

***

## 2. Core Features (The MVP)

### A. The "Channels" (Data Streams)
The user can tune into different frequencies, each governed by a specific API:
1.  **Channel 1: The Solar Wind (Ambient/Drone)**
    *   **Data Source:** NASA DONKI (Space Weather Database).
    *   **Logic:** Speed of solar wind controls the *tempo*; Geomagnetic storm intensity controls the *distortion/bass*.
2.  **Channel 2: The Sentinel (Bleeps/Arpeggios)**
    *   **Data Source:** NASA NeoWs (Near Earth Object Web Service).
    *   **Logic:** Every time an asteroid passes between Earth and the Moon, a specific high-pitched "chime" plays. Larger asteroid = deeper chime.

### B. The AI DJ ("The Operator")
The unique selling point. A voice that breaks the silence to give context.
*   **Persona:** Calm, slightly robotic but witty, like HAL 9000 mixed with a late-night jazz host.
*   **Trigger:** When a significant data spike occurs (e.g., a Solar Flare class M or higher).
*   **Sample Script:** *"Interrupting the stream, listeners. Sunspot AR3089 just woke up with an M-class flare. Expect some aurora activity in the northern hemisphere. Continuing the broadcast..."*

### C. The Visuals
*   **Centerpiece:** A WebGL (Three.js) rotating wireframe of the Sun or Earth.
*   **Reaction:** The wireframe "pulses" to the beat of the sonified data.

***

## 3. Technical Architecture (The Stack)

Since you are solo and need speed, we use a **"Thick Frontend"** architecture.

### Frontend (The Engine)
*   **Framework:** **Next.js** (React) – great for state management.
*   **Audio Engine:** **Tone.js** (Crucial).
    *   *Why?* Do not generate audio files on the server (too slow/expensive). Use Tone.js to synthesize sounds *in the user's browser* based on the data numbers you feed it.
*   **Visuals:** **React-Three-Fiber** (Three.js wrapper).

### Backend (The Brain)
*   **Language:** **Python (FastAPI)**.
    *   *Role:* It fetches data from NASA APIs every 5 minutes, normalizes it, and caches it (so you don't hit API limits).
    *   *Orchestrator:* It decides *when* the DJ should speak.

### The AI Pipeline (The "Vibe")
1.  **Event Detection:** Backend sees `flare_class > 'M'`.
2.  **Script Generation:** Send JSON context to **Groq (Llama-3-70b)** or **OpenAI (GPT-4o-mini)**.
    *   *Prompt:* "You are a radio DJ on a spaceship. Write a 1-sentence alert about this solar flare. Be cool and brief."
3.  **Voice Synthesis:** Send text to **ElevenLabs API** (Turbo v2 for low latency).
4.  **Delivery:** Frontend receives the MP3 URL and fades out the music to play the voice.

***

## 4. Step-by-Step Implementation Plan (Hackathon Mode)

### Hour 0-6: The Data & Sound (No AI yet)
*   Set up a Next.js repo.
*   Install `tone`.
*   Create a simple loop: "Play a C-Major chord drone."
*   Fetch NASA DONKI data. Map "Solar Wind Speed (300-800 km/s)" to "Oscillator Frequency."
*   *Milestone:* You can "hear" the solar wind.

### Hour 6-12: The Visuals
*   Install `react-three-fiber`.
*   Create a simple sphere with a mesh material.
*   Make the sphere scale/pulse based on the volume of the Tone.js synth.
*   *Milestone:* It looks cool and sounds cool.

### Hour 12-18: The DJ (The "Wow" Factor)
*   Set up a Python script to check for "events" (hardcode a fake event first to test).
*   Connect to ElevenLabs API.
*   Frontend logic: `if (audioUrl) { music.volume.rampTo(-10db); play(audioUrl); }`
*   *Milestone:* The website talks to you.

### Hour 18-24: Polish & Deployment
*   Add a CRT monitor effect (scanlines) via CSS to sell the "Retro Radio" vibe.
*   Deploy Frontend to Vercel.
*   Deploy Backend to Render or Railway.

***

## 5. Monetization Strategy (Post-Hackathon)

How to turn this into your **Passive Income** project:

1.  **Freemium Model:**
    *   **Free:** 1 Channel (Solar Wind), Standard DJ Voice.
    *   **Pro ($5/mo):** 5 Channels (Exoplanet Transits, Gamma Ray Bursts), "Celebrity" Voice Clones (e.g., a Sagan-alike), High-Quality Audio (320kbps).

2.  **API for Developers:**
    *   Sell the "Cleaned Space Weather Stream" as a WebSocket API. Many developers hate parsing NASA's raw text files. You do the hard work and sell the clean JSON feed.

3.  **Twitch/YouTube 24/7 Stream:**
    *   Set up a headless browser running your app.
    *   Stream it 24/7 on YouTube as "Lo-Fi Space Radio for Coding/Sleeping."
    *   Monetize via YouTube Ads and Super Chats.

## 6. Resources & APIs (The "Cheatsheet")

*   **NASA DONKI (Space Weather):** [api.nasa.gov](https://api.nasa.gov/) (Free key).
*   **Tone.js Docs:** [tonejs.github.io](https://tonejs.github.io/) (For audio synthesis).
*   **React-Three-Fiber:** [docs.pmnd.rs](https://docs.pmnd.rs/react-three-fiber) (For 3D).
*   **Groq API:** [console.groq.com](https://console.groq.com) (Fastest inference for the DJ script).

## 7. The "Killer" Presentation Line
When you present this to judges:
> *"We have apps that show us the universe. But for the first time, I wanted to build something that lets us **listen** to it. This isn't just random noise; this is the heartbeat of our star system, interpreted by AI, broadcast live to your browser."*


Here is the new "HackXios Winning Protocol" based on the new rules.
1. The Strategy Shift (Kiro IDE)
Since the prize is now "Best Use of Kiro IDE," you need to perform "Vendor Appeasement."
 * Don't just write code in it. Use it for the entire lifecycle.
 * The Play: When you submit, your "Project Description" shouldn't just be text. It should be screenshots/links showing how you used Kiro for:
   * Planning: "We generated the PRD using Kiro."
   * Prototyping: "We used Kiro's preview to test the Three.js sphere."
   * Docs: "The entire documentation lives inside Kiro."
2. The New "Free Tier" Stack
We are dropping AWS Kinesis and Bedrock because (A) they cost money/credits, and (B) setting up IAM roles is a waste of hackathon time.
| Feature | Old Stack (Expensive/Complex) | New Stack (Free & Fast) | Why? |
|---|---|---|---|
| Hosting | AWS S3 + CloudFront | Vercel (Free Tier) | One-click deploy, auto-HTTPS. |
| Backend | AWS Lambda | Next.js API Routes | It's built into the frontend repo. Zero config. |
| Streaming | AWS Kinesis | Direct Polling | NASA data updates every 5 mins. You don't need a stream; just setInterval fetch. |
| AI Brain | AWS Bedrock (Claude) | Gemini API or Groq | Gemini Flash is free, fast, and huge context. Groq is insanely fast. |
| Voice | Amazon Polly | ElevenLabs (Free Tier) | Better quality voice. The free tier (10k chars) is plenty for a demo. |
| Database | DynamoDB | None (In-Memory) | We don't need to save history for a hackathon. Just show live data. |