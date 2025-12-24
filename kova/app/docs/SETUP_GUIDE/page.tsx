import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function SetupGuidePage() {
    const steps = [
        { title: "Create Your Account", desc: "Sign up and set up your firm profile with your brand identity." },
        { title: "Configure Bank Details", desc: "Go to settings and enter your settlement account for Razorpay transfers." },
        { title: "Start Your First Project", desc: "Define your milestones and share the first payment link with your client." }
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
                <div className="mb-16">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">App Setup Guide</h1>
                    <div className="h-1 w-20 bg-[#D4AF37] opacity-50"></div>
                    <p className="text-zinc-500 mt-6 text-lg">Follow these steps to get your design practice ready for professional billing.</p>
                </div>

                <div className="space-y-4">
                    {steps.map((step, i) => (
                        <div key={i} className="flex gap-6 p-8 bg-white rounded-3xl border border-[#D4AF37]/5 shadow-sm">
                            <div className="text-3xl font-serif font-bold text-[#D4AF37]/20">{i + 1}</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                <p className="text-zinc-600">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
