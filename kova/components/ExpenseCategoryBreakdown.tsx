'use client';

const CATEGORY_COLORS = {
    materials: { bg: 'bg-blue-500', text: 'text-blue-800', lightBg: 'bg-blue-100' },
    labor: { bg: 'bg-green-500', text: 'text-green-800', lightBg: 'bg-green-100' },
    transport: { bg: 'bg-orange-500', text: 'text-orange-800', lightBg: 'bg-orange-100' },
    other: { bg: 'bg-gray-500', text: 'text-gray-800', lightBg: 'bg-gray-100' }
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
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Expense Breakdown</h3>
            
            {/* Bar Chart */}
            <div className="space-y-2">
                {categoryData.map(({ category, total, percentage }) => (
                    <div key={category} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium capitalize">{category}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">₹{total.toLocaleString('en-IN')}</span>
                                <span className="text-gray-500">({percentage.toFixed(1)}%)</span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full ${CATEGORY_COLORS[category].bg} transition-all duration-300`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                {categoryData.map(({ category, total, percentage }) => (
                    <div
                        key={category}
                        className={`p-2 rounded text-xs ${CATEGORY_COLORS[category].lightBg}`}
                    >
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${CATEGORY_COLORS[category].bg}`} />
                            <span className={`font-medium ${CATEGORY_COLORS[category].text}`}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </span>
                        </div>
                        <div className={`mt-1 ${CATEGORY_COLORS[category].text}`}>
                            {percentage.toFixed(1)}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
