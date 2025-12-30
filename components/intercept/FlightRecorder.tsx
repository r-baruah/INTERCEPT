'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAudioStore } from '@/store/audioStore';

interface FlightRecorderProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
}

/**
 * FLIGHT RECORDER - Native Video Export
 * 
 * "Your proof. Their viral loop."
 * Captures canvas + audio as .webm for instant social sharing.
 */
export function FlightRecorder({ canvasRef }: FlightRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [countdown, setCountdown] = useState(15);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [progress, setProgress] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const { audioEngine } = useAudioStore();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startRecording = useCallback(async () => {
        if (!canvasRef.current) {
            console.error('[FlightRecorder] No canvas reference');
            return;
        }

        try {
            // 1. Capture canvas stream at 30fps
            const canvasStream = canvasRef.current.captureStream(30);

            // 2. Try to get audio stream from Tone.js context
            let combinedStream = canvasStream;

            if (audioEngine) {
                try {
                    // @ts-ignore - Accessing Tone.js internals
                    const toneContext = (await import('tone')).getContext();
                    const audioDestination = toneContext.createMediaStreamDestination();

                    // Connect master output to the destination
                    // @ts-ignore
                    const master = (await import('tone')).getDestination();
                    master.connect(audioDestination);

                    // Combine canvas video + audio tracks
                    const audioTrack = audioDestination.stream.getAudioTracks()[0];
                    if (audioTrack) {
                        combinedStream = new MediaStream([
                            ...canvasStream.getVideoTracks(),
                            audioTrack
                        ]);
                        console.log('[FlightRecorder] Audio track added successfully');
                    }
                } catch (audioErr) {
                    console.warn('[FlightRecorder] Could not capture audio:', audioErr);
                }
            }

            // 3. Create MediaRecorder
            const options = { mimeType: 'video/webm;codecs=vp9' };
            let recorder: MediaRecorder;

            try {
                recorder = new MediaRecorder(combinedStream, options);
            } catch (e) {
                // Fallback to VP8
                recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp8' });
            }

            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                // Create blob and trigger download
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `intercept_capture_${timestamp}.webm`;

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                setIsRecording(false);
                setCountdown(15);
                setProgress(0);
                setShowCompletionModal(true);

                console.log('[FlightRecorder] Recording saved:', filename);
            };

            // 4. Start recording
            mediaRecorderRef.current = recorder;
            recorder.start(1000); // Collect data every second
            setIsRecording(true);
            setCountdown(15);
            setProgress(0);

            // 5. Start countdown & Progress
            const totalDuration = 15;
            const startTime = Date.now();

            countdownIntervalRef.current = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                const remaining = Math.max(0, totalDuration - elapsed);
                const progressValue = Math.min(100, (elapsed / totalDuration) * 100);

                setCountdown(Math.ceil(remaining));
                setProgress(progressValue);

                if (remaining <= 0) {
                    // Stop recording
                    if (countdownIntervalRef.current) {
                        clearInterval(countdownIntervalRef.current);
                    }
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                        mediaRecorderRef.current.stop();
                    }
                }
            }, 100);

            console.log('[FlightRecorder] Recording started');

        } catch (error) {
            console.error('[FlightRecorder] Failed to start recording:', error);
            setIsRecording(false);
        }
    }, [canvasRef, audioEngine]);

    const stopRecording = useCallback(() => {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    return (
        <>
            {/* Main Recorder Control */}
            <div className="flex flex-col items-end gap-2">

                {/* Status Indicator */}
                {isRecording && (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-red-400 tracking-widest animate-pulse">
                            RECORDING IN PROGRESS
                        </span>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    </div>
                )}

                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`
                        group relative flex items-center justify-between
                        w-48 h-12 px-1
                        bg-black/80 backdrop-blur-md
                        border border-zinc-800
                        transition-all duration-300
                        ${isRecording
                            ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                            : 'hover:border-zinc-500 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                        }
                    `}
                >
                    {/* Background Progress Bar (Fill) */}
                    <div
                        className="absolute inset-0 bg-red-900/20 transition-all duration-100 ease-linear pointer-events-none"
                        style={{ width: isRecording ? `${progress}%` : '0%' }}
                    />

                    {/* Left Icon Area */}
                    <div className="flex items-center justify-center w-10 h-10 bg-zinc-900 border border-zinc-800 z-10 transition-colors group-hover:border-zinc-700">
                        {isRecording ? (
                            <div className="w-3 h-3 bg-red-500 rounded-sm animate-pulse" />
                        ) : (
                            <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" />
                                <circle cx="12" cy="12" r="3" fill="currentColor" className="text-red-500" />
                            </svg>
                        )}
                    </div>

                    {/* Text / Timer Area */}
                    <div className="flex-1 flex flex-col items-end mr-3 z-10">
                        <span className={`
                            font-mono text-[10px] tracking-widest
                            ${isRecording ? 'text-red-400' : 'text-zinc-500 group-hover:text-zinc-300'}
                        `}>
                            {isRecording ? 'CAPTURING' : 'FLIGHT RECORDER'}
                        </span>
                        <span className={`
                            font-mono text-sm font-bold tabular-nums
                            ${isRecording ? 'text-white' : 'text-zinc-400'}
                        `}>
                            {isRecording
                                ? `00:${countdown.toString().padStart(2, '0')}`
                                : 'READY'
                            }
                        </span>
                    </div>

                    {/* Corner Reticles */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>

            {/* Completion Modal */}
            {showCompletionModal && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md"
                    onClick={() => setShowCompletionModal(false)}
                >
                    <div
                        className="relative bg-black border border-zinc-800 p-1 w-full max-w-lg overflow-hidden group"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Scanline Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%]" />

                        {/* Inner Container */}
                        <div className="relative z-10 bg-zinc-950/80 p-8 border border-zinc-800/50">

                            {/* Header */}
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <div className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] mb-1">
                                        SECURE TRANSMISSION
                                    </div>
                                    <div className="font-mono text-2xl text-white tracking-widest">
                                        DATA SECURED
                                    </div>
                                </div>
                                <div className="p-2 border border-green-500/20 bg-green-500/10">
                                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Info Block */}
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                    <span className="font-mono text-xs text-zinc-600">STATUS</span>
                                    <span className="font-mono text-xs text-green-400">ARCHIVED</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                    <span className="font-mono text-xs text-zinc-600">FORMAT</span>
                                    <span className="font-mono text-xs text-zinc-400">WEBM / VP9</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                    <span className="font-mono text-xs text-zinc-600">LOCATION</span>
                                    <span className="font-mono text-xs text-zinc-400">LOCAL STORAGE / DOWNLOADS</span>
                                </div>
                            </div>

                            {/* Footer / Actions */}
                            <button
                                onClick={() => setShowCompletionModal(false)}
                                className="w-full py-3 border border-zinc-700 bg-zinc-900/50 text-zinc-400 font-mono text-xs hover:bg-white hover:text-black hover:border-white transition-all duration-300"
                            >
                                CLOSE TRANSMISSION LOG
                            </button>
                        </div>

                        {/* Animated Border Gradient */}
                        <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-green-500/50 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </div>
                </div>
            )}
        </>
    );
}
