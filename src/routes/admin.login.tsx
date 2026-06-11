import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.navigate({ to: "/admin/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#1a1a2e]">Admin Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to manage CheckoutHubs.</p>
        <div className="mt-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-[#1a1a2e]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#1a1a2e]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#2563eb] text-white py-2 text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
