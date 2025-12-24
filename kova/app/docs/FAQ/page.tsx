import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function FAQPage() {
    const faqs = [
        {
            q: "How do I request my first payment?",
            a: "Navigate to your project, create a milestone, and click 'Mark as Pending'. You can then share the secure client link to collect payment."
        },
        {
            q: "Is Kova secure for my clients?",
            a: "Absolutely. We use industry-standard encryption and partner with Razorpay for all financial transactions, ensuring high security and trust."
        },
        {
            q: "Can I track expenses in different categories?",
            a: "Yes, our expense tracking feature allows you to categorize costs by materials, labor, and overhead for clear margin analysis."
        }
    ];

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans pb-20">
            <nav className="fixed top-0 w-full z-50 bg-[#FAF9F6]/80 backdrop-blur-md border-b border-[#D4AF37]/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-zinc-400 hover:text-[#D4AF37] transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="text-3xl font-serif font-bold tracking-[0.05em]">Kova</div>
                    </div>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-6 pt-40">
                <div className="mb-16 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Designer FAQ</h1>
                    <div className="h-1 w-20 bg-[#D4AF37] opacity-50 mx-auto md:mx-0"></div>
                    <p className="text-zinc-500 mt-6 text-lg">Everything you need to know about managing your design business on Kova.</p>
                </div>

                <div className="space-y-12">
                    {faqs.map((faq, i) => (
                        <div key={i} className="group p-8 bg-white rounded-3xl border border-[#D4AF37]/10 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/5 transition-all duration-500">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-4">{faq.q}</h3>
                                    <p className="text-zinc-600 leading-relaxed">{faq.a}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
