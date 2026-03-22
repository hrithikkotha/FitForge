import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Loader, AudioLines } from 'lucide-react';
import useVoiceActions from '../hooks/useVoiceActions';
import type { ParserContext } from '../utils/voiceCommandParser';
import { useToast, ToastContainer } from './Toast';

interface VoiceAssistantProps {
    context: ParserContext;
    onRefresh: () => void;
}

const COMMAND_HINTS = [
    '"Create workout Push Day"',
    '"Add bench press"',
    '"Add set 12 reps 60 kg"',
    '"Add 3 sets 10 reps 50 kg"',
    '"Add running 30 minutes 5 km"',
    '"Remove last set"',
    '"Log 2 eggs for breakfast"',
];

const VoiceAssistant = ({ context, onRefresh }: VoiceAssistantProps) => {
    const { toasts, show: showToast, dismiss } = useToast();
    const [showHints, setShowHints] = useState(false);
    const [currentHint, setCurrentHint] = useState(0);
    const [showPanel, setShowPanel] = useState(false);
    const [history, setHistory] = useState<{ text: string; type: 'success' | 'error' | 'info' }[]>([]);
    const historyEndRef = useRef<HTMLDivElement>(null);

    const {
        isListening,
        isTranscribing,
        transcript,
        audioLevel,
        error,
        isSupported,
        start,
        stop,
        processing,
        feedback,
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

    // Cycle through hints
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

    // Add transcript to history
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

    if (!isSupported) return null;

    const toggleListening = () => {
        if (isListening) {
            stop();
        } else if (!isTranscribing && !processing) {
            setHistory([]);
            start();
            setShowPanel(true);
        }
    };

    // Generate waveform bars based on audio level
    const bars = 5;
    const barHeights = Array.from({ length: bars }, (_, i) => {
        const center = Math.abs(i - Math.floor(bars / 2));
        const base = 0.2;
        const level = base + audioLevel * (1 - base) * (1 - center * 0.15);
        return Math.min(1, level);
    });

    return (
        <>
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            {/* Floating Mic Button */}
            <button
                className={`voice-fab ${isListening ? 'voice-fab--active' : ''} ${isTranscribing ? 'voice-fab--transcribing' : ''} ${processing ? 'voice-fab--processing' : ''}`}
                onClick={toggleListening}
                title={isListening ? 'Stop listening' : isTranscribing ? 'Transcribing...' : 'Voice assistant'}
                onMouseEnter={() => !isBusy && setShowHints(true)}
                onMouseLeave={() => setShowHints(false)}
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

            {/* Hints tooltip */}
            {showHints && !isListening && (
                <div className="voice-hints">
                    <div className="voice-hints-title">Voice Commands</div>
                    {COMMAND_HINTS.slice(0, 4).map((h, i) => (
                        <div key={i} className="voice-hints-item">{h}</div>
                    ))}
                </div>
            )}

            {/* Listening Panel */}
            {showPanel && (
                <div className="voice-panel">
                    <div className="voice-panel-header">
                        <div className="voice-panel-title">
                            <span className={`voice-panel-dot ${isListening ? 'voice-panel-dot--live' : isTranscribing ? 'voice-panel-dot--transcribing' : ''}`} />
                            {isListening ? 'Listening...' : isTranscribing ? 'Transcribing...' : processing ? 'Executing...' : 'Ready'}
                        </div>
                        <button className="btn-icon" onClick={() => { stop(); setShowPanel(false); }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Audio level waveform */}
                    {isListening && (
                        <div className="voice-panel-waveform">
                            {barHeights.map((h, i) => (
                                <div
                                    key={i}
                                    className="voice-waveform-bar"
                                    style={{ height: `${h * 100}%` }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Transcribing indicator */}
                    {isTranscribing && (
                        <div className="voice-panel-processing">
                            <AudioLines size={14} className="voice-panel-processing-icon" />
                            <span>AI is transcribing your voice...</span>
                        </div>
                    )}

                    {/* Live transcript result */}
                    {!isListening && !isTranscribing && transcript && (
                        <div className="voice-panel-transcript">
                            <span className="voice-transcript-label">You said:</span>
                            <span className="voice-transcript-text">"{transcript}"</span>
                        </div>
                    )}

                    {/* Command hint when listening but idle */}
                    {isListening && audioLevel < 0.05 && (
                        <div className="voice-panel-hint">
                            Try: {COMMAND_HINTS[currentHint]}
                        </div>
                    )}

                    {/* Processing indicator */}
                    {processing && feedback && (
                        <div className="voice-panel-processing">
                            <Loader size={14} className="voice-fab-spinner" />
                            <span>{feedback}</span>
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

                    {/* Record again button */}
                    {!isListening && !isTranscribing && !processing && (
                        <div className="voice-panel-footer">
                            <button className="voice-record-again" onClick={start}>
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
