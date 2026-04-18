import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Loader, AudioLines, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import useVoiceActions from '../hooks/useVoiceActions';
import type { ParserContext } from '../utils/voiceCommandParser';
import { useToast, ToastContainer } from './Toast';

interface VoiceAssistantProps {
    context: ParserContext;
    onRefresh: () => void;
}

const COMMAND_HINTS = [
    '"Create workout Push Day"',
    '"Add bench press 3 sets 10 reps"',
    '"Add set 12 reps 60 kg"',
    '"Add running 30 minutes 5 km"',
    '"Remove last set"',
    '"Log 2 eggs for breakfast"',
    '"Add 3 idlis to breakfast"',
    '"Log 200g chicken breast for lunch"',
    '"Log banana for snack"',
];

const VoiceAssistant = ({ context, onRefresh }: VoiceAssistantProps) => {
    const { toasts, show: showToast, dismiss } = useToast();
    const [showHints, setShowHints] = useState(false);
    const [currentHint, setCurrentHint] = useState(0);
    const [showPanel, setShowPanel] = useState(false);
    const [history, setHistory] = useState<{ text: string; type: 'success' | 'error' | 'info' }[]>([]);
    const historyEndRef = useRef<HTMLDivElement>(null);
    const waveformRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<number>(0);

    const {
        isListening,
        isTranscribing,
        transcript,
        audioLevelRef,
        error,
        isSupported,
        start,
        stop,
        processing,
        feedback,
        suggestions,
        clearSuggestions,
        clearAll,
        executeSuggestion,
        // Confirmation gate
        pendingConfirmation,
        confirmPending,
        dismissConfirmation,
    } = useVoiceActions({
        context,
        onRefresh,
        onActionComplete: (result) => {
            if (result.success) {
                showToast(result.message, 'success');
                setHistory(h => [...h, { text: result.message, type: 'success' }]);
            } else {
                showToast(result.message, 'error');
                setHistory(h => [...h, { text: result.message, type: 'error' }]);
            }
        },
    });

    // Cycle through hints while listening
    useEffect(() => {
        if (!isListening) return;
        const interval = setInterval(() => {
            setCurrentHint(h => (h + 1) % COMMAND_HINTS.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [isListening]);

    // Auto-scroll history
    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Add transcript to history as "you said"
    useEffect(() => {
        if (transcript) {
            setHistory(h => [...h, { text: `"${transcript}"`, type: 'info' }]);
        }
    }, [transcript]);

    // Show error as toast
    useEffect(() => {
        if (error) showToast(error, 'error');
    }, [error]);

    const isBusy = isListening || isTranscribing || processing;

    // Drive waveform bars via direct DOM updates — avoids re-rendering at 60fps
    useEffect(() => {
        if (!isListening) {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            return;
        }
        const bars = 5;
        const animate = () => {
            const container = waveformRef.current;
            if (container) {
                const level = audioLevelRef.current;
                for (let i = 0; i < bars; i++) {
                    const bar = container.children[i] as HTMLElement;
                    if (!bar) continue;
                    const center = Math.abs(i - Math.floor(bars / 2));
                    const base = 0.2;
                    const hh = Math.min(1, base + level * (1 - base) * (1 - center * 0.15));
                    bar.style.height = `${hh * 100}%`;
                }
            }
            animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [isListening, audioLevelRef]);

    if (!isSupported) return null;

    const toggleListening = () => {
        setShowHints(false); // always dismiss hints on tap/click
        if (isListening) {
            stop();
        } else if (!isTranscribing && !processing) {
            // Clear ALL state when starting fresh recording
            setHistory([]);
            clearAll();
            start();
            setShowPanel(true);
        }
    };

    const handleRecordAgain = () => {
        // Clear history and all pending state, then start fresh
        setHistory([]);
        clearAll();
        start();
    };

    const handleSuggestionClick = async (s: typeof suggestions[number]) => {
        setHistory(h => [...h, { text: `▶ ${s.label}`, type: 'info' }]);
        await executeSuggestion(s);
    };

    const handleConfirm = async () => {
        if (!pendingConfirmation) return;
        setHistory(h => [...h, { text: `✓ ${pendingConfirmation.summary}`, type: 'info' }]);
        await confirmPending();
    };

    const handleDismiss = () => {
        setHistory(h => [...h, { text: '✗ Cancelled', type: 'info' }]);
        dismissConfirmation();
    };

    const handleAltSuggestion = async (s: typeof suggestions[number]) => {
        setHistory(h => [...h, { text: `▶ ${s.label}`, type: 'info' }]);
        await executeSuggestion(s);
    };

    return (
        <>
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            {/* Floating Mic Button */}
            <button
                className={`voice-fab ${isListening ? 'voice-fab--active' : ''} ${isTranscribing ? 'voice-fab--transcribing' : ''} ${processing ? 'voice-fab--processing' : ''}`}
                onClick={toggleListening}
                title={isListening ? 'Stop listening' : isTranscribing ? 'Transcribing...' : 'Voice assistant'}
                onMouseEnter={() => !isBusy && !showPanel && setShowHints(true)}
                onMouseLeave={() => setShowHints(false)}
                onTouchStart={() => setShowHints(false)}
                disabled={isTranscribing || processing}
            >
                {isTranscribing || processing ? (
                    <Loader size={22} className="voice-fab-spinner" />
                ) : isListening ? (
                    <MicOff size={22} />
                ) : (
                    <Mic size={22} />
                )}
                {isListening && <span className="voice-fab-pulse" />}
                {isListening && <span className="voice-fab-pulse voice-fab-pulse--delayed" />}
            </button>

            {/* Hints tooltip — desktop hover only, never when panel is open */}
            {showHints && !isListening && !showPanel && (
                <div className="voice-hints">
                    <div className="voice-hints-title">Voice Commands</div>
                    {COMMAND_HINTS.slice(0, 5).map((h, i) => (
                        <div key={i} className="voice-hints-item">{h}</div>
                    ))}
                </div>
            )}

            {/* Listening Panel */}
            {showPanel && (
                <div className="voice-panel">
                    <div className="voice-panel-header">
                        <div className="voice-panel-title">
                            <span className={`voice-panel-dot ${isListening ? 'voice-panel-dot--live' : isTranscribing ? 'voice-panel-dot--transcribing' : pendingConfirmation ? 'voice-panel-dot--confirm' : ''}`} />
                            {isListening ? 'Listening...' : isTranscribing ? 'Transcribing...' : processing ? 'Executing...' : pendingConfirmation ? 'Confirm action' : 'Ready'}
                        </div>
                        <button className="btn-icon" onClick={() => { stop(); setShowPanel(false); clearAll(); }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Audio level waveform */}
                    {isListening && (
                        <div className="voice-panel-waveform" ref={waveformRef}>
                            {Array.from({ length: 5 }, (_, i) => (
                                <div key={i} className="voice-waveform-bar" />
                            ))}
                        </div>
                    )}

                    {/* Transcribing indicator */}
                    {isTranscribing && (
                        <div className="voice-panel-processing">
                            <AudioLines size={14} className="voice-panel-processing-icon" />
                            <span>Transcribing your voice...</span>
                        </div>
                    )}

                    {/* Processing indicator */}
                    {processing && feedback && (
                        <div className="voice-panel-processing">
                            <Loader size={14} className="voice-fab-spinner" />
                            <span>{feedback}</span>
                        </div>
                    )}

                    {/* Live transcript result */}
                    {!isListening && !isTranscribing && transcript && (
                        <div className="voice-panel-transcript">
                            <span className="voice-transcript-label">You said:</span>
                            <span className="voice-transcript-text">"{transcript}"</span>
                        </div>
                    )}

                    {/* Command hint when listening */}
                    {isListening && (
                        <div className="voice-panel-hint">
                            Try: {COMMAND_HINTS[currentHint]}
                        </div>
                    )}

                    {/* ── CONFIRMATION CARD ───────────────────────────────────── */}
                    {pendingConfirmation && !processing && !isListening && (
                        <div className="voice-confirm">
                            <div className="voice-confirm-header">
                                <Sparkles size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                                <span>Is this what you want?</span>
                            </div>

                            {/* What was recognized */}
                            <div className="voice-confirm-action">
                                <span className="voice-confirm-action-text">{pendingConfirmation.summary}</span>
                            </div>

                            {/* Confirm / Cancel buttons */}
                            <div className="voice-confirm-btns">
                                <button
                                    className="voice-confirm-btn voice-confirm-btn--yes"
                                    onClick={handleConfirm}
                                    disabled={processing}
                                >
                                    <CheckCircle2 size={15} />
                                    Yes, do it
                                </button>
                                <button
                                    className="voice-confirm-btn voice-confirm-btn--no"
                                    onClick={handleDismiss}
                                >
                                    <XCircle size={15} />
                                    Cancel
                                </button>
                            </div>

                            {/* Alternative suggestions */}
                            {pendingConfirmation.suggestions.length > 0 && (
                                <>
                                    <div className="voice-confirm-alt-label">Or did you mean…?</div>
                                    <div className="voice-suggestions-list">
                                        {pendingConfirmation.suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                className="voice-suggestion-chip"
                                                onClick={() => handleAltSuggestion(s)}
                                                disabled={processing}
                                            >
                                                <span className="voice-suggestion-icon">▶</span>
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Smart Suggestions (only shown when there's no pending confirm) ── */}
                    {suggestions.length > 0 && !pendingConfirmation && !processing && !isListening && (
                        <div className="voice-suggestions">
                            <div className="voice-suggestions-header">
                                <Sparkles size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                                <span>Did you mean…?</span>
                                <button
                                    className="voice-suggestions-dismiss"
                                    onClick={clearSuggestions}
                                    title="Dismiss"
                                >
                                    <X size={11} />
                                </button>
                            </div>
                            <div className="voice-suggestions-list">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        className="voice-suggestion-chip"
                                        onClick={() => handleSuggestionClick(s)}
                                        disabled={processing}
                                    >
                                        <span className="voice-suggestion-icon">▶</span>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* History */}
                    {history.length > 0 && (
                        <div className="voice-panel-history">
                            {history.map((h, i) => (
                                <div key={i} className={`voice-history-item voice-history-item--${h.type}`}>
                                    {h.text}
                                </div>
                            ))}
                            <div ref={historyEndRef} />
                        </div>
                    )}

                    {/* Record again button — only show when not confirming */}
                    {!isListening && !isTranscribing && !processing && !pendingConfirmation && (
                        <div className="voice-panel-footer">
                            <button className="voice-record-again" onClick={handleRecordAgain}>
                                <Mic size={14} />
                                Record again
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default VoiceAssistant;
