import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Terms of Service</h1>
                    <div className="h-1 w-20 bg-[#D4AF37] opacity-50"></div>
                    <p className="text-zinc-500 mt-6 text-sm">Last Updated: December 2025</p>
                </div>

                <div className="prose prose-zinc max-w-none space-y-8 text-zinc-600 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using Kova, you agree to be bound by these Terms of Service.
                            Our platform is designed specifically for interior design professionals to manage
                            payments and client communications.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">2. Beta Usage</h2>
                        <p>
                            Kova is currently in a beta phase. While we strive for 100% reliability, the service
                            is provided "as is" during this period. We appreciate your feedback as we polish
                            the experience for a full launch.
                        </p>
                    </section>

                    <p className="pt-12 text-sm text-zinc-400">
                        For detailed inquiries, please contact legal@kovalabs.com
                    </p>
                </div>
            </main>
        </div>
    );
}
