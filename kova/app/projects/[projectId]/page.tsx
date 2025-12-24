import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ArrowLeft, Edit, Share2, MoreVertical, Wallet, TrendingDown, ArrowDownLeft, Settings, TrendingUp, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import AuthStatus from '@/components/AuthStatus';
import MilestoneList from '@/components/projects/milestone-list';
import { FinancialDashboardWrapper } from '@/components/projects/financial-dashboard-wrapper';
import { ExpensesSection } from '@/components/projects/expenses-section';
import { ShareProjectModal } from '@/components/ShareProjectModal';
import type { Milestone } from '@/lib/types/database';

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage(props: PageProps) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/auth/sign-in');
    }

    let project = null;
    let error = null;


    try {
        const { firmId } = await getAuthenticatedUserWithFirm(supabase);

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(params.projectId)) {
            notFound();
        }

        const { data, error: dbError } = await supabase
            .from('projects')
            .select(`
                *,
                milestones(*)
            `)
            .eq('id', params.projectId)
            .eq('firm_id', firmId)
            .single();

        if (dbError || !data) {
            if (dbError?.code !== 'PGRST116') {
                console.error('Error fetching project:', dbError);
            }
            notFound();
        }

        project = data;

        if (project.milestones) {
            project.milestones.sort((a: Milestone, b: Milestone) => a.order_index - b.order_index);
        }

    } catch (e) {
        console.error('Critical error in project detail:', e);
        error = true;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="text-center p-12 bg-white rounded-3xl border border-[#D4AF37]/10 shadow-xl">
                    <h1 className="text-3xl font-serif font-bold mb-4">Something went wrong</h1>
                    <Link href="/projects" className="text-[#D4AF37] font-bold underline underline-offset-8">Return to Portfolio</Link>
                </div>
            </div>
        );
    }

    const totalAmount = project.total_amount;
    const amountReceived = project.milestones?.reduce((sum: number, m: Milestone) => sum + (m.amount_paid || 0), 0) || 0;

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans pb-20">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-[#D4AF37]/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/projects" className="text-zinc-400 hover:text-[#D4AF37] transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <Link href="/projects" className="text-3xl font-serif font-bold tracking-[0.05em]">
                            Kova
                        </Link>

                        <nav className="hidden md:flex items-center gap-8 ml-10">
                            <Link href="/projects" className="text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-[#1A1A1A] transition-colors">
                                Projects
                            </Link>
                            <div className="flex items-center gap-1.5 opacity-40 cursor-not-allowed group">
                                <span className="text-sm font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-500 transition-colors">Materials</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-40 cursor-not-allowed group">
                                <span className="text-sm font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-500 transition-colors">Team</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-40 cursor-not-allowed group">
                                <span className="text-sm font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-500 transition-colors">Schedule</span>
                            </div>
                        </nav>

                    </div>
                    <div className="flex items-center gap-4">
                        <Suspense fallback={<div className="w-8 h-8 bg-zinc-100 rounded-full animate-pulse" />}>
                            <AuthStatus session={session} />
                        </Suspense>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 space-y-12">

                {/* Project Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 border-b border-[#D4AF37]/10 pb-12">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#1A1A1A]">{project.project_name}</h1>
                            <span className={`px-4 py-1 rounded-full text-[10px] font-bold tracking-widest border ${project.status === 'active'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                }`}>
                                {project.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-zinc-500 font-medium">
                            <div className="flex items-center gap-2">
                                <span className="text-[#D4AF37]">●</span>
                                {project.client_name}
                            </div>
                            {project.client_contact && (
                                <div className="flex items-center gap-2">
                                    <span className="hidden sm:inline text-zinc-300">|</span>
                                    {project.client_contact}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="hidden sm:inline text-zinc-300">|</span>
                                <Calendar className="w-4 h-4 text-[#D4AF37]" />
                                Created {new Date(project.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/projects/${project.id}/edit`}
                            className="inline-flex items-center justify-center gap-2 bg-white border border-[#D4AF37]/20 hover:bg-[#FAF9F6] text-[#1A1A1A] px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm"
                        >
                            <Edit className="w-4 h-4 text-[#D4AF37]" />
                            EDIT
                        </Link>
                        <ShareProjectModal
                            projectId={project.id}
                            currentShareUuid={project.share_uuid}
                            shareEnabled={project.share_enabled ?? true}
                        />
                    </div>
                </div>

                {/* Financial Dashboard */}
                <FinancialDashboardWrapper
                    projectId={project.id}
                    totalAmount={totalAmount}
                    amountReceived={amountReceived}
                >
                    <div className="grid grid-cols-1 gap-12">
                        {/* Milestones Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-serif font-bold">Execution Phases</h2>
                                <div className="text-xs font-bold tracking-widest text-[#D4AF37] bg-white px-4 py-2 rounded-full border border-[#D4AF37]/10">
                                    {project.milestones.filter((m: Milestone) => m.status === 'paid').length} / {project.milestones.length} COMPLETED
                                </div>
                            </div>

                            <MilestoneList
                                milestones={project.milestones}
                                totalAmount={totalAmount}
                                projectName={project.project_name}
                                clientName={project.client_name}
                                projectId={project.id}
                            />
                        </div>

                        {/* Expenses Section */}
                        <div className="border-t border-[#D4AF37]/10 pt-12">
                            <ExpensesSection projectId={project.id} />
                        </div>
                    </div>
                </FinancialDashboardWrapper>

            </main>
        </div>
    );
}

