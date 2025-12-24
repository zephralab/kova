'use client';

import Link from 'next/link';
import { MoreVertical, ExternalLink, ArrowRight, Wallet, TrendingUp } from 'lucide-react';
import type { ProjectListItem } from '@/lib/types/api';

interface ProjectCardProps {
    project: ProjectListItem;
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const percentPaid = project.totalAmount > 0
        ? Math.min(100, Math.round((project.amountReceived / project.totalAmount) * 100))
        : 0;

    const milestonesTotal = project.milestonePaid + project.milestonePending;

    // Indian Numbering Format helper
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="bg-white rounded-2xl border border-[#D4AF37]/10 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/5 transition-all duration-300 p-6 flex flex-col h-full group relative overflow-hidden">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-serif font-bold text-xl text-[#1A1A1A] group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                        {project.projectName}
                    </h3>
                    <p className="text-sm text-zinc-500 font-medium">{project.clientName}</p>
                </div>
                <button className="text-zinc-400 hover:text-[#1A1A1A] p-2 rounded-full hover:bg-[#FAF9F6] transition-colors">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 space-y-6">
                {/* Financials Grid */}
                <div className="grid grid-cols-2 gap-6 p-4 bg-[#FAF9F6] rounded-xl border border-[#D4AF37]/5">
                    <div className="space-y-1">
                        <p className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest">Total Budget</p>
                        <p className="font-bold text-lg text-[#1A1A1A]">{formatCurrency(project.totalAmount)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest">Balance</p>
                        <p className={`font-bold text-lg ${project.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(project.balance)}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
                            PROGRESS ({percentPaid}%)
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                            {project.milestonePaid}/{milestonesTotal} PHASE
                        </span>
                    </div>
                    <div className="h-2 w-full bg-[#FAF9F6] rounded-full overflow-hidden border border-[#D4AF37]/10 p-[1px]">
                        <div
                            className="h-full bg-[#1A1A1A] rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(212,175,55,0.3)]"
                            style={{ width: `${percentPaid}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#D4AF37]/10 flex items-center justify-between">
                <button
                    className="text-zinc-400 hover:text-[#1A1A1A] flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors group/share"
                    onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(`${window.location.origin}/share/${project.shareUuid}`);
                    }}
                >
                    <ExternalLink className="w-4 h-4 group-hover/share:text-[#D4AF37] transition-colors" />
                    Share Link
                </button>

                <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-2 text-sm font-bold text-[#1A1A1A] hover:text-[#D4AF37] transition-all group/link"
                >
                    Management
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}

