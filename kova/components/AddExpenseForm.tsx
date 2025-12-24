'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/toast';
import { X, Plus, Receipt } from 'lucide-react';

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
            if (!description.trim()) throw new Error('Description is required');
            if (!amount || parseFloat(amount) <= 0) throw new Error('Amount must be greater than 0');
            if (!category) throw new Error('Category is required');
            if (!expenseDate) throw new Error('Date is required');

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

            toast.success('✓ Expense recorded');
            onExpenseAdded();
            setIsOpen(false);
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
                className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-6 py-3 rounded-xl text-sm font-bold tracking-widest hover:bg-[#D4AF37] transition-all duration-300 shadow-lg shadow-black/5"
            >
                <Plus className="w-4 h-4" />
                RECORD EXPENSE
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#1A1A1A]/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
            <div className="bg-white rounded-[32px] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-[#D4AF37]/10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                            <Receipt className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">Record Expense</h2>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-zinc-400 hover:text-[#1A1A1A] transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-2">
                            Description / Item Name *
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Italian Marble for Foyer"
                            className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#D4AF37]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-2">
                                Amount (₹) *
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#D4AF37]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-2">
                                Classification *
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as typeof category)}
                                className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#D4AF37]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all font-bold appearance-none"
                            >
                                <option value="materials">Materials</option>
                                <option value="labor">Labor</option>
                                <option value="transport">Logistics</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-2">
                                Value Date *
                            </label>
                            <input
                                type="date"
                                value={expenseDate}
                                onChange={(e) => setExpenseDate(e.target.value)}
                                className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#D4AF37]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-2">
                                Vendor / Service Provider
                            </label>
                            <input
                                type="text"
                                value={vendorName}
                                onChange={(e) => setVendorName(e.target.value)}
                                placeholder="e.g., Marble World"
                                className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#D4AF37]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-100 italic">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-4 mt-10">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setError(null);
                        }}
                        className="flex-1 px-4 py-4 border border-[#D4AF37]/20 rounded-xl text-zinc-400 font-bold tracking-widest hover:bg-[#FAF9F6] transition-all uppercase text-xs"
                        disabled={isLoading}
                    >
                        Void
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-2 px-8 py-4 bg-[#1A1A1A] text-white rounded-xl font-bold tracking-widest hover:bg-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase text-xs shadow-lg shadow-black/5"
                    >
                        {isLoading ? 'COMMITTING...' : 'REGISTER EXPENSE'}
                    </button>
                </div>
            </div>
        </div>
    );
}


