'use client';

import { useState, useEffect, useContext } from 'react';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { ExpenseCategoryBreakdown } from '@/components/ExpenseCategoryBreakdown';
import { FinancialContext } from './financial-dashboard-wrapper';
import { Receipt } from 'lucide-react';

interface Expense {
    id: string;
    amount: number;
    category: 'materials' | 'labor' | 'transport' | 'other';
}

interface ExpensesSectionProps {
    projectId: string;
}

export function ExpensesSection({ projectId }: ExpensesSectionProps) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const financialContext = useContext(FinancialContext);

    const handleExpenseAdded = () => {
        setRefreshKey(prev => prev + 1);
        if (financialContext) {
            financialContext.refresh();
        }
    };

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const response = await fetch(`/api/projects/${projectId}/expenses`);
                if (response.ok) {
                    const data = await response.json();
                    setExpenses(data || []);
                }
            } catch (error) {
                console.error('Error fetching expenses:', error);
            }
        };
        fetchExpenses();
    }, [projectId, refreshKey]);

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">Procurement & Costs</h2>
                    <p className="text-sm text-zinc-500 font-medium">Detailed tracking of all materials, labor, and logistical expenses.</p>
                </div>
                <AddExpenseForm projectId={projectId} onExpenseAdded={handleExpenseAdded} />
            </div>

            <div className="grid grid-cols-1 gap-12">
                <div className="bg-white rounded-3xl border border-[#D4AF37]/10 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-[#FAF9F6] border border-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <h3 className="font-serif font-bold text-xl">Allocation Breakdown</h3>
                    </div>
                    <ExpenseCategoryBreakdown expenses={expenses} />
                </div>

                <div className="bg-white rounded-3xl border border-[#D4AF37]/10 p-8 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-[#FAF9F6] border border-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <h3 className="font-serif font-bold text-xl">Expense Registry</h3>
                    </div>
                    <ExpenseList projectId={projectId} key={refreshKey} />
                </div>
            </div>
        </div>
    );
}


