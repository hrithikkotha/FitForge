import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
// ✅ P2-8: Import useToast from hooks file to fix ESLint Fast Refresh warning
export { useToast, type ToastType } from '../hooks/useToast';
import type { ToastType } from '../hooks/useToast';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

const ICON_MAP = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
};

export const ToastContainer = ({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
            ))}
        </div>
    );
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
        const exit = setTimeout(() => setVisible(false), 2700);
        return () => clearTimeout(exit);
    }, []);

    return (
        <div className={`toast toast-${toast.type} ${visible ? 'toast-enter' : 'toast-exit'}`}>
            <span className="toast-icon">{ICON_MAP[toast.type]}</span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={onDismiss}><X size={14} /></button>
        </div>
    );
};
