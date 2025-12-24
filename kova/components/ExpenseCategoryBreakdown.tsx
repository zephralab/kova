'use client';

const CATEGORY_COLORS = {
    materials: { bg: 'bg-[#1A1A1A]', text: 'text-[#D4AF37]', lightBg: 'bg-[#FAF9F6]', border: 'border-[#D4AF37]/20' },
    labor: { bg: 'bg-green-600', text: 'text-green-700', lightBg: 'bg-green-50', border: 'border-green-200' },
    transport: { bg: 'bg-zinc-400', text: 'text-zinc-600', lightBg: 'bg-zinc-50', border: 'border-zinc-200' },
    other: { bg: 'bg-zinc-200', text: 'text-zinc-500', lightBg: 'bg-zinc-100/50', border: 'border-zinc-200' }
} as const;

interface Expense {
    id: string;
    amount: number;
    category: 'materials' | 'labor' | 'transport' | 'other';
}

interface ExpenseCategoryBreakdownProps {
    expenses: Expense[];
}

export function ExpenseCategoryBreakdown({ expenses }: ExpenseCategoryBreakdownProps) {
    if (!expenses.length) {
        return null;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate totals by category
    const categoryTotals = expenses.reduce((acc, exp) => {
        if (!acc[exp.category]) {
            acc[exp.category] = 0;
        }
        acc[exp.category] += exp.amount;
        return acc;
    }, {} as Record<string, number>);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate percentages
    const categoryData = Object.entries(categoryTotals).map(([category, total]) => ({
        category: category as keyof typeof CATEGORY_COLORS,
        total,
        percentage: (total / totalExpenses) * 100
    })).sort((a, b) => b.total - a.total);

    return (
        <div className="space-y-8">
            <div className="space-y-6">
                {categoryData.map(({ category, total, percentage }) => (
                    <div key={category} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[category].bg}`} />
                                <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">{category}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-serif font-bold text-[#1A1A1A]">{formatCurrency(total)}</span>
                                <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-tighter border uppercase ${CATEGORY_COLORS[category].lightBg} ${CATEGORY_COLORS[category].text} ${CATEGORY_COLORS[category].border}`}>
                                    {percentage.toFixed(0)}%
                                </div>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden border border-zinc-100">
                            <div
                                className={`h-full ${CATEGORY_COLORS[category].bg} transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.05)]`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-8 border-t border-[#D4AF37]/10 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Total Consolidated Expense</span>
                <span className="text-xl font-serif font-bold text-[#1A1A1A]">{formatCurrency(totalExpenses)}</span>
            </div>
        </div>
    );
}


