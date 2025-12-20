'use client';

import { useState, useEffect, useContext } from 'react';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { ExpenseCategoryBreakdown } from '@/components/ExpenseCategoryBreakdown';
import { FinancialContext } from './financial-dashboard-wrapper';

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
        // Refresh the financial dashboard at the top if context is available
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Expenses</h2>
                <AddExpenseForm projectId={projectId} onExpenseAdded={handleExpenseAdded} />
            </div>

            <ExpenseCategoryBreakdown expenses={expenses} />

            <ExpenseList projectId={projectId} key={refreshKey} />
        </div>
    );
}
