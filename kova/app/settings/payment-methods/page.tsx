import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PaymentMethodsForm from '@/components/settings/payment-methods-form';

export default async function PaymentMethodsPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    return (
        <div className="space-y-8">
            <div className="mb-8">
                <h1 className="text-2xl font-serif font-bold text-[#1A1A1A]">Bank Details</h1>
                <p className="text-zinc-500 text-sm mt-1">Configure your settlement accounts to receive payments from clients.</p>
            </div>

            <div className="bg-[#FAF9F6]/50 rounded-2xl border border-[#D4AF37]/5 p-2">
                <PaymentMethodsForm />
            </div>

            <div className="pt-8 border-t border-[#D4AF37]/10">
                <p className="text-[10px] text-zinc-400 font-medium">
                    Settlements are processed according to our standard T+2 schedule. <br />
                    Ensure all bank details are accurate to avoid payment delays.
                </p>
            </div>
        </div>
    );
}


