import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
    if (!toasts || toasts.length === 0) return null;

    return (
        <aside className="toast-container" aria-label="Notifications">
            {toasts.map(toast => {
                const Icon = toast.type === 'success' 
                    ? CheckCircle2 
                    : toast.type === 'error' 
                    ? AlertCircle 
                    : Info;

                return (
                    <div key={toast.id} className={`toast toast-${toast.type || 'info'} fade-in`}>
                        <Icon size={18} className="toast-icon" />
                        <span className="toast-msg">{toast.message}</span>
                        <button 
                            className="toast-dismiss" 
                            onClick={() => onDismiss(toast.id)} 
                            aria-label="Dismiss notification"
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </aside>
    );
}
