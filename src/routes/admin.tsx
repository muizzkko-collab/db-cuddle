import { createFileRoute, Outlet, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Globe,
  Tag,
  Settings,
  LogOut,
  Flag,
  Building2,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminLayout,
});

const nav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/subdomains", label: "Subdomains", icon: Globe },
  { to: "/admin/domains", label: "Domains", icon: Building2 },
  { to: "/admin/countries", label: "Countries", icon: Flag },
  { to: "/admin/discounts", label: "Discount Codes", icon: Tag },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminLayout() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const session = data.session;
      if (!session && !isLogin) {
        router.navigate({ to: "/admin/login" });
      } else if (session && isLogin) {
        router.navigate({ to: "/admin/dashboard" });
      }
      setEmail(session?.user.email ?? null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
      if (!session && !isLogin) router.navigate({ to: "/admin/login" });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [isLogin, router]);

  if (isLogin) return <Outlet />;
  if (checking) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/admin/login" });
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <aside className="fixed left-0 top-0 h-screen w-60 bg-[#1a1a2e] text-white flex flex-col">
        <div className="px-6 py-5 text-lg font-bold border-b border-white/10">CheckoutHubs</div>
        <nav className="flex-1 py-4">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm hover:bg-white/10 ${active ? "bg-white/15 border-l-2 border-white" : ""}`}
              >
                <Icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-6 py-2.5 text-sm hover:bg-white/10 text-left"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </nav>
      </aside>
      <div className="flex-1 ml-60 flex flex-col">
        <header className="bg-white border-b h-14 flex items-center justify-between px-6">
          <h1 className="font-semibold text-[#1a1a2e]">CheckoutHubs Admin</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{email}</span>
            <button
              onClick={handleLogout}
              className="rounded-md bg-[#2563eb] text-white px-3 py-1.5 text-xs hover:bg-[#1d4ed8]"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
