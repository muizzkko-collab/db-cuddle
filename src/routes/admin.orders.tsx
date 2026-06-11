import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtCurrency, fmtDate, statusBadge, toCSV, downloadCSV } from "@/lib/admin-utils";
import type { Tables } from "@/integrations/supabase/types";
import { COUNTRIES, SUPPORTED_COUNTRIES } from "@/lib/countries";

type Order = Tables<"orders">;
type OrderItem = Tables<"order_items">;

export const Route = createFileRoute("/admin/orders")({
  validateSearch: (s: Record<string, unknown>) => ({
    domain: typeof s.domain === "string" ? s.domain : undefined,
  }),
  component: Orders,
});

const STATUSES = ["All", "Pending", "Paid", "Processing", "Shipped", "Delivered", "Refunded"];

function Orders() {
  const search = useSearch({ from: "/admin/orders" });
  const [orders, setOrders] = useState<Order[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("All");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [domain, setDomain] = useState<string>(search.domain ?? "");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Order | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    const list = (data ?? []) as Order[];
    setOrders(list);
    if (list.length) {
      const { data: items } = await supabase.from("order_items").select("order_id").in("order_id", list.map(o => o.id));
      const counts: Record<string, number> = {};
      for (const i of (items ?? []) as { order_id: string }[]) counts[i.order_id] = (counts[i.order_id] ?? 0) + 1;
      setItemCounts(counts);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (status !== "All") {
        const s = status.toLowerCase();
        if (o.payment_status !== s && o.order_status !== s) return false;
      }
      if (q) {
        const t = q.toLowerCase();
        const hay = `${o.customer_name} ${o.email ?? ""} ${o.order_number}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      if (domain && o.source_domain !== domain) return false;
      if (countryFilter && (o.country_code ?? "").toLowerCase() !== countryFilter) return false;
      if (from && o.created_at && new Date(o.created_at) < new Date(from)) return false;
      if (to && o.created_at && new Date(o.created_at) > new Date(to + "T23:59:59")) return false;
      return true;
    });
  }, [orders, status, q, from, to, domain, countryFilter]);

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const exportCSV = () => {
    const rows = filtered.map((o) => ({
      order_number: o.order_number,
      name: o.customer_name,
      email: o.email,
      product: o.product_name,
      variant: o.variant_label,
      total: o.total,
      currency: o.currency,
      payment_status: o.payment_status,
      order_status: o.order_status,
      country: o.country,
      country_code: o.country_code,
      source_domain: o.source_domain,
      created_at: o.created_at,
    }));
    downloadCSV(`orders-${Date.now()}.csv`, toCSV(rows));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1 text-xs rounded-full border ${status === s ? "bg-[#1a1a2e] text-white" : "bg-white"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => { setCountryFilter(""); setPage(1); }}
            className={`px-3 py-1 text-xs rounded-full border ${!countryFilter ? "bg-[#1a1a2e] text-white" : "bg-white"}`}
          >All Countries</button>
          {SUPPORTED_COUNTRIES.map((code) => {
            const c = COUNTRIES[code];
            return (
              <button
                key={code}
                onClick={() => { setCountryFilter(code); setPage(1); }}
                className={`px-3 py-1 text-xs rounded-full border ${countryFilter === code ? "bg-[#1a1a2e] text-white" : "bg-white"}`}
              >
                {c.flag} {c.code.toUpperCase()}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            placeholder="Search name, email, order #"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="border rounded-md px-3 py-1.5 text-sm flex-1 min-w-[200px]"
          />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded-md px-2 py-1.5 text-sm" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded-md px-2 py-1.5 text-sm" />
          {domain && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
              Domain: {domain} <button onClick={() => setDomain("")} className="ml-1">×</button>
            </span>
          )}
          <button onClick={exportCSV} className="ml-auto bg-[#2563eb] text-white px-3 py-1.5 rounded-md text-sm">Export CSV</button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2">#</th><th>Name</th><th>Email</th><th>Product</th>
              <th>Items</th><th>Total</th><th>Payment</th><th>Order</th><th>Source</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="py-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : pageRows.length ? pageRows.map((o) => (
              <tr key={o.id} onClick={() => setSelected(o)} className="border-t hover:bg-gray-50 cursor-pointer">
                <td className="px-3 py-2">#{o.order_number}</td>
                <td>{o.customer_name}</td>
                <td className="text-muted-foreground">{o.email ?? "—"}</td>
                <td>{o.product_name ?? "—"}</td>
                <td className="text-muted-foreground">{itemCounts[o.id] ?? (o.product_name ? 1 : 0)}</td>
                <td>{fmtCurrency(o.total ?? 0, o.currency ?? "GBP")}</td>
                <td><span className={`px-2 py-0.5 rounded text-xs ${statusBadge(o.payment_status)}`}>{o.payment_status ?? "pending"}</span></td>
                <td><span className={`px-2 py-0.5 rounded text-xs ${statusBadge(o.order_status)}`}>{o.order_status ?? "pending"}</span></td>
                <td>
                  {o.source_domain === "checkouthubs.com"
                    ? <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 font-medium">Main Store</span>
                    : <span className="text-muted-foreground">{o.source_domain ?? "—"}</span>}
                </td>
                <td className="text-muted-foreground">{fmtDate(o.created_at)}</td>
              </tr>
            )) : (
              <tr><td colSpan={10} className="py-6 text-center text-muted-foreground">No orders match.</td></tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-3 py-2 border-t text-xs text-muted-foreground">
          <span>{filtered.length} orders</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-40">Prev</button>
            <span>Page {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {selected && <OrderDrawer order={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); load(); }} />}
    </div>
  );
}

function OrderDrawer({ order, onClose, onSaved }: { order: Order; onClose: () => void; onSaved: () => void }) {
  const [orderStatus, setOrderStatus] = useState(order.order_status ?? "pending");
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status ?? "pending");
  const [notes, setNotes] = useState(order.admin_notes ?? "");
  const [tracking, setTracking] = useState(order.fulfillment_tracking ?? "");
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    supabase.from("order_items").select("*").eq("order_id", order.id).then(({ data }) => {
      setItems((data ?? []) as OrderItem[]);
    });
  }, [order.id]);

  const save = async () => {
    setSaving(true);
    await supabase.from("orders").update({
      order_status: orderStatus,
      payment_status: paymentStatus,
      admin_notes: notes,
      fulfillment_tracking: tracking,
    }).eq("id", order.id);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white h-full overflow-y-auto p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-[#1a1a2e]">Order #{order.order_number}</h2>
            <p className="text-xs text-muted-foreground">{fmtDate(order.created_at)}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none">×</button>
        </div>
        <div className="mt-4 space-y-4 text-sm">
          <Section title="Customer">
            <Field label="Name" value={order.customer_name} />
            <Field label="Email" value={order.email} />
            <Field label="Phone" value={order.phone} />
            <Field label="Address" value={[order.address_line1, order.address_line2, order.city, order.postcode, order.country].filter(Boolean).join(", ")} />
          </Section>
          {items.length > 0 && (
            <div className="border rounded-md p-3">
              <h3 className="font-semibold text-[#1a1a2e] mb-2 text-sm">Items ({items.length})</h3>
              <ul className="divide-y text-xs">
                {items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-2 py-1.5">
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{i.product_name}</span>
                      {i.variant_label ? <span className="text-muted-foreground"> — {i.variant_label}</span> : null}
                      <span className="text-muted-foreground"> × {i.quantity}</span>
                    </span>
                    <span className="font-medium">{fmtCurrency(Number(i.total_price ?? 0), order.currency ?? "GBP")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Section title="Product">
            <Field label="Product" value={order.product_name} />
            <Field label="Variant" value={order.variant_label} />
            <Field label="Quantity" value={order.quantity} />
            <Field label="Subtotal" value={fmtCurrency(order.subtotal ?? 0, order.currency ?? "GBP")} />
            <Field label="Discount" value={order.discount_code ? `${order.discount_code} (-${fmtCurrency(order.discount_amount ?? 0, order.currency ?? "GBP")})` : "—"} />
            <Field label="Bump" value={order.bump_added ? `${order.bump_name} (+${fmtCurrency(order.bump_price ?? 0, order.currency ?? "GBP")})` : "No"} />
            <Field label="Upsell" value={order.upsell_accepted ? "Accepted" : "Declined"} />
            <Field label="Total" value={fmtCurrency(order.total ?? 0, order.currency ?? "GBP")} />
            <Field label="Source" value={order.source_domain} />
          </Section>
          <Section title="Manage">
            <label className="block">
              <span className="text-xs text-muted-foreground">Order Status</span>
              <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className="mt-1 w-full border rounded-md px-2 py-1.5">
                {["pending", "processing", "shipped", "delivered", "refunded"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="block mt-2">
              <span className="text-xs text-muted-foreground">Payment Status</span>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="mt-1 w-full border rounded-md px-2 py-1.5">
                {["pending", "paid", "refunded", "failed"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="block mt-2">
              <span className="text-xs text-muted-foreground">Fulfillment Tracking</span>
              <input value={tracking} onChange={(e) => setTracking(e.target.value)} className="mt-1 w-full border rounded-md px-2 py-1.5" />
            </label>
            <label className="block mt-2">
              <span className="text-xs text-muted-foreground">Admin Notes</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full border rounded-md px-2 py-1.5" />
            </label>
            <button onClick={save} disabled={saving} className="mt-3 w-full bg-[#2563eb] text-white py-2 rounded-md text-sm font-medium disabled:opacity-50">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-md p-3">
      <h3 className="font-semibold text-[#1a1a2e] mb-2 text-sm">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value == null || value === "" ? "—" : String(value)}</span>
    </div>
  );
}
