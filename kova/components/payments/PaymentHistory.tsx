'use client';

import { useEffect, useState } from 'react';
import type { MilestonePayment } from '@/lib/types/database';

interface PaymentHistoryProps {
    milestoneId: string;
}

export default function PaymentHistory({ milestoneId }: PaymentHistoryProps) {
    const [payments, setPayments] = useState<MilestonePayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const response = await fetch(
                    `/api/milestones/${milestoneId}/payment-history`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch payment history');
                }

                const data = await response.json();
                setPayments(data.payments || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load payment history');
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [milestoneId]);

    if (loading) {
        return (
            <div className="mt-4 border-t pt-4">
                <div className="text-sm text-gray-500">Loading payment history...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-4 border-t pt-4">
                <div className="text-sm text-red-600">{error}</div>
            </div>
        );
    }

    if (!payments.length) {
        return (
            <div className="mt-4 border-t pt-4">
                <div className="text-sm text-gray-500">No payments recorded</div>
            </div>
        );
    }

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return (
        <div className="mt-4 border-t pt-4">
            <h4 className="font-semibold mb-3 text-gray-900">Payment History</h4>
            
            {/* Summary */}
            <div className="bg-green-50 p-3 rounded-lg mb-3 border border-green-200">
                <div className="flex justify-between text-sm">
                    <span className="text-green-800">Total Received:</span>
                    <span className="font-bold text-green-600">
                        ₹{totalPaid.toLocaleString('en-IN')}
                    </span>
                </div>
            </div>

            {/* Payments Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="text-left py-2 px-2 font-medium text-gray-700">Date</th>
                            <th className="text-right py-2 px-2 font-medium text-gray-700">Amount</th>
                            <th className="text-left py-2 px-2 font-medium text-gray-700">Reference</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment) => (
                            <tr key={payment.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-2 text-gray-700">
                                    {payment.paid_at
                                        ? new Date(payment.paid_at).toLocaleDateString('en-IN', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })
                                        : '-'}
                                </td>
                                <td className="text-right py-2 px-2 font-medium text-gray-900">
                                    ₹{Number(payment.amount).toLocaleString('en-IN')}
                                </td>
                                <td className="py-2 px-2 text-gray-600">
                                    {payment.reference || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

