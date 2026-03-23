import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Loader, Bot, User, Trash2, AudioLines } from 'lucide-react';
import API from '../api/axios';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatAction {
    type: string;
    title?: string;
    exerciseId?: string;
    exerciseName?: string;
    category?: string;
    setCount?: number;
    reps?: number;
    weight?: number;
    foodId?: string;
    foodName?: string;
    quantity?: number;
    mealType?: string;
    description?: string;
    [key: string]: any;
}

const CHAT_STORAGE_KEY = 'fitforge_ai_chat_history';

function loadChatHistory(): ChatMessage[] {
    try {
        const stored = sessionStorage.getItem(CHAT_STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch {
        return [];
    }
}

function saveChatHistory(messages: ChatMessage[]) {
    try {
        sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
        // storage full or unavailable
    }
}

async function executeActions(actions: ChatAction[]): Promise<string[]> {
    const results: string[] = [];
    let lastCreatedWorkoutId: string | null = null;

    for (const action of actions) {
        try {
            switch (action.type) {
                case 'CREATE_WORKOUT': {
                    const { data } = await API.post('/workouts', {
                        date: new Date().toISOString(),
                        title: action.title || 'Workout',
                        duration: 0,
                        entries: [],
                    });
                    lastCreatedWorkoutId = data._id;
                    results.push(`✅ Created workout "${action.title}"`);
                    break;
                }

                case 'ADD_EXERCISE_WITH_SETS': {
                    if (!action.exerciseId) {
                        results.push(`❌ Exercise "${action.exerciseName}" not found`);
                        break;
                    }
                    if (!lastCreatedWorkoutId) {
                        results.push(`❌ No active workout to add "${action.exerciseName}" to`);
                        break;
                    }
                    const { data: workout } = await API.get(`/workouts/${lastCreatedWorkoutId}`);
                    const existingEntries = (workout.entries || []).map((e: any) => ({
                        exerciseId: e.exerciseId?._id || e.exerciseId,
                        sets: e.sets || [],
                        duration: e.duration || 0,
                        distance: e.distance || 0,
                    }));
                    const sets = Array.from({ length: action.setCount || 1 }, () => ({
                        reps: action.reps || 0,
                        weight: action.weight || 0,
                    }));
                    await API.put(`/workouts/${lastCreatedWorkoutId}`, {
                        entries: [...existingEntries, {
                            exerciseId: action.exerciseId,
                            sets,
                            duration: 0,
                            distance: 0,
                        }],
                    });
                    results.push(`✅ Added ${action.exerciseName} — ${action.setCount || 1} sets`);
                    break;
                }

                case 'LOG_MEAL': {
                    if (!action.foodId) {
                        results.push(`❌ Food "${action.foodName}" not found`);
                        break;
                    }
                    await API.post('/meals', {
                        date: new Date().toISOString(),
                        mealType: action.mealType || 'snack',
                        foodItemId: action.foodId,
                        quantity: action.quantity || 100,
                    });
                    results.push(`✅ Logged ${action.foodName} for ${action.mealType || 'snack'}`);
                    break;
                }

                case 'DELETE_WORKOUT': {
                    if (lastCreatedWorkoutId) {
                        await API.delete(`/workouts/${lastCreatedWorkoutId}`);
                        lastCreatedWorkoutId = null;
                        results.push('✅ Workout deleted');
                    } else {
                        results.push('❌ No active workout to delete');
                    }
                    break;
                }

                default:
                    break;
            }
        } catch (err: any) {
            results.push(`❌ Failed: ${action.description || action.type} — ${err?.response?.data?.message || 'error'}`);
        }
    }
    return results;
}

// ── Audio recording hook (reusable, minimal) ──
function useAudioRecorder() {
    const [recording, setRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioLevelRef = useRef(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const animRef = useRef<number>(0);
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hadSpeechRef = useRef(false);
    const onStopRef = useRef<((blob: Blob) => void) | null>(null);

    const cleanup = useCallback(() => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        animRef.current = 0;
        audioLevelRef.current = 0;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        audioCtxRef.current?.close().catch(() => {});
        audioCtxRef.current = null;
        analyserRef.current = null;
        mediaRecorderRef.current = null;
    }, []);

    const startRecording = useCallback(async (onDone: (blob: Blob) => void) => {
        if (recording || transcribing) return;

        onStopRef.current = onDone;
        hadSpeechRef.current = false;
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
            });
            streamRef.current = stream;

            // Analyser
            const audioCtx = new AudioContext();
            audioCtxRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.5;
            source.connect(analyser);
            analyserRef.current = analyser;

            const bufLen = analyser.frequencyBinCount;
            const dataArr = new Uint8Array(bufLen);
            let stopped = false;

            const monitor = () => {
                if (stopped) return;
                analyser.getByteFrequencyData(dataArr);
                let sum = 0;
                for (let i = 0; i < bufLen; i++) sum += dataArr[i] * dataArr[i];
                const rms = Math.sqrt(sum / bufLen) / 255;
                audioLevelRef.current = rms;

                if (rms > 0.06) {
                    hadSpeechRef.current = true;
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                } else if (hadSpeechRef.current && !silenceTimerRef.current) {
                    silenceTimerRef.current = setTimeout(() => {
                        if (mediaRecorderRef.current?.state === 'recording') {
                            mediaRecorderRef.current.stop();
                        }
                    }, 3000);
                }
                animRef.current = requestAnimationFrame(monitor);
            };
            monitor();

            // Recorder
            const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
            const mime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
            const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = () => {
                stopped = true;
                cleanup();
                setRecording(false);
                const blob = new Blob(chunksRef.current, { type: mime || 'audio/webm' });
                chunksRef.current = [];
                if (hadSpeechRef.current && blob.size > 1000) {
                    onStopRef.current?.(blob);
                }
            };

            recorder.start(250);
            setRecording(true);
        } catch {
            cleanup();
        }
    }, [recording, transcribing, cleanup]);

    const stopRecording = useCallback(() => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        } else {
            cleanup();
            setRecording(false);
        }
    }, [cleanup]);

    useEffect(() => {
        return () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (animRef.current) cancelAnimationFrame(animRef.current);
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
            streamRef.current?.getTracks().forEach(t => t.stop());
            audioCtxRef.current?.close().catch(() => {});
        };
    }, []);

    return { recording, transcribing, setTranscribing, startRecording, stopRecording, audioLevelRef };
}

// ── Main page ──
const AIAssistantPage = () => {
    const [messages, setMessages] = useState<ChatMessage[]>(loadChatHistory);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const waveformRef = useRef<HTMLDivElement>(null);
    const waveAnimRef = useRef<number>(0);

    const { recording, transcribing, setTranscribing, startRecording, stopRecording, audioLevelRef } = useAudioRecorder();

    const isBusy = loading || recording || transcribing;

    // Persist messages to sessionStorage on every change
    useEffect(() => {
        saveChatHistory(messages);
    }, [messages]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Waveform animation via refs
    useEffect(() => {
        if (!recording) {
            if (waveAnimRef.current) cancelAnimationFrame(waveAnimRef.current);
            return;
        }
        const bars = 7;
        const animate = () => {
            const container = waveformRef.current;
            if (container) {
                const level = audioLevelRef.current;
                for (let i = 0; i < bars; i++) {
                    const bar = container.children[i] as HTMLElement;
                    if (!bar) continue;
                    const center = Math.abs(i - Math.floor(bars / 2));
                    const h = 0.15 + level * 0.85 * (1 - center * 0.1);
                    bar.style.height = `${Math.min(1, h) * 100}%`;
                }
            }
            waveAnimRef.current = requestAnimationFrame(animate);
        };
        waveAnimRef.current = requestAnimationFrame(animate);
        return () => { if (waveAnimRef.current) cancelAnimationFrame(waveAnimRef.current); };
    }, [recording, audioLevelRef]);

    // Build history for context
    const getHistory = useCallback(() => {
        return messages.map(m => ({ role: m.role, content: m.content }));
    }, [messages]);

    // Send text message
    const sendTextMessage = useCallback(async (text: string) => {
        if (!text.trim() || isBusy) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text.trim(),
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('message', text.trim());
            formData.append('history', JSON.stringify(getHistory()));

            const { data } = await API.post('/voice/chat', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 30000,
            });

            // Execute any actions returned by the AI
            let actionResults: string[] = [];
            if (data.actions && data.actions.length > 0) {
                actionResults = await executeActions(data.actions);
            }

            const responseContent = actionResults.length > 0
                ? `${data.response || 'Done!'}\n\n${actionResults.join('\n')}`
                : (data.response || 'No response received.');

            const assistantMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseContent,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err: any) {
            const errMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: err?.response?.data?.message || 'Sorry, something went wrong. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setLoading(false);
        }
    }, [isBusy, getHistory]);

    // Send voice message
    const handleVoiceDone = useCallback(async (blob: Blob) => {
        setTranscribing(true);

        // Show a placeholder user message
        const placeholderId = Date.now().toString();
        setMessages(prev => [...prev, {
            id: placeholderId,
            role: 'user',
            content: '🎤 Transcribing...',
            timestamp: new Date(),
        }]);

        try {
            const formData = new FormData();
            formData.append('audio', blob, 'voice.webm');
            formData.append('history', JSON.stringify(getHistory()));

            const { data } = await API.post('/voice/chat', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 30000,
            });

            // Update placeholder with actual transcript
            setMessages(prev => prev.map(m =>
                m.id === placeholderId
                    ? { ...m, content: data.transcript || 'Voice message' }
                    : m
            ));

            // Execute any actions returned by the AI
            let actionResults: string[] = [];
            if (data.actions && data.actions.length > 0) {
                actionResults = await executeActions(data.actions);
            }

            const responseContent = actionResults.length > 0
                ? `${data.response || 'Done!'}\n\n${actionResults.join('\n')}`
                : (data.response || 'No response received.');

            const assistantMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseContent,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err: any) {
            setMessages(prev => prev.map(m =>
                m.id === placeholderId
                    ? { ...m, content: 'Failed to transcribe voice' }
                    : m
            ));
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: err?.response?.data?.message || 'Sorry, something went wrong.',
                timestamp: new Date(),
            }]);
        } finally {
            setTranscribing(false);
        }
    }, [getHistory, setTranscribing]);

    const handleVoiceClick = () => {
        if (recording) {
            stopRecording();
        } else {
            startRecording(handleVoiceDone);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendTextMessage(inputText);
        }
    };

    const clearChat = () => {
        setMessages([]);
        sessionStorage.removeItem(CHAT_STORAGE_KEY);
    };

    // Format message content with basic markdown-like rendering
    const formatContent = (text: string) => {
        // Split by double newline for paragraphs
        return text.split('\n').map((line, i) => {
            // Bold
            const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            // Bullet points
            if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                return <div key={i} className="ai-chat-bullet" dangerouslySetInnerHTML={{ __html: '• ' + formatted.replace(/^[-•]\s*/, '') }} />;
            }
            if (line.trim() === '') return <br key={i} />;
            return <div key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
        });
    };

    return (
        <div className="ai-assistant-page">
            <div className="ai-assistant-container">
                {/* Header */}
                <div className="ai-assistant-header">
                    <div className="ai-assistant-header-left">
                        <div className="ai-assistant-avatar">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h2>FitForge AI</h2>
                            <span className="ai-assistant-subtitle">Your personal fitness assistant</span>
                        </div>
                    </div>
                    {messages.length > 0 && (
                        <button className="btn-icon" onClick={clearChat} title="Clear chat">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                {/* Messages */}
                <div className="ai-chat-messages">
                    {messages.length === 0 && (
                        <div className="ai-chat-empty">
                            <Bot size={40} />
                            <h3>Hey! I'm your FitForge AI assistant</h3>
                            <p>Ask me anything about your fitness journey — I have access to your workout history, nutrition logs, and profile data.</p>
                            <div className="ai-chat-suggestions">
                                <button onClick={() => sendTextMessage('How am I doing with my calorie goals this week?')}>
                                    How am I doing with my calorie goals?
                                </button>
                                <button onClick={() => sendTextMessage('Create a workout plan for building muscle')}>
                                    Create a workout plan for me
                                </button>
                                <button onClick={() => sendTextMessage('Suggest a diet plan based on my goals')}>
                                    Suggest a diet plan
                                </button>
                                <button onClick={() => sendTextMessage('What muscles have I been neglecting?')}>
                                    What muscles am I neglecting?
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={`ai-chat-message ai-chat-message--${msg.role}`}>
                            <div className="ai-chat-message-avatar">
                                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>
                            <div className="ai-chat-message-content">
                                {msg.role === 'assistant' ? formatContent(msg.content) : msg.content}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="ai-chat-message ai-chat-message--assistant">
                            <div className="ai-chat-message-avatar">
                                <Bot size={14} />
                            </div>
                            <div className="ai-chat-message-content ai-chat-typing">
                                <span /><span /><span />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Recording waveform */}
                {recording && (
                    <div className="ai-chat-recording">
                        <div className="ai-chat-recording-waveform" ref={waveformRef}>
                            {Array.from({ length: 7 }, (_, i) => (
                                <div key={i} className="ai-waveform-bar" />
                            ))}
                        </div>
                        <span className="ai-chat-recording-label">Listening... speak now</span>
                    </div>
                )}

                {transcribing && (
                    <div className="ai-chat-recording">
                        <AudioLines size={16} className="ai-transcribing-icon" />
                        <span className="ai-chat-recording-label">Transcribing your voice...</span>
                    </div>
                )}

                {/* Input */}
                <div className="ai-chat-input-area">
                    <textarea
                        ref={inputRef}
                        className="ai-chat-input"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your fitness, nutrition, or workout plans..."
                        rows={1}
                        disabled={isBusy}
                    />
                    <div className="ai-chat-input-actions">
                        <button
                            className={`ai-chat-voice-btn ${recording ? 'ai-chat-voice-btn--active' : ''}`}
                            onClick={handleVoiceClick}
                            disabled={loading || transcribing}
                            title={recording ? 'Stop recording' : 'Voice input'}
                        >
                            {transcribing ? (
                                <Loader size={18} className="voice-fab-spinner" />
                            ) : recording ? (
                                <MicOff size={18} />
                            ) : (
                                <Mic size={18} />
                            )}
                        </button>
                        <button
                            className="ai-chat-send-btn"
                            onClick={() => sendTextMessage(inputText)}
                            disabled={!inputText.trim() || isBusy}
                            title="Send message"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAssistantPage;
