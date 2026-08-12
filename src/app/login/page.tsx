import { loginAction } from "@/actions/auth";
import type { Metadata } from "next";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = { title: "Login - Kriva Pictures Admin" };

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-bg px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-accent mx-auto mb-3 flex items-center justify-center text-white font-semibold">
            K
          </div>
          <div className="text-text font-semibold text-lg">Kriva Pictures</div>
          <div className="text-text-muted text-sm mt-1">Admin Dashboard</div>
        </div>

        <form action={loginAction} className="bg-surface rounded-2xl p-8 border border-border shadow-sm">
          <h1 className="text-text font-semibold text-base mb-6">Sign in</h1>

          {error && (
            <div className="mb-4 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-3">
              Incorrect password. Try again.
            </div>
          )}

          <label className="block mb-4">
            <span className="text-xs font-medium text-text-muted mb-1.5 block">Password</span>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
              placeholder="Enter admin password"
            />
          </label>

          <button
            type="submit"
            className="w-full bg-accent hover:bg-accent-hover transition-colors text-white font-medium text-sm py-2.5 rounded-lg"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
