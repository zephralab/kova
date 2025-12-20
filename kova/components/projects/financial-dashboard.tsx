'use client';

import { useEffect, useState } from 'react';

interface FinancialDashboardProps {
    projectId: string;
    totalAmount: number;
    amountReceived: number;
    refreshKey?: number;
}

export function FinancialDashboard({ 
    projectId, 
    totalAmount, 
    amountReceived,
    refreshKey = 0 
}: FinancialDashboardProps) {
    const [amountSpent, setAmountSpent] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                // Fetch expenses to calculate total spent
                const response = await fetch(`/api/projects/${projectId}/expenses`);
                if (response.ok) {
                    const expenses = await response.json();
                    const total = expenses.reduce((sum: number, exp: { amount: number }) => sum + exp.amount, 0);
                    setAmountSpent(total);
                }
            } catch (error) {
                console.error('Error fetching expenses for dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFinancials();
    }, [projectId, refreshKey]);

    const balance = amountReceived - amountSpent;

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-gray-100 p-4 rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">Total Budget</p>
                    <p className="text-2xl font-bold text-blue-600">
                        ₹{totalAmount.toLocaleString('en-IN')}
                    </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600 mb-1">Amount Received</p>
                    <p className="text-2xl font-bold text-green-600">
                        ₹{amountReceived.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        {totalAmount > 0 ? Math.round((amountReceived / totalAmount) * 100) : 0}%
                    </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-orange-600">
                        ₹{amountSpent.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        {totalAmount > 0 ? Math.round((amountSpent / totalAmount) * 100) : 0}%
                    </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                    balance > 0
                        ? 'bg-green-50 border-green-200'
                        : balance < 0
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                }`}>
                    <p className="text-xs text-gray-600 mb-1">Current Balance</p>
                    <p className={`text-2xl font-bold ${
                        balance > 0
                            ? 'text-green-600'
                            : balance < 0
                            ? 'text-red-600'
                            : 'text-yellow-600'
                    }`}>
                        ₹{balance.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        {balance > 0 ? '✓ Positive balance' : balance < 0 ? '⚠️ Over budget!' : '⚠️ No buffer'}
                    </p>
                </div>
            </div>

            {/* Progress Bars */}
            {totalAmount > 0 && (
                <div className="space-y-2">
                    <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Received</span>
                            <span>{Math.round((amountReceived / totalAmount) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min((amountReceived / totalAmount) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Spent</span>
                            <span>{Math.round((amountSpent / totalAmount) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-orange-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min((amountSpent / totalAmount) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Balance</span>
                            <span>{Math.round((balance / totalAmount) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${
                                    balance > 0 ? 'bg-green-500' : balance < 0 ? 'bg-red-500' : 'bg-yellow-500'
                                }`}
                                style={{ width: `${Math.min(Math.abs((balance / totalAmount) * 100), 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
