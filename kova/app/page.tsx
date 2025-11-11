import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AuthStatus from "@/components/AuthStatus";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const hasEnvVars =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-8 px-8 py-16">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
            Welcome to Kova
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Your Next.js application with Supabase authentication is ready to go!
          </p>
        </div>

        <div className="w-full max-w-2xl space-y-6">
          {/* Configuration Status */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
              Configuration Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Environment Variables
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    hasEnvVars
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {hasEnvVars ? "Configured" : "Not Configured"}
                </span>
              </div>
              {!hasEnvVars && (
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                  Please create a <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">.env.local</code> file
                  with your Supabase credentials. See{" "}
                  <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                    SUPABASE_AUTH_SETUP.md
                  </code>{" "}
                  for instructions.
                </p>
              )}
            </div>
          </div>

          {/* Authentication Status */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
              Authentication Status
            </h2>
            <AuthStatus session={session} />
          </div>

          {/* Quick Links */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
              Next Steps
            </h2>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-zinc-400">•</span>
                <span>
                  Follow the setup guide in{" "}
                  <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                    SUPABASE_AUTH_SETUP.md
                  </code>{" "}
                  to configure authentication
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-zinc-400">•</span>
                <span>
                  <Link
                    href="/auth/sign-up"
                    className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                  >
                    Sign up
                  </Link>{" "}
                  to create a new account, or{" "}
                  <Link
                    href="/auth/sign-in"
                    className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                  >
                    sign in
                  </Link>{" "}
                  if you already have one
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-zinc-400">•</span>
                <span>Set up protected routes and middleware</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-zinc-400">•</span>
                <span>Start building your application features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-zinc-400">•</span>
                <span>
                  Try the {" "}
                  <Link
                    href="/auth/sign-in"
                    className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                  >
                    sign-in page
                  </Link>{" "}
                  to authenticate with your Supabase credentials
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
