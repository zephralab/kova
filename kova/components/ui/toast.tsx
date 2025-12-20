'use client';

import { useEffect, useState } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function notify() {
    toastListeners.forEach(listener => listener([...toasts]));
}

export const toast = {
    success: (message: string) => {
        const id = Math.random().toString(36).substring(7);
        toasts = [...toasts, { id, message, type: 'success' }];
        notify();
        setTimeout(() => {
            toasts = toasts.filter(t => t.id !== id);
            notify();
        }, 3000);
    },
    error: (message: string) => {
        const id = Math.random().toString(36).substring(7);
        toasts = [...toasts, { id, message, type: 'error' }];
        notify();
        setTimeout(() => {
            toasts = toasts.filter(t => t.id !== id);
            notify();
        }, 5000);
    },
    info: (message: string) => {
        const id = Math.random().toString(36).substring(7);
        toasts = [...toasts, { id, message, type: 'info' }];
        notify();
        setTimeout(() => {
            toasts = toasts.filter(t => t.id !== id);
            notify();
        }, 3000);
    },
};

export function ToastContainer() {
    const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const listener = (newToasts: Toast[]) => {
            setCurrentToasts(newToasts);
        };
        toastListeners.push(listener);
        setCurrentToasts([...toasts]);

        return () => {
            toastListeners = toastListeners.filter(l => l !== listener);
        };
    }, []);

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {currentToasts.map(toast => (
                <div
                    key={toast.id}
                    className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium min-w-[300px] ${
                        toast.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : toast.type === 'error'
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
}
