'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Calendar, CreditCard } from 'lucide-react';
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: Milestone['status']) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-green-50 text-green-700 border border-green-200 uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        Fully Paid
                    </span>
                );
            case 'partially_paid':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-yellow-50 text-yellow-700 border border-yellow-200 uppercase">
                        <AlertCircle className="w-3 h-3" />
                        Partial
                    </span>
                );
            case 'pending':
            default:
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-zinc-50 text-zinc-500 border border-zinc-200 uppercase">
                        <Clock className="w-3 h-3" />
                        Awaiting
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
        <div className="space-y-6">
            {milestones.map((milestone) => {
                const amountPaid = milestone.amount_paid || 0;
                const amountRemaining = milestone.amount - amountPaid;
                const paymentPercentage = Math.min(100, (amountPaid / milestone.amount) * 100);

                return (
                    <div key={milestone.id} className="bg-white rounded-3xl border border-[#D4AF37]/10 p-8 shadow-sm hover:shadow-lg transition-all duration-300 group">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#D4AF37]/20 flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                                        {milestone.order_index}
                                    </span>
                                    <div>
                                        <h3 className="font-serif font-bold text-xl text-[#1A1A1A] mb-1">{milestone.title}</h3>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(milestone.status)}
                                            {milestone.due_date && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                                                    <Calendar className="w-3 h-3" />
                                                    Due {new Date(milestone.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {milestone.description && (
                                    <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl pl-14">
                                        {milestone.description}
                                    </p>
                                )}
                            </div>

                            <div className="lg:w-80 space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Milestone Value</p>
                                        <p className="font-serif font-bold text-lg text-[#1A1A1A]">{formatCurrency(milestone.amount)}</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">Collected</p>
                                        <p className="font-serif font-bold text-lg text-green-600">{Math.round(paymentPercentage)}%</p>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-zinc-50 rounded-full overflow-hidden border border-zinc-100 p-[1px]">
                                    <div
                                        className="h-full bg-[#1A1A1A] rounded-full transition-all duration-1000 group-hover:shadow-[0_0_8px_rgba(212,175,55,0.3)]"
                                        style={{ width: `${paymentPercentage}%` }}
                                    />
                                </div>
                                {milestone.status !== 'paid' && amountRemaining > 0 && (
                                    <p className="text-[10px] font-bold tracking-widest text-orange-600 text-center uppercase">
                                        {formatCurrency(amountRemaining)} Outstanding
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-8 pt-8 border-t border-[#D4AF37]/10 flex flex-wrap items-center justify-between gap-6">
                            <div className="flex gap-4">
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
                                <EditDueDateModal
                                    milestoneId={milestone.id}
                                    projectId={projectId}
                                    milestoneName={milestone.title}
                                    currentDueDate={milestone.due_date}
                                    onSuccess={handleRefresh}
                                />
                            </div>

                            {milestone.status !== 'pending' && (
                                <button
                                    onClick={() => setExpandedPayments(
                                        expandedPayments === milestone.id ? null : milestone.id
                                    )}
                                    className="text-xs font-bold tracking-widest text-[#D4AF37] hover:text-[#1A1A1A] transition-colors flex items-center gap-2 uppercase"
                                >
                                    {expandedPayments === milestone.id ? (
                                        <>
                                            <ChevronUp className="w-4 h-4" />
                                            Hide History
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

                        {/* Expandable History */}
                        {expandedPayments === milestone.id && (
                            <div className="mt-6 p-6 bg-[#FAF9F6] rounded-2xl border border-[#D4AF37]/5">
                                <PaymentHistory milestoneId={milestone.id} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

