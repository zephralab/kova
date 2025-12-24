import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Privacy Policy</h1>
                    <div className="h-1 w-20 bg-[#D4AF37] opacity-50"></div>
                    <p className="text-zinc-500 mt-6 text-sm">Last Updated: December 2025</p>
                </div>

                <div className="prose prose-zinc max-w-none space-y-8 text-zinc-600 leading-relaxed">
                    <p>
                        Your privacy is fundamental to our mission at Kova. This policy outlines how
                        we handle your data as a designer and the data of your clients.
                    </p>

                    <section>
                        <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Data Collection</h2>
                        <p>
                            We collect minimal data required to provide our financial management services:
                            email addresses, firm names, and project milestone structures.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Client Data</h2>
                        <p>
                            We act as a processor for the client data you enter. We do not sell or share
                            your clients' information with third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Security</h2>
                        <p>
                            We use industry-standard encryption to protect your data during transit
                            and at rest in our secure database.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
