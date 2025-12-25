'use client';

import { useState } from 'react';

interface MarkPaymentModalProps {
    milestoneId: string;
    amountRemaining: number;
    milestoneName: string;
    onSuccess?: () => void;
}

export default function MarkPaymentModal({
    milestoneId,
    amountRemaining,
    milestoneName,
    onSuccess
}: MarkPaymentModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [amount, setAmount] = useState(amountRemaining);
    const [paymentDate, setPaymentDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [reference, setReference] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleMarkPaid = async () => {
        setIsLoading(true);
        setError(null);

        if (amount <= 0) {
            setError('Amount must be greater than 0');
            setIsLoading(false);
            return;
        }

        if (amount > amountRemaining) {
            setError(`Amount cannot exceed ₹${amountRemaining.toLocaleString('en-IN')}`);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `/api/milestones/${milestoneId}/mark-paid`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount,
                        paymentDate,
                        reference: reference.trim() || null
                    })
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to record payment');
            }

            // Success - close modal and reset form
            setIsOpen(false);
            setAmount(amountRemaining);
            setReference('');
            setPaymentDate(new Date().toISOString().split('T')[0]);
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to record payment');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors whitespace-nowrap"
            >
                Add Payment
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Record Payment</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Mark payment received for: <strong>{milestoneName}</strong>
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount Received (₹):
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="0"
                            min="0"
                            max={amountRemaining}
                            step="0.01"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Remaining: ₹{amountRemaining.toLocaleString('en-IN')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Date:
                        </label>
                        <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reference (Optional):
                        </label>
                        <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., UTR 123456789 or Cheq #"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setError(null);
                            setAmount(amountRemaining);
                            setReference('');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMarkPaid}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {isLoading ? 'Adding...' : 'Add Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
}

