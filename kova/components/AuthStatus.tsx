"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

interface AuthStatusProps {
  session: Session | null;
}

export default function AuthStatus({ session: initialSession }: AuthStatusProps) {
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(false);

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

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setLoading(false);
  };

  if (session) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-zinc-600 dark:text-zinc-400">Status</span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Signed In
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-500">Email</span>
            <span className="text-sm font-medium text-black dark:text-zinc-50">
              {session.user.email}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-500">User ID</span>
            <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
              {session.user.id.slice(0, 8)}...
            </span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          {loading ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-zinc-600 dark:text-zinc-400">Status</span>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
          Not Signed In
        </span>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        You are not currently signed in.
      </p>
      <div className="flex gap-2">
        <Link
          href="/auth/sign-up"
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          Sign Up
        </Link>
        <Link
          href="/auth/sign-in"
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-center text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

