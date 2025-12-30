# **⚡ Project Protocol: COSMIC RADIO**

**Type:** Real-time Sonification Engine / Generative Audio Platform **Target:** HackXIOS 2k25 (AWS Focus) **Status:** Greenlit

## **1\. The Product Brief**

**Cosmic Radio** is a real-time "Space Weather" station.  
Current space weather dashboards are just boring tables of JSON data that nobody looks at until a solar storm knocks out their GPS. We are fixing that by giving the Universe a voice.  
We ingest live telemetry from NASA (Solar wind, flares, magnetic fields) and **sonify** it. We turn the raw physics of the Sun into an infinite, ambient music stream. When the Sun gets violent (Solar Flares), an **AI Radio DJ** interrupts the broadcast to warn listeners in real-time.  
**The Vibe:** *Lofi Girl* meets *Interstellar* meets *Fallout’s Radio*.

## **2\. The "1000 IQ" Feature: The Interference Engine**

To separate this from a basic "music visualizer," we are implementing a **Radio Propagation Simulator**.

* **The Physics:** When a solar flare hits Earth, it ionizes the D-Layer of the atmosphere. This kills High-Frequency (HF) radio signals used by aviation and ham radio.  
* **The Feature:** We fetch **D-RAP (D-Region Absorption Prediction)** data.  
* **The Experience:** If the user is tuned into a specific frequency (e.g., 15MHz) and a storm hits, the app applies a **Low-Pass Filter** and **Static Noise** to the audio stream.  
* **Why it wins:** We aren't just playing music; we are physically simulating the death of radio signals in the browser.

## **3\. High-Level Architecture**

We are using a **"Thick Client"** approach. The server handles data and intelligence; the client handles audio synthesis and rendering.

### **The Pipeline**

1. **Ingest (AWS):** Lambda functions poll NASA DONKI (Space Weather) & NOAA APIs every 60s.  
2. **Stream (AWS Kinesis):** Data is normalized and buffered.  
3. **Intelligence (AWS Bedrock):**  
   * If Flare\_Class \> M (Medium/High): The data is sent to **Claude 3 Haiku**.  
   * **Prompt:** "You are a Radio DJ on a lonely space station. Warn Earth about this X-Class flare. Be cool, brief, and slightly sarcastic."  
   * **TTS (Amazon Polly):** Text is converted to a neural voice stream.  
4. **Client (Next.js):** The browser receives the data payload and generates the audio/visuals locally.

## **4\. Core Mechanics**

### **A. The Audio Engine (Sonification)**

* **Library:** Tone.js (Web Audio API wrapper).  
* **Concept:** We don't stream MP3s. We stream *parameters*.  
* **The Mapping:**  
  * **Solar Wind Speed:** Controls **Tempo (BPM)**. Fast wind \= frantic beat.  
  * **Kp Index (Geomagnetic Storm):** Controls **Distortion**. High Kp \= gritty, bit-crushed sound.  
  * **Flare Intensity:** Controls **Volume/Dynamics**.

### **B. The Visuals**

* **Library:** React-Three-Fiber (Three.js).  
* **Centerpiece:** A wireframe Sun that pulses to the beat of the sonified data.  
* **Overlay:** A 3D Earth showing a heat map of the "Interference Zone" (where radio signals are currently blocked).

## **5\. Technical Stack**

| Component | Tech | Purpose |
| :---- | :---- | :---- |
| **Frontend** | Next.js (React) | UI & State Management |
| **Audio** | Tone.js | In-browser synthesis (No server-side audio gen) |
| **3D** | React-Three-Fiber | Reactive visualizations |
| **Backend** | Python (FastAPI/Lambda) | Data fetching & Logic |
| **AI LLM** | AWS Bedrock (Claude 3\) | Generating the DJ script |
| **Voice** | Amazon Polly | Neural Text-to-Speech |
| **Real-time** | AWS IoT Core / Kinesis | WebSocket streaming |

## **6\. Execution Roadmap (36 Hours)**

**Phase 1: The Signal (MVP)**

* Establish the NASA data polling pipeline.  
* Get the frontend to produce sound using Tone.js.  
* *Milestone:* A page that beeps based on hardcoded solar wind data.

**Phase 2: The Intelligence**

* Connect AWS Bedrock.  
* Implement the "DJ Trigger" logic (only speak on anomalies).  
* *Milestone:* The website "talks" when we simulate a solar flare.

**Phase 3: The Physics (The "Interference Engine")**

* Integrate NOAA D-RAP data.  
* Apply audio filters (static/muffling) based on storm intensity.  
* *Milestone:* The music degrades realistically during a storm.

**Phase 4: The Polish**

* UI Styling: CRT Monitor effects, scanlines, monospace fonts.  
* Latency optimization.

## **7\. Resources & Keys**

* **NASA API:** api.nasa.gov (Keys ready).  
* **Design Ref:** *Alien (1979)* computer terminals, *Bloomberg Terminal*, *Evangelion* UI.  
* **Docs:**  
  * [Tone.js Documentation](https://tonejs.github.io/)  
  * [NASA DONKI API](https://www.google.com/search?q=https://ccmc.gsfc.nasa.gov/donki/)

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