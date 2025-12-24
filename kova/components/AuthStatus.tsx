"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import { User, Settings, LogOut, ChevronDown, UserCircle } from "lucide-react";

interface AuthStatusProps {
  session: Session | null;
}

export default function AuthStatus({ session: initialSession }: AuthStatusProps) {
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Handle click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    setLoading(false);
  };

  if (session) {
    const email = session.user.email || "";
    const initials = email.charAt(0).toUpperCase();

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-1.5 rounded-full hover:bg-zinc-100 transition-colors border border-transparent hover:border-[#D4AF37]/20"
        >
          <div className="w-9 h-9 rounded-full bg-[#1A1A1A] text-[#D4AF37] flex items-center justify-center font-serif font-bold text-sm shadow-sm">
            {initials}
          </div>
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#D4AF37]/10 py-3 z-[100] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-3 border-b border-zinc-50 mb-2">
              <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Signed in as</p>
              <p className="text-sm font-bold text-[#1A1A1A] truncate">{email}</p>
            </div>

            <Link
              href="/settings/profile"
              className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-[#1A1A1A] hover:bg-zinc-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4 text-[#D4AF37]" />
              My Profile
            </Link>

            <Link
              href="/settings/payment-methods"
              className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-[#1A1A1A] hover:bg-zinc-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4 text-[#D4AF37]" />
              Settings
            </Link>

            <div className="h-px bg-zinc-50 my-2 mx-5" />

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {loading ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/auth/sign-in"
        className="text-sm font-bold tracking-widest uppercase text-zinc-400 hover:text-[#1A1A1A] transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/auth/sign-up"
        className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-[#1A1A1A]/90 transition-all shadow-lg shadow-black/10 active:scale-95"
      >
        Start
      </Link>
    </div>
  );
}


