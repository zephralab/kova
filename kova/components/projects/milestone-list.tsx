'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Milestone } from '@/lib/types/database';
import RequestPaymentModal from '@/components/payments/RequestPaymentModal';
import MarkPaymentModal from '@/components/payments/MarkPaymentModal';
import PaymentHistory from '@/components/payments/PaymentHistory';
import EditDueDateModal from '@/components/payments/EditDueDateModal';

interface MilestoneListProps {
    milestones: Milestone[];
    totalAmount: number;
    projectName: string;
    clientName: string;
    projectId: string;
    onRefresh?: () => void;
}

export default function MilestoneList({ milestones, totalAmount, projectName, clientName, projectId, onRefresh }: MilestoneListProps) {
    const [expandedPayments, setExpandedPayments] = useState<string | null>(null);

    const getStatusBadge = (status: Milestone['status']) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Paid
                    </span>
                );
            case 'partially_paid':
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Partially Paid
                    </span>
                );
            case 'pending':
            default:
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                    </span>
                );
        }
    };

    const handleRefresh = () => {
        if (onRefresh) {
            onRefresh();
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="space-y-4">
            {milestones.map((milestone) => {
                const amountPaid = milestone.amount_paid || 0;
                const amountRemaining = milestone.amount - amountPaid;
                const paymentPercentage = Math.min(100, (amountPaid / milestone.amount) * 100);

                return (
                    <div key={milestone.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-gray-400 font-medium text-sm">#{milestone.order_index}</span>
                                    <h3 className="font-bold text-gray-900">{milestone.title}</h3>
                                    {getStatusBadge(milestone.status)}
                                </div>
                                {milestone.description && (
                                    <p className="text-sm text-gray-600 ml-8">{milestone.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Payment Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1 text-gray-600">
                                <span>₹{amountPaid.toLocaleString('en-IN')} / ₹{milestone.amount.toLocaleString('en-IN')}</span>
                                <span>{Math.round(paymentPercentage)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all"
                                    style={{ width: `${paymentPercentage}%` }}
                                />
                            </div>
                            {milestone.status !== 'paid' && amountRemaining > 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                    ₹{amountRemaining.toLocaleString('en-IN')} remaining
                                </p>
                            )}
                        </div>

                        {/* Amount and Due Date */}
                        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                            <span>Amount: ₹{milestone.amount.toLocaleString('en-IN')}</span>
                            <div className="flex items-center gap-2">
                                {milestone.due_date ? (
                                    <span>Due: {new Date(milestone.due_date).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}</span>
                                ) : (
                                    <span className="text-gray-400">No due date set</span>
                                )}
                                <EditDueDateModal
                                    milestoneId={milestone.id}
                                    projectId={projectId}
                                    milestoneName={milestone.title}
                                    currentDueDate={milestone.due_date}
                                    onSuccess={handleRefresh}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap items-center">
                            {milestone.status !== 'paid' && (
                                <>
                                    <RequestPaymentModal
                                        milestoneId={milestone.id}
                                        milestoneName={milestone.title}
                                        amount={amountRemaining}
                                        projectName={projectName}
                                        clientName={clientName}
                                        onSuccess={handleRefresh}
                                    />
                                    <MarkPaymentModal
                                        milestoneId={milestone.id}
                                        amountRemaining={amountRemaining}
                                        milestoneName={milestone.title}
                                        onSuccess={handleRefresh}
                                    />
                                </>
                            )}
                            {milestone.status !== 'pending' && (
                                <button
                                    onClick={() => setExpandedPayments(
                                        expandedPayments === milestone.id ? null : milestone.id
                                    )}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium flex items-center gap-1"
                                >
                                    {expandedPayments === milestone.id ? (
                                        <>
                                            <ChevronUp className="w-4 h-4" />
                                            Hide Payments
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-4 h-4" />
                                            View Payments
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Payment History (expandable) */}
                        {expandedPayments === milestone.id && (
                            <PaymentHistory milestoneId={milestone.id} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
