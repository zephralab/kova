import { Suspense } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import CreateProjectForm from '@/components/projects/create-project-form';
import AuthStatus from '@/components/AuthStatus';

export default async function CreateProjectPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header/Nav - Assuming a layout wrapper or just using AuthStatus for now */}
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
                <CreateProjectForm />
            </main>
        </div>
    );
}
