import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, CreditCard, LayoutDashboard, Share2 } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to projects if already logged in
  if (session) {
    redirect("/projects");
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#FAF9F6]/80 backdrop-blur-md border-b border-[#D4AF37]/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-3xl font-serif font-bold tracking-[0.05em]">Kova</div>

          <div className="flex items-center gap-8">
            <Link href="/auth/sign-in" className="text-sm font-medium hover:text-[#D4AF37] transition-colors">
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#1A1A1A]/80 transition-all shadow-lg shadow-black/10"
            >
              Start Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Design with Passion, <br />
            <span className="text-[#D4AF37]">Bill with Precision.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            The modern financial platform for interior designers. Manage milestone payments,
            track project expenses, and build client trust with professional transparency.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/sign-up"
              className="w-full sm:w-auto bg-[#1A1A1A] text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-[#1A1A1A]/80 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-black/10"
            >
              Start My Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-10 py-4 rounded-full text-lg font-medium border border-[#D4AF37]/20 hover:bg-[#D4AF37]/5 transition-all text-center"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Built for the Way You Work</h2>
            <div className="h-1 w-20 bg-[#D4AF37] mx-auto opacity-50"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="group">
              <div className="w-14 h-14 bg-[#FAF9F6] rounded-2xl flex items-center justify-center mb-6 border border-[#D4AF37]/20 group-hover:bg-[#1A1A1A] group-hover:text-[#D4AF37] transition-all duration-500">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Milestone Mastery</h3>
              <p className="text-zinc-600 leading-relaxed">
                Automate your payment schedule. Set phases, request payments, and get notified
                the moment your client clears an invoice.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="w-14 h-14 bg-[#FAF9F6] rounded-2xl flex items-center justify-center mb-6 border border-[#D4AF37]/20 group-hover:bg-[#1A1A1A] group-hover:text-[#D4AF37] transition-all duration-500">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Financial Clarity</h3>
              <p className="text-zinc-600 leading-relaxed">
                Never lose track of your margins. A sophisticated dashboard that balances
                project revenue against real-time expenses.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="w-14 h-14 bg-[#FAF9F6] rounded-2xl flex items-center justify-center mb-6 border border-[#D4AF37]/20 group-hover:bg-[#1A1A1A] group-hover:text-[#D4AF37] transition-all duration-500">
                <Share2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Client Portals</h3>
              <p className="text-zinc-600 leading-relaxed">
                Professionalism at its peak. Share secure, login-free links with clients to
                view project progress and financial status instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-footer CTA */}
      <section className="py-24 bg-[#D4AF37] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">Ready to elevate your <br className="hidden md:block" /> design business?</h2>
          <p className="text-white/90 mb-10 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Join the elite circle of designers who prioritize financial transparency and client trust.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-flex bg-[#1A1A1A] text-white px-10 py-4 rounded-full text-lg font-bold tracking-tight hover:bg-black transition-all shadow-2xl active:scale-95"
          >
            Start Your Premium Experience
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] pt-32 pb-12 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-1 md:col-span-2 space-y-8">
              <div>
                <div className="text-3xl font-serif font-bold tracking-tight mb-4">Kova</div>
                <div className="h-1 w-12 bg-[#D4AF37]/50 mb-6"></div>
                <p className="text-zinc-400 max-w-sm leading-relaxed text-sm font-medium">
                  Design with Passion. Bill with Precision. <br />
                  The sophisticated financial operating system <br className="hidden lg:block" />
                  crafted exclusively for interior design professionals.
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-10">Platform</h4>
              <ul className="space-y-5 text-sm text-zinc-400 font-medium">
                <li><Link href="/projects" className="hover:text-white transition-colors">Portfolio Management</Link></li>
                <li><Link href="/projects" className="hover:text-white transition-colors">Milestone Billing</Link></li>
                <li><Link href="/projects" className="hover:text-white transition-colors">Expense Tracking</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-10">Resources</h4>
              <ul className="space-y-5 text-sm text-zinc-400 font-medium">
                <li><Link href="/docs/FAQ" className="hover:text-white transition-colors">Client FAQ</Link></li>
                <li><Link href="/docs/SETUP_GUIDE" className="hover:text-white transition-colors">Setup Guide</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
                © {new Date().getFullYear()} Kova Labs. Built for Designers.
              </p>
            </div>
            <div className="flex gap-10 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              <Link href="/privacy" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</Link>
              <Link href="/cookies" className="hover:text-[#D4AF37] transition-colors">Cookie Settings</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


