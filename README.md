
# 🌌 Cosmic Radio

<div align="center">

**Experience Space Weather Through Sound**

*A real-time space weather sonification platform that transforms NASA data into immersive audio-visual experiences*

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tone.js](https://img.shields.io/badge/Tone.js-Audio-orange)](https://tonejs.github.io/)
[![Three.js](https://img.shields.io/badge/Three.js-3D-green)](https://threejs.org/)

[Live Demo](#) • [Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation)

</div>

---

## 🎯 What is Cosmic Radio?

**Cosmic Radio** is an experimental web application that bridges the gap between space science and human perception. It fetches real-time space weather data from NASA's DONKI API and transforms it into:

- 🎵 **Ambient Music** - Solar wind becomes rhythm, magnetic storms become distortion
- 🤖 **AI Radio DJ** - "The Operator" announces significant events using LLM + TTS
- 🌍 **3D Visualizations** - Audio-reactive Sun and Earth responding to real data
- 📻 **CRT Aesthetic** - Retro-futuristic interface with scanlines and phosphor glow

Built for **HackXIOS 2k25** hackathon with emphasis on Kiro IDE usage and creative data visualization.

---

## ✨ Features

### 🎵 Audio Sonification
- **Real-time data-to-audio mapping** - Space weather parameters control synthesizer settings
- **Tone.js audio engine** - FM synthesis + AM synthesis for rich soundscapes
- **Dynamic audio parameters**:
  - Solar wind speed → BPM (60-180)
  - Geomagnetic Kp index → Distortion (0-100%)
  - Proton density → Filter frequency (200-8000 Hz)
  - Solar flares → Volume spikes
- **Live waveform visualization** - Real-time oscilloscope display

### 🤖 AI Radio Personality
- **Groq LLM Integration** - Llama 3 70B generates contextual announcements
- **"The Operator" character** - Stoic, technical radio personality
- **Event-driven narration** - Announces solar flares, geomagnetic storms, high-speed winds
- **ElevenLabs TTS ready** - Voice synthesis API configured (future enhancement)

### 🌍 3D Visualizations
- **Audio-reactive Sun** - Pulses and glows based on solar wind speed
- **Dynamic Earth** - Magnetosphere appears during geomagnetic storms (Kp ≥ 5)
- **Starfield background** - 5,000 animated stars
- **WebGL rendering** - Smooth 60 FPS with React-Three-Fiber
- **Interactive controls** - OrbitControls for camera manipulation

### 📊 Real-time Data Display
- **NASA DONKI API** - Live space weather data with 5-minute server-side caching
- **Auto-refresh** - Updates every 60 seconds
- **Multi-panel dashboard**:
  - Solar Wind (speed, density, temperature)
  - Geomagnetic Activity (Kp index, storm status)
  - Solar Flares (recent M/X class events)
- **Event timeline** - Historical feed with severity badges

### 🎨 UI/UX Design
- **CRT monitor aesthetic** - Scanlines, phosphor glow, vintage tech feel
- **Neon accents** - Green terminal text with orange/red warnings
- **Glass morphism** - Semi-transparent panels with backdrop blur
- **Fully responsive** - Optimized for desktop and mobile
- **Dark theme** - Space black background with cosmic gradients

---

## 🛠️ Tech Stack

### Frontend Framework
- **Next.js 14** - React framework with App Router
- **TypeScript 5.0** - Strict type safety
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management

### Audio & 3D
- **Tone.js** - Web Audio API framework for synthesis
- **Three.js** - WebGL 3D graphics library
- **React-Three-Fiber** - React renderer for Three.js
- **@react-three/drei** - Helper components (Stars, Sphere, OrbitControls)

### APIs & Services
- **NASA DONKI** - Space Weather Database Of Notifications, Knowledge, Information
- **Groq API** - Fast LLM inference (Llama 3 70B)
- **ElevenLabs** - Text-to-speech voice synthesis (configured, not yet implemented)

### Development Tools
- **ESLint** - Code linting
- **Git** - Version control with staged commit strategy
- **Kiro IDE** - Primary development environment (27 screenshot checkpoints)

---

## 📦 Installation

### Prerequisites
- **Node.js** 18.17 or later
- **npm** or **yarn** or **pnpm**
- **Modern browser** with WebGL support

### 1. Clone the Repository
```bash
git clone https://github.com/r-baruah/INTERCEPT.git
cd INTERCEPT
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory:

```env
# NASA DONKI API Key (get free key at https://api.nasa.gov/)
NASA_API_KEY=your_nasa_api_key_here

# Groq API Key (get key at https://console.groq.com/)
GROQ_API_KEY=your_groq_api_key_here

# ElevenLabs API Key (optional - for TTS feature)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

**Get API Keys:**
- **NASA API**: https://api.nasa.gov/ (free, instant approval)
- **Groq**: https://console.groq.com/ (free tier available)
- **ElevenLabs**: https://elevenlabs.io/ (optional, for voice synthesis)

### 4. Run Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Usage

### Basic Operation

1. **Access the Application**
   - Navigate to http://localhost:3000
   - Wait for the 3D scene to load (dynamic import)

2. **Initialize Audio Context**
   - Click **"⚡ INITIALIZE AUDIO"** button
   - This is required due to browser autoplay policies
   - Button will change to "✅ AUDIO READY"

3. **Start Transmission**
   - Click **"▶️ START TRANSMISSION"**
   - Ambient soundscape begins playing
   - Data fetching starts (updates every 60 seconds)
   - Event detector monitors for significant events

4. **Experience the Sonification**
   - Watch the 3D Sun pulse with solar wind speed
   - See Earth's magnetosphere during geomagnetic storms
   - Observe the waveform visualizer respond to audio
   - Read "The Operator" announcements for major events

5. **Control Playback**
   - **Pause** - Click "⏸️ PAUSE" to stop audio (data continues updating)
   - **Resume** - Click "▶️ RESUME" to restart audio
   - **Stop** - Refresh page to fully reset

### Understanding the Data

**Solar Wind Panel:**
- **Speed**: km/s (normal: 300-500, high: >600)
- **Density**: particles/cm³ (normal: 5-10)
- **Temperature**: Kelvin (normal: ~100,000K)

**Geomagnetic Panel:**
- **Kp Index**: 0-9 scale (0-4: quiet, 5-6: storm, 7-9: severe storm)
- **Storm Active**: Red indicator when Kp ≥ 5

**Solar Activity Panel:**
- **Recent Flares**: M-class (moderate) and X-class (extreme)
- **Active Regions**: Count of sunspot regions

### Sonification Mapping

The following space weather parameters control audio synthesis:

```
Solar Wind Speed → BPM
  300 km/s = 60 BPM
  400 km/s = 90 BPM  
  500 km/s = 120 BPM
  600+ km/s = 150-180 BPM

Kp Index → Distortion
  Kp 0 = 0% distortion (clean)
  Kp 5 = 50% distortion (storm)
  Kp 9 = 100% distortion (severe storm)

Proton Density → Filter Frequency
  5 p/cm³ = 2000 Hz (bright)
  10 p/cm³ = 5000 Hz (brighter)
  15+ p/cm³ = 8000 Hz (very bright)

Solar Flares → Volume Spike
  M-class flare = +20% volume for 5 seconds
  X-class flare = +40% volume for 10 seconds
```

---

## 📁 Project Structure

```
cosmic-radio/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (server-side)
│   │   ├── space-weather/        # NASA DONKI data endpoint
│   │   │   └── route.ts          # GET handler with caching
│   │   └── generate-script/      # Groq LLM endpoint
│   │       └── route.ts          # POST handler for AI scripts
│   ├── layout.tsx                # Root layout with metadata
│   ├── page.tsx                  # Main application page
│   └── globals.css               # Global styles + CRT effects
│
├── components/                   # React components
│   ├── ui/                       # UI components
│   │   ├── AudioVisualizer.tsx   # Waveform canvas visualization
│   │   ├── DJConsole.tsx         # Main control panel
│   │   ├── StatusPanel.tsx       # Space weather data display
│   │   └── EventFeed.tsx         # Event timeline
│   └── 3d/                       # Three.js components (client-only)
│       ├── SpaceScene.tsx        # Main 3D canvas setup
│       ├── Sun.tsx               # Audio-reactive Sun sphere
│       └── Earth.tsx             # Geomagnetic-reactive Earth
│
├── lib/                          # Core logic libraries
│   ├── audio/                    # Audio synthesis
│   │   ├── AudioEngine.ts        # Tone.js engine class
│   │   └── sonification.ts       # Data-to-audio mapping
│   ├── events/                   # Event detection
│   │   └── EventDetector.ts      # 6 event types detector
│   ├── data/                     # API clients
│   │   └── nasaClient.ts         # NASA API fetch functions
│   └── demo/                     # Mock data (for demos)
│       └── mockData.ts           # Sample space weather data
│
├── hooks/                        # Custom React hooks
│   ├── useSpaceWeather.ts        # Data fetching + polling
│   ├── useAudioEngine.ts         # Audio initialization
│   └── useEventDetector.ts       # Event monitoring
│
├── types/                        # TypeScript definitions
│   └── space-weather.ts          # API response types
│
├── store/                        # Zustand state management
│   └── useStore.ts               # Global application state
│
├── public/                       # Static assets
│   └── (images, fonts, etc.)
│
├── plans/                        # Project planning docs
│   ├── EXECUTIVE_SUMMARY.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── IMPLEMENTATION_CHECKLIST.md
│   ├── KIRO_IDE_STRATEGY.md
│   └── HACKATHON_GIT_STRATEGY.md
│
├── .env.local                    # Environment variables (gitignored)
├── .env.example                  # Example env file
├── .gitignore                    # Git ignore rules
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
└── README.md                     # This file
```

---

## 🔧 Configuration

### Audio Engine Settings

Edit [`lib/audio/AudioEngine.ts`](lib/audio/AudioEngine.ts) to adjust:

```typescript
// Default audio parameters
private readonly DEFAULT_VOLUME = 0.6;        // Master volume (0-1)
private readonly DEFAULT_BPM = 90;            // Baseline tempo
private readonly DEFAULT_DISTORTION = 0.2;    // Base distortion (0-1)
private readonly DEFAULT_FILTER_FREQ = 2000;  // Filter cutoff (Hz)
```

### Event Detection Thresholds

Edit [`lib/events/EventDetector.ts`](lib/events/EventDetector.ts):

```typescript
const DEFAULT_CONFIG: EventDetectorConfig = {
  minKpForStorm: 5,              // Kp threshold for storms
  minKpForSevereStorm: 7,        // Kp threshold for severe storms
  minSpeedForHighWind: 600,      // km/s for high-speed wind
  minSpeedForExtremeWind: 700,   // km/s for extreme wind
  flareClassesToDetect: ['M', 'X'], // Flare classes to monitor
  detectCompoundEvents: true     // Enable multi-event detection
};
```

### Polling Interval

Edit [`hooks/useSpaceWeather.ts`](hooks/useSpaceWeather.ts):

```typescript
const POLLING_INTERVAL = 60000; // 60 seconds (60000 ms)
```