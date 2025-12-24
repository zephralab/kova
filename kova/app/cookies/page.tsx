import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CookiesPage() {
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
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Cookie Settings</h1>
                    <div className="h-1 w-20 bg-[#D4AF37] opacity-50"></div>
                </div>

                <div className="prose prose-zinc max-w-none space-y-8 text-zinc-600 leading-relaxed">
                    <p>
                        Kova uses cookies and similar technologies to enhance your experience as a
                        designer and ensuring the platform remains secure and functional.
                    </p>

                    <section>
                        <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Essential Cookies</h2>
                        <p>
                            These are required for the platform to function. They handle authentication
                            via Supabase and help you stay logged in to your professional portal.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Performance Cookies</h2>
                        <p>
                            We use these to understand how our beta users interact with the app,
                            allowing us to optimize speed and efficiency.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
