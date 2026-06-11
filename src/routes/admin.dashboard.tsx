import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtCurrency, fmtDate, statusBadge } from "@/lib/admin-utils";
import { COUNTRIES, SUPPORTED_COUNTRIES, type CountryCode } from "@/lib/countries";

export const Route = createFileRoute("/admin/dashboard")({
  component: Dashboard,
});

type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  product_name: string | null;
  total: number | null;
  payment_status: string | null;
  order_status: string | null;
  source_domain: string | null;
  created_at: string | null;
  currency: string | null;
  country_code: string | null;
};

function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("orders")
      .select("id,order_number,customer_name,product_name,total,payment_status,order_status,source_domain,created_at,currency,country_code")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as Order[]);
        setLoading(false);
      });
  }, []);

  const paid = orders.filter((o) => o.payment_status === "paid");
  const revenue = paid.reduce((a, o) => a + (o.total ?? 0), 0);
  const today = new Date().toDateString();
  const todays = orders.filter((o) => o.created_at && new Date(o.created_at).toDateString() === today);
  const aov = paid.length ? revenue / paid.length : 0;

  const bySub = new Map<string, { count: number; rev: number; paid: number; pending: number }>();
  orders.forEach((o) => {
    const k = o.source_domain ?? "(none)";
    const r = bySub.get(k) ?? { count: 0, rev: 0, paid: 0, pending: 0 };
    r.count++;
    if (o.payment_status === "paid") {
      r.paid++;
      r.rev += o.total ?? 0;
    }
    if (o.payment_status === "pending" || !o.payment_status) r.pending++;
    bySub.set(k, r);
  });
  const subRows = [...bySub.entries()].sort((a, b) => b[1].rev - a[1].rev);

  type CountryStats = { count: number; paid: number; rev: number; aov: number; topProduct: string };
  const byCountry = new Map<string, CountryStats & { subCounts: Map<string, number> }>();
  orders.forEach((o) => {
    const k = (o.country_code ?? "").toLowerCase() || "other";
    const entry = byCountry.get(k) ?? { count: 0, paid: 0, rev: 0, aov: 0, topProduct: "", subCounts: new Map() };
    entry.count++;
    if (o.payment_status === "paid") {
      entry.paid++;
      entry.rev += o.total ?? 0;
    }
    if (o.source_domain) {
      const sub = o.source_domain;
      entry.subCounts.set(sub, (entry.subCounts.get(sub) ?? 0) + 1);
    }
    byCountry.set(k, entry);
  });
  const countryRows = SUPPORTED_COUNTRIES.map((code) => {
    const e = byCountry.get(code);
    if (!e) return null;
    const topProduct = e.subCounts.size
      ? [...e.subCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : "—";
    const aov = e.paid ? e.rev / e.paid : 0;
    return { code, ...COUNTRIES[code], count: e.count, paid: e.paid, rev: e.rev, aov, topProduct };
  }).filter(Boolean) as Array<{ code: CountryCode; flag: string; name: string; count: number; paid: number; rev: number; aov: number; topProduct: string }>;

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total Revenue" value={fmtCurrency(revenue)} />
        <Stat label="Total Orders" value={orders.length.toString()} />
        <Stat label="Today's Orders" value={todays.length.toString()} />
        <Stat label="Avg Order Value" value={fmtCurrency(aov)} />
      </div>

      <Card title="Revenue by Subdomain">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground border-b">
            <tr>
              <th className="py-2">Subdomain</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Paid</th>
              <th>Pending</th>
            </tr>
          </thead>
          <tbody>
            {subRows.map(([k, r]) => (
              <tr key={k} className="border-b hover:bg-gray-50">
                <td className="py-2 font-medium">{k}</td>
                <td>{r.count}</td>
                <td>{fmtCurrency(r.rev)}</td>
                <td>{r.paid}</td>
                <td>{r.pending}</td>
              </tr>
            ))}
            {!subRows.length && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No orders yet</td></tr>}
          </tbody>
        </table>
      </Card>

      <Card title="Revenue by Country">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground border-b">
            <tr>
              <th className="py-2">Country</th>
              <th>Total Orders</th>
              <th>Paid Orders</th>
              <th>Revenue</th>
              <th>Avg Order Value</th>
              <th>Top Product</th>
            </tr>
          </thead>
          <tbody>
            {countryRows.map((r) => (
              <tr key={r.code} className="border-b hover:bg-gray-50">
                <td className="py-2 font-medium">{r.flag} {r.name}</td>
                <td>{r.count}</td>
                <td>{r.paid}</td>
                <td>{fmtCurrency(r.rev)}</td>
                <td>{fmtCurrency(r.aov)}</td>
                <td className="text-muted-foreground text-xs">{r.topProduct}</td>
              </tr>
            ))}
            {!countryRows.length && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No country data yet</td></tr>}
          </tbody>
        </table>
      </Card>

      <Card title="Recent Orders">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground border-b">
            <tr>
              <th className="py-2">#</th>
              <th>Name</th>
              <th>Product</th>
              <th>Total</th>
              <th>Status</th>
              <th>Domain</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 10).map((o) => (
              <tr key={o.id} className="border-b hover:bg-gray-50">
                <td className="py-2">#{o.order_number}</td>
                <td>{o.customer_name}</td>
                <td>{o.product_name ?? "—"}</td>
                <td>{fmtCurrency(o.total ?? 0, o.currency ?? "GBP")}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusBadge(o.payment_status)}`}>{o.payment_status ?? "pending"}</span>
                </td>
                <td className="text-muted-foreground">{o.source_domain ?? "—"}</td>
                <td className="text-muted-foreground">{fmtDate(o.created_at)}</td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-muted-foreground">
                  No orders yet. <Link to="/admin/products" className="text-[#2563eb] underline">Add a product</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-[#1a1a2e] mt-1">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h2 className="font-semibold text-[#1a1a2e] mb-3">{title}</h2>
      {children}
    </div>
  );
}
