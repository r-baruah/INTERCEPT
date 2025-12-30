# CLASSIFIED PROJECT DOSSIER: COSMIC RADIO
**Clearance Level:** EXECUTIVE / ARCHITECT
**Date:** December 29, 2025
**Subject:** REAL-TIME SPACE WEATHER SONIFICATION PLATFORM

---

## 1. EXECUTIVE OVERVIEW

**The Premise:**
"Cosmic Radio" is not a dashboard; it is a translation engine. It bridges the sensory gap between human perception and the electromagnetic reality of our solar system. By ingesting real-time telemetry from NASA and NOAA, the system transforms the invisible physics of the cosmos—solar winds, geomagnetic storms, and coronal mass ejections—into an immersive, persistent audio-visual broadcast.

**The Core Value Proposition:**
Current scientific data is silent and abstract (JSON feeds, CSV files). Cosmic Radio gives the universe a voice. It creates a "lean-back" ambient experience that informs the user passively through soundscapes, interrupted only when significant cosmic events occur, narrated by an AI "Operator."

**Target Experience:**
Imagine a Lo-Fi music station that speeds up when the solar wind rages, distorts when Earth’s magnetic field is hammered by a storm, and speaks to you when the Sun explodes.

---

## 2. THE SYSTEM ARCHITECTURE (The "Black Box")

This platform operates as a "Thick Client" autonomous engine. It does not stream pre-recorded media; it generates everything procedurally in real-time on the user's device.

### **A. The Data Ingestion Layer (The Senses)**
The system acts as a listening post, polling authoritative scientific sources every 60 seconds:
*   **NASA DONKI:** Primary source for Solar Flares (FLR) and Geomagnetic Storms (GST).
*   **NOAA SWPC:** Provides "Interference" data (D-RAP) for radio blackout simulation.
*   **NASA NeoWs:** Monitors asteroid approaches.

### **B. The Procedural Audio Engine (The Voice)**
The heart of the project is a browser-based synthesizer (`Tone.js`) that functions as an infinite orchestra.
*   **The Drone (Solar Wind):** Polyphonic synth where BPM is coupled to Solar Wind Speed (km/s).
*   **The Distortion (Geomagnetic Activity):** Kp Index drives bit-crushing and signal degradation.
*   **The Shimmer (High Energy):** Particle density triggers high-frequency textures.

### **C. The AI Operator (The Persona)**
*   **Role:** "The Sentry" – A stoic, "Computer"-like interface.
*   **Trigger Logic:** Speaks only on threshold breaches (e.g., Flare Class > M2.0).
*   **Pipeline:** JSON Data -> LLM Context -> TTS Generation -> Audio Mix (Ducking).

---

## 3. TECHNICAL DEEP DIVE: FRONTEND ARCHITECTURE

**Philosophy:**
The UI follows a **"Cassette Futurism"** aesthetic. The interface is treated as a physical piece of hardware ("The Rack") rather than a web page.

### **A. The "Rack" Layout System (`RackLayout.tsx`)**
The UI is organized into a CSS Grid-based structure resembling a server rack or avionics panel.
*   **Left Column (Telemetry):** Dedicated to raw data stream visualization (`HUD`).
*   **Center Column (Scope & Control):** The primary visualizer (`SignalScope`) and interaction layer (`Tuner`).
*   **Right Column (Logs & Status):** Persistent event logging (`Logbook`) and system status.
*   **Global Overlay:** A CSS-based CRT texture (scanlines, vignette, noise) overlays the entire DOM to ground it in "reality."

### **B. Core Components**

#### **1. The Tuner (`Tuner.tsx`)**
*   **Role:** The primary "Ritual" mechanic. Users must manually tune to 1420 MHz (Hydrogen Line).
*   **Physics:** Implements inertial drag and magnetic locking.
*   **Drift:** Signal naturally drifts over time (simulating entropy), requiring user maintenance.

#### **2. The Threat Level Logic (`HUD.tsx`)**
*   **Contextualization:** Raw numbers are translated into human consequences.
    *   *Solar Wind > 600km/s* -> **"STORM VELOCITY"** (Red Alert)
    *   *Kp Index > 6* -> **"BLACKOUT WARNING"** (Glitch Effect)

#### **3. The Sentry (`Sentry.tsx`)**
*   **Role:** Floating "Toaster" notification system for critical alerts.
*   **Behavior:** Transient, high-priority overlays that trigger TTS announcements.

#### **4. Simulation Mode (`SimulationPanel.tsx`)**
*   **Trigger:** `Ctrl + Shift + S` (Hidden "God Mode").
*   **Function:** Allows the operator to inject mock data (e.g., "Carrington Event" scenario) to demonstrate extreme audio/visual states without waiting for real-world events.

---

## 4. THE "INTERFERENCE" MECHANIC

**The Concept:**
Simulating the **Radio Propagation** properties of the ionosphere.

**The Implementation:**
1.  **Stage 1 (Minor Storm):** High frequencies rolled off (Low-Pass Filter).
2.  **Stage 2 (Moderate Storm):** Pink Noise introduced.
3.  **Stage 3 (Blackout):** Signal gating and bit-crushing.

---

**End of Dossier**
*Prepared for: High-Level Architecture Review*
