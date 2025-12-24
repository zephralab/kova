'use client';

import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, ArrowDownLeft, TrendingDown } from 'lucide-react';

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white p-8 rounded-3xl border border-[#D4AF37]/10 animate-pulse">
                        <div className="h-4 bg-zinc-100 rounded w-24 mb-4"></div>
                        <div className="h-10 bg-zinc-100 rounded w-40"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <h2 className="text-2xl font-serif font-bold">Financial Health</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Total Budget Card */}
                <div className="bg-white p-8 rounded-3xl border border-[#D4AF37]/10 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/5 transition-all duration-500 group">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Project Budget</p>
                        <Wallet className="w-5 h-5 text-[#D4AF37] opacity-40 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-4xl font-serif font-bold text-[#1A1A1A]">
                        {formatCurrency(totalAmount)}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-[10px] font-bold tracking-tight text-zinc-400">
                        <TrendingUp className="w-3.5 h-3.5" />
                        COMMISSION VALUE
                    </div>
                </div>

                {/* Amount Received Card */}
                <div className="bg-white p-8 rounded-3xl border border-[#D4AF37]/10 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/5 transition-all duration-500 group">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Amount Received</p>
                        <ArrowDownLeft className="w-5 h-5 text-green-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-4xl font-serif font-bold text-green-600">
                        {formatCurrency(amountReceived)}
                    </p>
                    <div className="mt-6">
                        <div className="flex justify-between text-[10px] font-bold tracking-tight text-zinc-400 mb-2">
                            <span>COLLECTION STATUS</span>
                            <span>{totalAmount > 0 ? Math.round((amountReceived / totalAmount) * 100) : 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden border border-zinc-100">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min((amountReceived / totalAmount) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="bg-white p-8 rounded-3xl border border-[#D4AF37]/10 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/5 transition-all duration-500 group">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Current Balance</p>
                        <TrendingDown className={`w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity ${balance < 0 ? 'text-red-500' : 'text-[#D4AF37]'}`} />
                    </div>
                    <p className={`text-4xl font-serif font-bold ${balance < 0 ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                        {formatCurrency(balance)}
                    </p>
                    <div className="mt-6">
                        <div className="flex justify-between text-[10px] font-bold tracking-tight text-zinc-400 mb-2">
                            <span>AVAILABLE BUFFER</span>
                            <span>{totalAmount > 0 ? Math.round((balance / totalAmount) * 100) : 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden border border-zinc-100">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${balance < 0 ? 'bg-red-500' : 'bg-[#D4AF37]'}`}
                                style={{ width: `${Math.min(Math.max(0, (balance / totalAmount) * 100), 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


