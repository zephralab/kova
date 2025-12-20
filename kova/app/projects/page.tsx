import Link from 'next/link';
import { Suspense } from 'react';
import { Plus, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUserWithFirm } from '@/lib/api/helpers';
import ProjectCard from '@/components/projects/project-card';
import AuthStatus from '@/components/AuthStatus';
import type { ProjectListItem } from '@/lib/types/api';
import type { ProjectSummary } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    let projects: ProjectListItem[] = [];
    let error = null;

    try {
        const { firmId } = await getAuthenticatedUserWithFirm(supabase);

        // Fetch projects summary - directly querying the view
        // Note: ProjectSummary type in `database.ts` matches view columns
        // ProjectListItem type in `api.ts` matches API response shape (camelCase)
        // We need to map DB snake_case to UI camelCase
        const { data, error: dbError } = await supabase
            .from('project_summary')
            .select('*')
            .eq('firm_id', firmId)
            .order('created_at', { ascending: false });

        if (dbError) throw dbError;

        projects = (data || []).map((p: any) => ({
            id: p.id,
            projectName: p.project_name,
            clientName: p.client_name,
            totalAmount: p.total_amount,
            amountReceived: p.amount_received,
            amountSpent: p.total_expenses,
            balance: p.balance,
            milestonePaid: p.milestones_paid,
            milestonePending: p.milestones_pending,
            shareUuid: p.share_uuid,
            createdAt: p.created_at,
        }));

    } catch (e) {
        console.error('Error fetching projects:', e);
        error = 'Failed to load projects';
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/projects" className="font-bold text-xl tracking-tight hover:text-gray-700">
                            Kova
                        </Link>
                        <Link
                            href="/settings/payment-methods"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Payment Settings
                        </Link>
                    </div>
                    <Suspense fallback={<div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />}>
                        <AuthStatus session={session} />
                    </Suspense>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
                        <p className="text-gray-500 mt-1">Manage your active projects and track financials.</p>
                    </div>
                    <Link
                        href="/projects/create"
                        className="inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Project
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
                        {error}
                    </div>
                )}

                {/* Projects Grid */}
                {projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Plus className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
                        <p className="text-gray-500 mt-1 mb-6 max-w-sm mx-auto">
                            Get started by creating your first project with milestones and budget tracking.
                        </p>
                        <Link
                            href="/projects/create"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Create your first project &rarr;
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
