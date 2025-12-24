import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { Plus, Settings, LayoutGrid, ListFilter } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import ProjectCard from '@/components/projects/project-card';
import AuthStatus from '@/components/AuthStatus';
import type { ProjectListItem } from '@/lib/types/api';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/auth/sign-in');
    }

    let projects: ProjectListItem[] = [];
    let error = null;


    try {
        const { firmId } = await getAuthenticatedUserWithFirm(supabase);

        const { data, error: dbError } = await supabase
            .from('projects')
            .select(`
                *,
                milestones(amount, amount_paid, status)
            `)
            .eq('firm_id', firmId)
            .order('created_at', { ascending: false });

        if (dbError) throw dbError;

        projects = (data || []).map((p: any) => {
            const milestones = p.milestones || [];
            const amountReceived = milestones.reduce((sum: number, m: any) => sum + (m.amount_paid || 0), 0);
            const milestonePaid = milestones.filter((m: any) => m.status === 'paid').length;
            const milestonePending = milestones.length - milestonePaid;

            return {
                id: p.id,
                projectName: p.project_name,
                clientName: p.client_name,
                totalAmount: p.total_amount,
                amountReceived: amountReceived,
                amountSpent: 0, // In-memory calculation of expenses would require another join
                balance: amountReceived, // Simple balance for now
                milestonePaid: milestonePaid,
                milestonePending: milestonePending,
                shareUuid: p.share_uuid,
                createdAt: p.created_at,
            };
        });

    } catch (e) {
        console.error('Error fetching projects:', e);
        error = 'Failed to load projects. Please ensure your database is correctly configured.';
    }


    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans pb-20">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-[#D4AF37]/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <Link href="/projects" className="text-3xl font-serif font-bold tracking-[0.05em] hover:text-[#D4AF37] transition-colors">
                            Kova
                        </Link>
                        <nav className="hidden md:flex items-center gap-8">
                            <Link href="/projects" className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1">
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
                            <Link href="/settings/payment-methods" className="text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-[#1A1A1A] transition-colors">
                                Settings
                            </Link>
                        </nav>

                    </div>
                    <div className="flex items-center gap-4">
                        <Suspense fallback={<div className="w-8 h-8 bg-zinc-100 rounded-full animate-pulse" />}>
                            <AuthStatus session={session} />
                        </Suspense>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                {/* Page Action Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Portfolio</h1>
                        <p className="text-zinc-500 max-w-md leading-relaxed font-medium">
                            Manage your active interior design commissions and track financial health in real-time.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2.5 bg-white border border-[#D4AF37]/10 rounded-xl text-zinc-400 hover:text-[#1A1A1A] transition-colors">
                            <ListFilter className="w-5 h-5" />
                        </button>
                        <Link
                            href="/projects/create"
                            className="inline-flex items-center justify-center gap-3 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white px-6 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all shadow-xl shadow-black/10 active:scale-95"
                        >
                            <Plus className="w-5 h-5 text-[#D4AF37]" />
                            NEW PROJECT
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                {/* Projects Grid */}
                {projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-[#D4AF37]/20">
                        <div className="mx-auto w-20 h-20 bg-[#FAF9F6] rounded-full flex items-center justify-center mb-6 border border-[#D4AF37]/10">
                            <LayoutGrid className="w-10 h-10 text-[#D4AF37] opacity-40" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold mb-3">No commissions yet</h3>
                        <p className="text-zinc-500 mb-10 max-w-xs mx-auto font-medium">
                            Begin by documenting your first project to unlock milestone tracking and expense management.
                        </p>
                        <Link
                            href="/projects/create"
                            className="text-[#D4AF37] hover:text-[#1A1A1A] font-bold tracking-widest text-sm underline underline-offset-8 transition-colors"
                        >
                            START YOUR FIRST PROJECT &rarr;
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}

