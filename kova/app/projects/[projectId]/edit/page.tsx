import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import EditProjectForm from '@/components/projects/edit-project-form';
import AuthStatus from '@/components/AuthStatus';

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function EditProjectPage(props: PageProps) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="font-bold text-xl tracking-tight">Kova</div>
                    <Suspense fallback={<div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />}>
                        <AuthStatus session={session} />
                    </Suspense>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <EditProjectForm projectId={params.projectId} />
                </div>
            </main>
        </div>
    );
}
