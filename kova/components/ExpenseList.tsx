'use client';

import { useEffect, useState } from 'react';

const CATEGORY_COLORS = {
    materials: { bg: 'bg-[#FAF9F6]', text: 'text-[#D4AF37]', border: 'border-[#D4AF37]/20' },
    labor: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    transport: { bg: 'bg-zinc-50', text: 'text-zinc-600', border: 'border-zinc-200' },
    other: { bg: 'bg-zinc-100/50', text: 'text-zinc-500', border: 'border-zinc-200' }
} as const;

interface Expense {
    id: string;
    description: string;
    amount: number;
    category: 'materials' | 'labor' | 'transport' | 'other';
    expenseDate: string;
    vendorName: string | null;
    createdAt: string;
}

export function ExpenseList({ projectId }: { projectId: string }) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExpenses();
    }, [projectId]);

    const fetchExpenses = async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}/expenses`);
            if (!response.ok) {
                throw new Error('Failed to fetch expenses');
            }
            const data = await response.json();
            setExpenses(data || []);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-zinc-50 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (!expenses.length) {
        return (
            <div className="text-center py-12">
                <p className="text-zinc-400 font-medium italic">No expenses documented for this phase yet.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto -mx-8">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-[#D4AF37]/10">
                        <th className="text-left py-4 px-8 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Registry Date</th>
                        <th className="text-left py-4 px-8 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Entity / Description</th>
                        <th className="text-left py-4 px-8 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Classification</th>
                        <th className="text-right py-4 px-8 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Value</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#D4AF37]/5">
                    {expenses.map(exp => (
                        <tr key={exp.id} className="group hover:bg-[#FAF9F6] transition-colors">
                            <td className="py-6 px-8 text-sm font-medium text-zinc-400">
                                {new Date(exp.expenseDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-6 px-8">
                                <p className="text-sm font-bold text-[#1A1A1A] mb-1">{exp.description}</p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{exp.vendorName || 'PROPRIETARY'}</p>
                            </td>
                            <td className="py-6 px-8">
                                <span
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border uppercase ${CATEGORY_COLORS[exp.category].bg
                                        } ${CATEGORY_COLORS[exp.category].text} ${CATEGORY_COLORS[exp.category].border}`}
                                >
                                    {exp.category}
                                </span>
                            </td>
                            <td className="py-6 px-8 text-right font-serif font-bold text-[#1A1A1A]">
                                {formatCurrency(exp.amount)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


