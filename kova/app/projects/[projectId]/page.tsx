import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Edit, Share2, MoreVertical, Wallet, TrendingDown, ArrowDownLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import AuthStatus from '@/components/ui/AuthStatus';
import MilestoneList from '@/components/projects/milestone-list';
import type { Milestone } from '@/lib/types/database';

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage(props: PageProps) {
    const params = await props.params;
    const supabase = await createClient();
    let project = null;
    let error = null;

    try {
        const { firmId } = await getAuthenticatedUserWithFirm(supabase);

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
            if (dbError?.code !== 'PGRST116') { // Not found code usually
                console.error('Error fetching project:', dbError);
            }
            notFound();
        }

        project = data;

        // Sort milestones
        if (project.milestones) {
            project.milestones.sort((a: Milestone, b: Milestone) => a.order_index - b.order_index);
        }

    } catch (e) {
        // If auth fails or other critical error
        console.error('Critical error in project detail:', e);
        error = true; // Flag to show error UI
    }

    if (error) {
        // Minimal error UI
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                    <Link href="/projects" className="text-blue-600 hover:underline">Return to Projects</Link>
                </div>
            </div>
        );
    }

    // Calculate financials
    // In a real app we'd use the `project_summary` view again or aggregates, 
    // but here we have the raw milestones so we can calc some of it.
    // However, `project_summary` is better because it includes expenses.
    // For now, let's just calculate from milestones for received amount
    const totalAmount = project.total_amount;
    const amountReceived = project.milestones?.reduce((sum: number, m: Milestone) => sum + (m.amount_paid || 0), 0) || 0;
    // We don't have expenses loaded here. For accurate balance we should fetching project_summary row in parallel or separate.
    // For Week 2 scope, showing rudimentary balance (Received - 0 expenses) is okay or fetch Summary.

    // Let's fetch summary for accurate financial dashboard
    const { data: summary } = await supabase
        .from('project_summary')
        .select('*')
        .eq('id', params.projectId)
        .single();

    const balance = summary?.balance ?? (amountReceived);
    const amountSpent = summary?.total_expenses ?? 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/projects" className="text-gray-400 hover:text-gray-600 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="font-bold text-xl tracking-tight">Kova</div>
                    </div>
                    <Suspense fallback={<div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />}>
                        <AuthStatus />
                    </Suspense>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Project Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-bold text-gray-900">{project.project_name}</h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${project.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100'
                                }`}>
                                {project.status.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-gray-500 text-lg">{project.client_name} {project.client_contact && <span className="text-gray-400 text-sm">| {project.client_contact}</span>}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/projects/${project.id}/edit`}
                            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </Link>
                        <button className="inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    </div>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-500 uppercase">Total Budget</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <ArrowDownLeft className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-500 uppercase">Received</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">₹{amountReceived.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mt-1">From paid milestones</div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <TrendingDown className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-500 uppercase">Balance</span>
                        </div>
                        <div className={`text-2xl font-bold ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            ₹{balance.toLocaleString()}
                        </div>
                        {amountSpent > 0 && <div className="text-xs text-gray-500 mt-1">After ₹{amountSpent.toLocaleString()} expenses</div>}
                    </div>
                </div>

                {/* Milestones Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Payment Milestones</h2>
                        <div className="text-sm text-gray-500">
                            {project.milestones.filter((m: Milestone) => m.status === 'paid').length} of {project.milestones.length} Paid
                        </div>
                    </div>

                    <MilestoneList milestones={project.milestones} totalAmount={totalAmount} />
                </div>

            </main>
        </div>
    );
}
