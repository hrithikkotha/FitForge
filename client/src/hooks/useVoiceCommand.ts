import { useState, useRef, useCallback, useEffect } from 'react';
import API from '../api/axios';
import type { VoiceAction } from '../utils/voiceCommandParser';

export interface VoiceAIResult {
    transcript: string;
    action: VoiceAction;
}

export interface UseVoiceCommandReturn {
    isListening: boolean;
    isTranscribing: boolean;
    transcript: string;
    audioLevel: number;   // 0–1 for visualization
    error: string | null;
    isSupported: boolean;
    start: () => void;
    stop: () => void;
}

// Context payload sent to server for LLM parsing
export interface VoiceContext {
    exercises: { id: string; name: string; category: string }[];
    foods: { id: string; name: string; servingUnit?: string }[];
    activeWorkoutId: string | null;
    lastExerciseName: string | null;
}

interface UseVoiceCommandOptions {
    context: VoiceContext;
    onResult?: (result: VoiceAIResult) => void;
    silenceTimeout?: number;    // ms of silence before auto-stop (default 3000)
    silenceThreshold?: number;  // audio level threshold (default 0.06)
}

const PREFERRED_MIME = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
];

function getSupportedMime(): string {
    for (const mime of PREFERRED_MIME) {
        if (MediaRecorder.isTypeSupported(mime)) return mime;
    }
    return '';
}

const useVoiceCommand = ({
    context,
    onResult,
    silenceTimeout = 3000,
    silenceThreshold = 0.06,
}: UseVoiceCommandOptions): UseVoiceCommandReturn => {

    const [isListening, setIsListening] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number>(0);
    const chunksRef = useRef<Blob[]>([]);
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hadSpeechRef = useRef(false);
    const isStoppedRef = useRef(false);
    const silenceStoppedRef = useRef(false);
    const onResultRef = useRef(onResult);
    const contextRef = useRef(context);

    const isSupported = typeof MediaRecorder !== 'undefined'
        && typeof navigator.mediaDevices?.getUserMedia === 'function';

    useEffect(() => { onResultRef.current = onResult; }, [onResult]);
    useEffect(() => { contextRef.current = context; }, [context]);

    // ── Cleanup helpers ──
    const stopAudioAnalysis = useCallback(() => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
        setAudioLevel(0);
    }, []);

    const releaseStream = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        audioContextRef.current?.close().catch(() => {});
        audioContextRef.current = null;
        analyserRef.current = null;
    }, []);

    // ── Send recorded audio to server for AI processing ──
    const processAudio = useCallback(async (blob: Blob) => {
        if (blob.size < 1000) return;  // skip tiny/empty recordings

        setIsTranscribing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('audio', blob, 'voice.webm');
            formData.append('context', JSON.stringify(contextRef.current));

            const { data } = await API.post('/voice/transcribe', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 30000,
            });

            if (data.transcript) {
                setTranscript(data.transcript);
                onResultRef.current?.({
                    transcript: data.transcript,
                    action: data.action,
                });
            } else {
                setError('No speech detected. Try again.');
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to process voice. Try again.';
            setError(msg);
        } finally {
            setIsTranscribing(false);
        }
    }, []);

    // ── Start recording ──
    const start = useCallback(async () => {
        if (isListening || isTranscribing) return;

        setError(null);
        setTranscript('');
        isStoppedRef.current = false;
        silenceStoppedRef.current = false;
        hadSpeechRef.current = false;
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                },
            });
            streamRef.current = stream;

            // ── Audio analysis for level meter + silence detection ──
            const audioCtx = new AudioContext();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.5;
            source.connect(analyser);
            analyserRef.current = analyser;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const monitorLevel = () => {
                if (isStoppedRef.current) return;
                analyser.getByteFrequencyData(dataArray);

                // Calculate RMS level normalized to 0–1
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) sum += dataArray[i] * dataArray[i];
                const rms = Math.sqrt(sum / bufferLength) / 255;
                setAudioLevel(rms);

                // Silence detection
                if (rms > silenceThreshold) {
                    hadSpeechRef.current = true;
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                } else if (hadSpeechRef.current && !silenceTimerRef.current) {
                    silenceTimerRef.current = setTimeout(() => {
                        // Silence auto-stop — mark so onstop knows to process
                        silenceStoppedRef.current = true;
                        if (mediaRecorderRef.current?.state === 'recording') {
                            mediaRecorderRef.current.stop();
                        }
                    }, silenceTimeout);
                }

                animFrameRef.current = requestAnimationFrame(monitorLevel);
            };
            monitorLevel();

            // ── MediaRecorder ──
            const mimeType = getSupportedMime();
            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                stopAudioAnalysis();
                setIsListening(false);

                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }

                const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
                chunksRef.current = [];

                releaseStream();

                // Process audio if speech was detected (silence auto-stop or manual stop)
                if (hadSpeechRef.current) {
                    processAudio(blob);
                }
            };

            recorder.start(250);
            setIsListening(true);
        } catch (err: any) {
            if (err.name === 'NotAllowedError') {
                setError('Microphone access denied. Allow microphone permissions.');
            } else {
                setError('Could not access microphone.');
            }
            releaseStream();
        }
    }, [isListening, isTranscribing, silenceTimeout, silenceThreshold, processAudio, stopAudioAnalysis, releaseStream]);

    // ── Manual stop ──
    const stop = useCallback(() => {
        isStoppedRef.current = true;

        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        } else {
            stopAudioAnalysis();
            releaseStream();
            setIsListening(false);
        }
    }, [stopAudioAnalysis, releaseStream]);

    // ── Cleanup on unmount ──
    useEffect(() => {
        return () => {
            isStoppedRef.current = true;
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            streamRef.current?.getTracks().forEach(t => t.stop());
            audioContextRef.current?.close().catch(() => {});
        };
    }, []);

    return { isListening, isTranscribing, transcript, audioLevel, error, isSupported, start, stop };
};

export default useVoiceCommand;
