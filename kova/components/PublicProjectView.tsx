'use client';

import { useState, useEffect } from 'react';

interface Milestone {
    id: string;
    title: string;
    description: string | null;
    amount: number;
    amount_paid: number;
    status: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
    order_index: number;
}

interface Expense {
    id: string;
    amount: number;
    category: 'materials' | 'labor' | 'transport' | 'other';
}

interface Project {
    id: string;
    project_name: string;
    client_name: string;
    total_amount: number;
    share_uuid: string;
    created_at: string;
    milestones: Milestone[];
    expenses: Expense[];
}

interface PublicProjectViewProps {
    project: Project;
    amountReceived: number;
    totalExpenses: number;
    balance: number;
}

export function PublicProjectView({
    project,
    amountReceived,
    totalExpenses,
    balance
}: PublicProjectViewProps) {
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            window.location.reload();
        }, 30000);

        return () => clearInterval(interval);
    }, [autoRefresh]);

    // Calculate category totals
    const categoryTotals = project.expenses.reduce((acc, exp) => {
        if (!acc[exp.category]) {
            acc[exp.category] = 0;
        }
        acc[exp.category] += exp.amount;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h1 className="text-3xl font-bold mb-2">{project.project_name}</h1>
                    <p className="text-gray-600 mb-4">Client: {project.client_name}</p>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs text-gray-600">Total Budget</p>
                            <p className="text-xl font-bold text-blue-600">
                                ₹{project.total_amount.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Amount Received</p>
                            <p className="text-xl font-bold text-green-600">
                                ₹{amountReceived.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Last Updated</p>
                            <p className="text-sm text-gray-600">
                                {new Date().toLocaleDateString('en-IN')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Milestones */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">💳 Payment Status</h2>

                    <div className="space-y-4">
                        {project.milestones.map((milestone, idx) => {
                            const progressPercent = milestone.amount > 0
                                ? Math.round((milestone.amount_paid / milestone.amount) * 100)
                                : 0;

                            return (
                                <div key={milestone.id} className="border rounded p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-semibold">
                                                {idx + 1}. {milestone.title}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Expected: ₹{milestone.amount.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded text-sm font-medium ${
                                                milestone.status === 'paid'
                                                    ? 'bg-green-100 text-green-800'
                                                    : milestone.status === 'partially_paid'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {milestone.status === 'paid'
                                                ? '✓ Paid'
                                                : milestone.status === 'partially_paid'
                                                ? `⚠️ Partially Paid ₹${milestone.amount_paid.toLocaleString('en-IN')} / ₹${milestone.amount.toLocaleString('en-IN')}`
                                                : '⏳ Pending'}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>Progress</span>
                                            <span>{progressPercent}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded h-2">
                                            <div
                                                className="bg-green-600 h-2 rounded transition-all"
                                                style={{
                                                    width: `${Math.min(100, progressPercent)}%`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {milestone.status !== 'paid' && milestone.amount_paid < milestone.amount && (
                                        <p className="text-sm text-orange-600 mt-2">
                                            Remaining: ₹{(milestone.amount - milestone.amount_paid).toLocaleString('en-IN')}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Overall Progress */}
                    <div className="bg-blue-50 p-4 rounded mt-6">
                        <p className="text-sm text-gray-600 mb-2">Overall Payment Status</p>
                        <p className="text-2xl font-bold text-blue-600 mb-2">
                            ₹{amountReceived.toLocaleString('en-IN')} / ₹{project.total_amount.toLocaleString('en-IN')}
                        </p>
                        <div className="w-full bg-gray-200 rounded h-3">
                            <div
                                className="bg-blue-600 h-3 rounded transition-all"
                                style={{
                                    width: `${Math.min(100, project.total_amount > 0 ? (amountReceived / project.total_amount) * 100 : 0)}%`
                                }}
                            />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {project.total_amount > 0 ? Math.round((amountReceived / project.total_amount) * 100) : 0}% Complete
                        </p>
                    </div>
                </div>

                {/* Expenses Summary */}
                {project.expenses.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">📊 Project Expenses</h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {Object.entries(categoryTotals).map(([category, total]) => (
                                <div key={category} className="bg-gray-50 p-3 rounded">
                                    <p className="text-xs text-gray-600 mb-1">
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </p>
                                    <p className="text-lg font-bold">
                                        ₹{total.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-orange-50 p-4 rounded">
                            <p className="text-sm text-gray-600">Total Expenses</p>
                            <p className="text-2xl font-bold text-orange-600">
                                ₹{totalExpenses.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Balance */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">💵 Budget Status</h2>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded">
                            <p className="text-xs text-gray-600">Received</p>
                            <p className="text-lg font-bold text-green-600">
                                ₹{amountReceived.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded">
                            <p className="text-xs text-gray-600">Spent</p>
                            <p className="text-lg font-bold text-orange-600">
                                ₹{totalExpenses.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div
                            className={`text-center p-3 rounded ${
                                balance > 0
                                    ? 'bg-green-50'
                                    : balance < 0
                                    ? 'bg-red-50'
                                    : 'bg-yellow-50'
                            }`}
                        >
                            <p className="text-xs text-gray-600">Balance</p>
                            <p
                                className={`text-lg font-bold ${
                                    balance > 0
                                        ? 'text-green-600'
                                        : balance < 0
                                        ? 'text-red-600'
                                        : 'text-yellow-600'
                                }`}
                            >
                                ₹{balance.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    {balance > 0 && (
                        <div className="bg-green-50 border border-green-200 p-3 rounded mt-3">
                            <p className="text-sm text-green-800">
                                ✓ Project has ₹{balance.toLocaleString('en-IN')} buffer remaining
                            </p>
                        </div>
                    )}
                    {balance < 0 && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded mt-3">
                            <p className="text-sm text-red-800">
                                ⚠️ Project is over budget by ₹{Math.abs(balance).toLocaleString('en-IN')}
                            </p>
                        </div>
                    )}
                    {balance === 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mt-3">
                            <p className="text-sm text-yellow-800">
                                ⚠️ No remaining budget. All funds are allocated.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-gray-600">
                    <p>This link will auto-refresh every 30 seconds</p>
                    <p className="mt-2">Questions? Contact your designer directly</p>
                </div>
            </div>
        </div>
    );
}
