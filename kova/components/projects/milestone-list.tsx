'use client';

import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight, MoreHorizontal } from 'lucide-react';
import type { Milestone } from '@/lib/types/database';

interface MilestoneListProps {
    milestones: Milestone[];
    totalAmount: number;
}

export default function MilestoneList({ milestones, totalAmount }: MilestoneListProps) {

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

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-500 w-16">#</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Milestone</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">Amount</th>
                            <th className="px-6 py-4 font-medium text-gray-500 w-40">Status</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right w-32">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {milestones.map((milestone) => (
                            <tr key={milestone.id} className="group hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-gray-400 font-medium">
                                    {milestone.order_index}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{milestone.title}</div>
                                    {milestone.description && (
                                        <div className="text-gray-500 text-xs mt-0.5">{milestone.description}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="font-medium text-gray-900">
                                        ₹{milestone.amount.toLocaleString()}
                                    </div>
                                    <div className="text-gray-400 text-xs">
                                        {milestone.percentage}%
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(milestone.status)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {milestone.status === 'pending' ? (
                                        <button className="text-blue-600 hover:text-blue-700 text-xs font-medium border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors whitespace-nowrap">
                                            Request Payment
                                        </button>
                                    ) : (
                                        <button className="text-gray-400 hover:text-gray-600 p-1">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
