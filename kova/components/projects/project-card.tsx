'use client';

import Link from 'next/link';
import { MoreVertical, ExternalLink, ArrowRight } from 'lucide-react';
import type { ProjectListItem } from '@/lib/types/api';

interface ProjectCardProps {
    project: ProjectListItem;
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const percentPaid = project.totalAmount > 0
        ? Math.min(100, Math.round((project.amountReceived / project.totalAmount) * 100))
        : 0;

    const milestonesTotal = project.milestonePaid + project.milestonePending;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                        {project.projectName}
                    </h3>
                    <p className="text-sm text-gray-500">{project.clientName}</p>
                </div>
                {/* Menu placeholder - can be implemented with a dropdown later */}
                <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 space-y-4">
                {/* Financials */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Budget</p>
                        <p className="font-semibold text-gray-900">₹{project.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Balance</p>
                        <p className={`font-semibold ${project.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{project.balance.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Progress ({percentPaid}%)</span>
                        <span>{project.milestonePaid}/{milestonesTotal} Milestones</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentPaid}%` }}
                        />
                    </div>
                </div>

                {/* Detailed Stats */}
                <div className="flex gap-3 text-xs">
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md">
                        Rec: ₹{project.amountReceived.toLocaleString()}
                    </span>
                    <span className="bg-gray-50 text-gray-600 px-2 py-1 rounded-md">
                        Exp: ₹{project.amountSpent.toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t flex items-center justify-between">
                {/* Share Link - functional placeholder */}
                <button
                    className="text-gray-400 hover:text-gray-600 p-1 flex items-center gap-1 text-xs"
                    title="Copy share link"
                    onClick={(e) => {
                        e.preventDefault();
                        // Copy logic would go here
                        navigator.clipboard.writeText(`${window.location.origin}/share/${project.shareUuid}`);
                    }}
                >
                    <ExternalLink className="w-4 h-4" />
                    Share
                </button>

                <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                    View Details
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
