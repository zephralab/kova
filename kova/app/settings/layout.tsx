import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AuthStatus from '@/components/AuthStatus';
import { User, CreditCard, ArrowLeft } from 'lucide-react';

export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/auth/sign-in');
    }


    const navItems = [
        { name: 'Profile', href: '/settings/profile', icon: User },
        { name: 'Bank Details', href: '/settings/payment-methods', icon: CreditCard },
    ];

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
                    </div>
                    <div className="flex items-center gap-4">
                        <Suspense fallback={<div className="w-8 h-8 bg-zinc-100 rounded-full animate-pulse" />}>
                            <AuthStatus session={session} />
                        </Suspense>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row gap-12 text-zinc-500">
                    {/* Sidebar */}
                    <aside className="w-full md:w-64 space-y-2">
                        <p className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase px-4 mb-6">Settings</p>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white hover:text-[#1A1A1A] transition-all group font-bold tracking-wide text-sm"
                            >
                                <item.icon className="w-4 h-4 text-[#D4AF37]/50 group-hover:text-[#D4AF37] transition-colors" />
                                {item.name}
                            </Link>
                        ))}
                    </aside>

                    {/* Content */}
                    <div className="flex-1 bg-white rounded-3xl border border-[#D4AF37]/10 p-8 shadow-sm">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
