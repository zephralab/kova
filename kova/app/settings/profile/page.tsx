import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const { user } = session!;

    return (
        <div className="space-y-12">
            <section>
                <div className="mb-8">
                    <h2 className="text-2xl font-serif font-bold">Account Profile</h2>
                    <p className="text-zinc-500 text-sm mt-1">Manage your professional credentials and account access.</p>
                </div>

                <div className="grid grid-cols-1 gap-8 max-w-2xl">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">Email Address</label>
                        <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#D4AF37]/5 font-medium text-zinc-600">
                            {user.email}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-2 italic">Contact support to change your account email.</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">Firm Identity</label>
                        <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#D4AF37]/5 font-medium text-zinc-600">
                            {user.user_metadata?.firm_name || 'Individual Designer'}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">Account ID</label>
                        <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#D4AF37]/5 font-mono text-xs text-zinc-400">
                            {user.id}
                        </div>
                    </div>
                </div>
            </section>

            <section className="pt-12 border-t border-[#D4AF37]/10">
                <div className="mb-8 text-center md:text-left">
                    <h3 className="text-xl font-serif font-bold text-zinc-400">Security</h3>
                    <p className="text-zinc-400 text-sm mt-1">Two-factor authentication and advanced security controls are coming soon.</p>
                </div>
            </section>
        </div>
    );
}
