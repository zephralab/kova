import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AuthStatus from '@/components/AuthStatus';
import PaymentMethodsForm from '@/components/settings/payment-methods-form';

export default async function PaymentMethodsPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/projects" className="text-gray-400 hover:text-gray-600 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <Link href="/projects" className="font-bold text-xl tracking-tight hover:text-gray-700">
                            Kova
                        </Link>
                    </div>
                    <Suspense fallback={<div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />}>
                        <AuthStatus session={session} />
                    </Suspense>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
                    <p className="text-gray-500 mt-1">Add your bank account details to request payments from clients.</p>
                </div>

                <PaymentMethodsForm />
            </main>
        </div>
    );
}

