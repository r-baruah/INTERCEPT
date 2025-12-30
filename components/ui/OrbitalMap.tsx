'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore } from '@/store/audioStore';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
}

interface Star {
    x: number;
    y: number;
    size: number;
    twinkleOffset: number;
    twinkleSpeed: number;
}

/**
 * OrbitalMap Component
 * 
 * Displays an animated solar system visualization with:
 * - Glowing sun with corona effect
 * - Orbiting satellites (DSCOVR, ACE, SOHO)
 * - Particle system for solar wind
 * - Aurora effect overlay during geomagnetic storms
 * - Twinkling star background
 */
export function OrbitalMap() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { spaceWeatherData, isPlaying } = useAudioStore();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Setup dimensions
        let width = 0;
        let height = 0;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        };
        resize();
        window.addEventListener('resize', resize);

        // Animation state
        let frameId: number;
        let time = 0;

        // Initialize stars
        const stars: Star[] = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 1.5 + 0.5,
                twinkleOffset: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 2 + 1,
            });
        }

        // Initialize particles for solar wind
        const particles: Particle[] = [];
        const maxParticles = 50;

        // Orbital paths and satellites
        const orbits = [
            { radius: 0.2, speed: 0.5, color: 'rgba(255,255,255,0.15)' },
            { radius: 0.35, speed: 0.3, color: 'rgba(255,255,255,0.08)' },
            { radius: 0.5, speed: 0.2, color: 'rgba(255,255,255,0.05)' },
        ];

        const satellites = [
            { orbitIdx: 0, angle: 0, size: 2.5, label: 'DSCOVR', color: '#4ade80' },
            { orbitIdx: 1, angle: 2, size: 2, label: 'ACE', color: '#60a5fa' },
            { orbitIdx: 1, angle: 4, size: 2, label: 'SOHO', color: '#f59e0b' },
        ];

        // Spawn particle from sun
        const spawnParticle = (cx: number, cy: number, multiplier: number = 1) => {
            if (particles.length >= maxParticles) return;

            const angle = Math.random() * Math.PI * 2;
            // Speed scaled by wind multiplier (solar wind speed)
            const speed = (Math.random() * 1 + 0.5) * (isPlaying ? 1.5 : 0.8) * multiplier;

            particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: 1,
                size: Math.random() * 2 + 1,
            });
        };

        const render = () => {
            time += 0.016;
            const cx = width / 2;
            const cy = height / 2;
            const minDim = Math.min(width, height);

            // Clear with gradient background
            const bgGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.6);
            bgGradient.addColorStop(0, '#0a0a1a');
            bgGradient.addColorStop(0.5, '#050510');
            bgGradient.addColorStop(1, '#000000');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            // Draw stars with twinkling
            stars.forEach(star => {
                const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
                ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.5})`;
                ctx.beginPath();
                ctx.arc(star.x * width, star.y * height, star.size * twinkle, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw grid (subtle)
            ctx.strokeStyle = 'rgba(255,255,255,0.015)';
            ctx.lineWidth = 1;
            const gridSize = 50;
            const shiftY = (time * 8) % gridSize;

            for (let x = 0; x < width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            for (let y = -gridSize + shiftY; y < height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // Get storm intensity for visual effects
            const kpIndex = spaceWeatherData?.geomagnetic.kp_index || 0;
            const isStorming = kpIndex >= 5;
            const stormIntensity = Math.min(1, (kpIndex - 4) / 5);

            // Draw aurora effect during storms
            if (isStorming) {
                ctx.save();
                const auroraGradient = ctx.createLinearGradient(0, 0, width, 0);
                auroraGradient.addColorStop(0, 'transparent');
                auroraGradient.addColorStop(0.3, `rgba(74, 222, 128, ${0.03 * stormIntensity})`);
                auroraGradient.addColorStop(0.5, `rgba(96, 165, 250, ${0.05 * stormIntensity})`);
                auroraGradient.addColorStop(0.7, `rgba(167, 139, 250, ${0.03 * stormIntensity})`);
                auroraGradient.addColorStop(1, 'transparent');

                ctx.fillStyle = auroraGradient;
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
            }

            // Draw orbits
            orbits.forEach((orbit) => {
                ctx.beginPath();
                ctx.arc(cx, cy, orbit.radius * minDim, 0, Math.PI * 2);
                ctx.strokeStyle = orbit.color;
                ctx.lineWidth = 1;
                ctx.stroke();
            });

            // Draw Sun with corona glow
            const sunRadius = minDim * 0.05;
            const pulseAmount = isPlaying ? Math.sin(time * 2) * 0.15 + 1 : 1;

            // Corona glow layers
            for (let i = 4; i >= 0; i--) {
                const glowRadius = sunRadius * (1 + i * 0.4) * pulseAmount;
                const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${0.3 / (i + 1)})`);
                gradient.addColorStop(0.5, `rgba(255, 220, 150, ${0.15 / (i + 1)})`);
                gradient.addColorStop(1, 'transparent');

                ctx.beginPath();
                ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            // Sun core
            ctx.beginPath();
            ctx.arc(cx, cy, sunRadius * pulseAmount, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 30;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
            ctx.shadowBlur = 0;

            // Reactive Particle Spawning logic
            // Base speed ~400km/s. Higher speed = more particles + faster particles
            const windSpeed = spaceWeatherData?.solar_wind.speed || 400;
            const windMultiplier = Math.max(0.5, Math.min(3, windSpeed / 400));

            // Spawn probability increases with wind speed
            // Base threshold 0.7 (30% chance). High wind (multiplier 2) -> 0.4 (60% chance)
            const spawnThreshold = Math.max(0.1, 0.82 - (windMultiplier * 0.15));

            if (isPlaying && Math.random() > spawnThreshold) {
                spawnParticle(cx, cy, windMultiplier);
            }

            // Update and draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.01;

                if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
                    particles.splice(i, 1);
                    continue;
                }

                const alpha = p.life * 0.5;
                ctx.fillStyle = `rgba(255, 220, 150, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw satellites
            satellites.forEach(sat => {
                const orbit = orbits[sat.orbitIdx];
                sat.angle += 0.005 * orbit.speed;

                const sx = cx + Math.cos(sat.angle) * orbit.radius * minDim;
                const sy = cy + Math.sin(sat.angle) * orbit.radius * minDim;

                // Satellite glow
                ctx.shadowBlur = 8;
                ctx.shadowColor = sat.color;

                // Satellite dot
                ctx.beginPath();
                ctx.arc(sx, sy, sat.size, 0, Math.PI * 2);
                ctx.fillStyle = sat.color;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Connection line
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + 8, sy);
                ctx.stroke();

                // Label
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = '9px "JetBrains Mono", monospace';
                ctx.fillText(sat.label, sx + 12, sy + 3);
            });

            // Draw orbit legend
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.fillText('L1 ORBIT', 10, height - 10);

            frameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(frameId);
        };
    }, [spaceWeatherData, isPlaying]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full block"
            role="img"
            aria-label="Solar system orbital visualization showing sun, satellite positions, and solar wind particles"
        />
    );
}
