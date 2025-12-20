'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/toast';

export function AddExpenseForm({
    projectId,
    onExpenseAdded
}: {
    projectId: string;
    onExpenseAdded: () => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<'materials' | 'labor' | 'transport' | 'other'>('materials');
    const [expenseDate, setExpenseDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [vendorName, setVendorName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Validation
            if (!description.trim()) {
                throw new Error('Description is required');
            }
            if (!amount || parseFloat(amount) <= 0) {
                throw new Error('Amount must be greater than 0');
            }
            if (!category) {
                throw new Error('Category is required');
            }
            if (!expenseDate) {
                throw new Error('Date is required');
            }

            const response = await fetch(
                `/api/projects/${projectId}/expenses`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        description,
                        amount: parseFloat(amount),
                        category,
                        expenseDate,
                        vendorName: vendorName || null
                    })
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to add expense');
            }

            toast.success('✓ Expense added');
            onExpenseAdded();
            setIsOpen(false);
            // Reset form
            setDescription('');
            setAmount('');
            setCategory('materials');
            setExpenseDate(new Date().toISOString().split('T')[0]);
            setVendorName('');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to add expense';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
                + Add Expense
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold mb-4">Add Expense</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Description *
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Tiles for living room"
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Amount (₹) *
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Category *
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as typeof category)}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="materials">Materials</option>
                                <option value="labor">Labor</option>
                                <option value="transport">Transport</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Date *
                        </label>
                        <input
                            type="date"
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Vendor Name (Optional)
                        </label>
                        <input
                            type="text"
                            value={vendorName}
                            onChange={(e) => setVendorName(e.target.value)}
                            placeholder="e.g., ABC Tiles Store"
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setError(null);
                        }}
                        className="flex-1 px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Saving...' : 'Save Expense'}
                    </button>
                </div>
            </div>
        </div>
    );
}
