import Link from "next/link";
import SignInForm from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-col gap-8 rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Sign in to Kova
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use the email and password you configured in Supabase Authentication.
          </p>
        </div>
        <SignInForm />
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            Sign up
          </Link>
        </p>
        <Link
          href="/"
          className="text-center text-sm font-medium text-zinc-700 underline underline-offset-4 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Back to home
        </Link>
      </main>
    </div>
  );
}
