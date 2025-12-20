'use client';

import { useEffect, useState } from 'react';

const CATEGORY_COLORS = {
    materials: { bg: 'bg-blue-100', text: 'text-blue-800' },
    labor: { bg: 'bg-green-100', text: 'text-green-800' },
    transport: { bg: 'bg-orange-100', text: 'text-orange-800' },
    other: { bg: 'bg-gray-100', text: 'text-gray-800' }
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

    if (loading) {
        return (
            <div className="text-sm text-gray-500">Loading expenses...</div>
        );
    }

    if (!expenses.length) {
        return (
            <div className="text-sm text-gray-500">No expenses yet</div>
        );
    }

    // Calculate totals by category
    const categoryTotals = expenses.reduce((acc, exp) => {
        if (!acc[exp.category]) {
            acc[exp.category] = { total: 0, count: 0 };
        }
        acc[exp.category].total += exp.amount;
        acc[exp.category].count += 1;
        return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div className="space-y-4">
            {/* Category Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(categoryTotals).map(([category, { total, count }]) => (
                    <div
                        key={category}
                        className={`p-3 rounded ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS].bg}`}
                    >
                        <p className={`text-xs font-medium ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS].text}`}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </p>
                        <p className={`text-sm font-bold ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS].text}`}>
                            ₹{total.toLocaleString('en-IN')}
                        </p>
                        <p className={`text-xs ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS].text}`}>
                            {count} item{count !== 1 ? 's' : ''}
                        </p>
                    </div>
                ))}
            </div>

            {/* Expenses Table */}
            <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-2 px-3">Date</th>
                            <th className="text-left py-2 px-3">Description</th>
                            <th className="text-left py-2 px-3">Category</th>
                            <th className="text-right py-2 px-3">Amount</th>
                            <th className="text-left py-2 px-3">Vendor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(exp => (
                            <tr key={exp.id} className="border-t hover:bg-gray-50">
                                <td className="py-2 px-3">
                                    {new Date(exp.expenseDate).toLocaleDateString('en-IN')}
                                </td>
                                <td className="py-2 px-3">{exp.description}</td>
                                <td className="py-2 px-3">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                            CATEGORY_COLORS[exp.category].bg
                                        } ${CATEGORY_COLORS[exp.category].text}`}
                                    >
                                        {exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}
                                    </span>
                                </td>
                                <td className="py-2 px-3 text-right font-medium">
                                    ₹{exp.amount.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2 px-3 text-gray-600">
                                    {exp.vendorName || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Total */}
            <div className="bg-gray-50 p-3 rounded text-right">
                <p className="text-sm text-gray-600">Total Expenses:</p>
                <p className="text-lg font-bold">₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>
        </div>
    );
}
