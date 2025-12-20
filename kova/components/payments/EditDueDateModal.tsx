'use client';

import { useState } from 'react';

interface EditDueDateModalProps {
    milestoneId: string;
    projectId: string;
    milestoneName: string;
    currentDueDate: string | null;
    onSuccess?: () => void;
}

export default function EditDueDateModal({
    milestoneId,
    projectId,
    milestoneName,
    currentDueDate,
    onSuccess
}: EditDueDateModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dueDate, setDueDate] = useState(
        currentDueDate ? new Date(currentDueDate).toISOString().split('T')[0] : ''
    );
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/projects/${projectId}/milestones/${milestoneId}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dueDate: dueDate || null
                    })
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update due date');
            }

            setIsOpen(false);
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update due date');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/projects/${projectId}/milestones/${milestoneId}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dueDate: null
                    })
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to clear due date');
            }

            setIsOpen(false);
            setDueDate('');
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clear due date');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors"
            >
                {currentDueDate ? 'Edit Due Date' : 'Set Due Date'}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Set Due Date</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Milestone: <strong>{milestoneName}</strong>
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date:
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-6">
                    {currentDueDate && (
                        <button
                            onClick={handleClear}
                            disabled={isLoading}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium disabled:opacity-50"
                        >
                            Clear
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setError(null);
                            setDueDate(currentDueDate ? new Date(currentDueDate).toISOString().split('T')[0] : '');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

