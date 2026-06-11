import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtCurrency } from "@/lib/admin-utils";

export const Route = createFileRoute("/admin/domains")({
  component: AdminDomains,
});

type Domain = {
  id: string;
  domain: string;
  company_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  brand_color: string | null;
  button_style: string | null;
  font_family: string | null;
  support_email: string | null;
  address: string | null;
  phone: string | null;
  gtm_id: string | null;
  meta_pixel_id: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_image_url: string | null;
  active: boolean | null;
};

type DomainStats = { orders: number; rev: number };

const blankDomain = (): Omit<Domain, "id"> => ({
  domain: "",
  company_name: "",
  logo_url: "",
  favicon_url: "",
  brand_color: "#2563eb",
  button_style: "rounded",
  font_family: "Inter",
  support_email: "",
  address: "",
  phone: "",
  gtm_id: "",
  meta_pixel_id: "",
  hero_headline: "Quality Products, Fast Delivery",
  hero_subheadline: "Trusted by thousands of customers across the UK",
  hero_image_url: "",
  active: true,
});

type DomainProduct = { id: string; subdomain: string; product_name: string; active: boolean | null; root_domain: string | null };

function AdminDomains() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [stats, setStats] = useState<Map<string, DomainStats>>(new Map());
  const [domainProducts, setDomainProducts] = useState<Map<string, DomainProduct[]>>(new Map());
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [editing, setEditing] = useState<Domain | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: d }, { data: o }, { data: p }] = await Promise.all([
      supabase.from("domains" as any).select("*").order("created_at", { ascending: true }),
      supabase.from("orders").select("source_domain,total,payment_status"),
      supabase.from("products").select("id,subdomain,product_name,active,root_domain").order("product_name"),
    ]);
    setDomains((d ?? []) as Domain[]);

    // Group products by root_domain
    const pm = new Map<string, DomainProduct[]>();
    ((p ?? []) as DomainProduct[]).forEach((prod) => {
      const key = (prod as any).root_domain ?? "__unassigned__";
      pm.set(key, [...(pm.get(key) ?? []), prod]);
    });
    setDomainProducts(pm);

    const m = new Map<string, DomainStats>();
    (o ?? []).forEach((r: any) => {
      const key = r.source_domain ?? "";
      const v = m.get(key) ?? { orders: 0, rev: 0 };
      v.orders++;
      if (r.payment_status === "paid") v.rev += r.total ?? 0;
      m.set(key, v);
    });
    setStats(m);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getDomainStats = (domain: string): DomainStats => {
    let total = { orders: 0, rev: 0 };
    stats.forEach((v, k) => {
      if (k === domain || k.endsWith(`.${domain}`)) {
        total.orders += v.orders;
        total.rev += v.rev;
      }
    });
    return total;
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[#1a1a2e]">Domains</h2>
        <button
          onClick={() => setCreating(true)}
          className="bg-[#2563eb] text-white px-3 py-1.5 rounded-md text-sm"
        >
          Add Domain
        </button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Domain</th>
              <th>Company</th>
              <th>Status</th>
              <th>Products</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => {
              const s = getDomainStats(d.domain);
              const prods = domainProducts.get(d.domain) ?? [];
              const isExpanded = expandedDomain === d.domain;
              return (
                <>
                  <tr key={d.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs font-medium">{d.domain}</td>
                    <td>{d.company_name ?? "—"}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded ${d.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {d.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setExpandedDomain(isExpanded ? null : d.domain)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {prods.length} product{prods.length !== 1 ? "s" : ""} {isExpanded ? "▲" : "▼"}
                      </button>
                    </td>
                    <td>{s.orders}</td>
                    <td>{fmtCurrency(s.rev)}</td>
                    <td>
                      <button onClick={() => setEditing(d)} className="text-[#2563eb] text-xs">Edit</button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${d.id}-products`} className="bg-blue-50 border-t">
                      <td colSpan={7} className="px-4 py-3">
                        {prods.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No products assigned to this domain yet. Go to Products → Edit a product → set its domain to <strong>{d.domain}</strong>.</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-blue-800 mb-2">Products assigned to {d.domain}</p>
                            {prods.map((p) => (
                              <div key={p.id} className="bg-white border border-blue-100 rounded-md px-3 py-2 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-xs text-gray-900">{p.product_name}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                    {p.active !== false ? "active" : "inactive"}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 gap-0.5 text-[10px] font-mono text-gray-500">
                                  <span>Checkout (prod): <strong className="text-gray-800">{p.subdomain}.{d.domain}</strong></span>
                                  <span>
                                    Checkout (preview):&nbsp;
                                    <a
                                      href={`/?subdomain=${p.subdomain}&domain=${d.domain}&country=uk`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 underline"
                                    >
                                      /?subdomain={p.subdomain}&domain={d.domain}&country=uk
                                    </a>
                                  </span>
                                  <span>
                                    Product detail:&nbsp;
                                    <a
                                      href={`/products/${p.subdomain}?domain=${d.domain}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 underline"
                                    >
                                      /products/{p.subdomain}?domain={d.domain}
                                    </a>
                                  </span>
                                  <span>
                                    Main store:&nbsp;
                                    <a
                                      href={`/?domain=${d.domain}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 underline"
                                    >
                                      /?domain={d.domain}
                                    </a>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {!domains.length && (
              <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No domains yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <DomainForm
          initial={editing ?? (blankDomain() as Domain)}
          isNew={creating}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function DomainForm({
  initial,
  isNew,
  onClose,
  onSaved,
}: {
  initial: Domain | Omit<Domain, "id">;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<any>(initial);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.domain.trim()) { alert("Domain is required."); return; }
    setSaving(true);
    if (isNew) {
      const { error } = await supabase.from("domains" as any).insert(f);
      if (error) { alert(`Error: ${error.message}`); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("domains" as any).update(f).eq("id", (f as Domain).id);
      if (error) { alert(`Error: ${error.message}`); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
  };

  const remove = async () => {
    if (!confirm(`Delete domain ${f.domain}? This cannot be undone.`)) return;
    await supabase.from("domains" as any).delete().eq("id", (f as Domain).id);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl bg-white h-full overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[#1a1a2e]">{isNew ? "Add Domain" : "Edit Domain"}</h2>
          <button onClick={onClose} className="text-2xl leading-none">×</button>
        </div>

        <div className="space-y-4 text-sm">
          <Section title="Domain">
            <Field label="Domain (e.g. checkoutr.com)" value={f.domain} onChange={(v) => set("domain", v)} disabled={!isNew} />
            <Field label="Company Name" value={f.company_name ?? ""} onChange={(v) => set("company_name", v)} />
          </Section>

          <Section title="Branding">
            <Field label="Logo URL" value={f.logo_url ?? ""} onChange={(v) => set("logo_url", v || null)} />
            <Field label="Favicon URL" value={f.favicon_url ?? ""} onChange={(v) => set("favicon_url", v || null)} />
            <div className="flex items-center gap-3">
              <label className="block flex-1">
                <span className="text-xs text-muted-foreground">Brand Color</span>
                <div className="mt-1 flex gap-2">
                  <input type="color" value={f.brand_color ?? "#2563eb"} onChange={(e) => set("brand_color", e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-gray-300" />
                  <input value={f.brand_color ?? ""} onChange={(e) => set("brand_color", e.target.value)}
                    className="flex-1 border rounded-md px-2 py-1.5 text-xs" placeholder="#2563eb" />
                </div>
              </label>
            </div>
            <Select label="Button Style" value={f.button_style ?? "rounded"} onChange={(v) => set("button_style", v)}
              options={["rounded", "square", "pill"]} />
            <Select label="Font Family" value={f.font_family ?? "Inter"} onChange={(v) => set("font_family", v)}
              options={["Inter", "Montserrat", "Playfair Display", "Poppins", "Lato"]} />
          </Section>

          <Section title="Contact">
            <Field label="Support Email" value={f.support_email ?? ""} onChange={(v) => set("support_email", v || null)} />
            <Field label="Address" value={f.address ?? ""} onChange={(v) => set("address", v || null)} />
            <Field label="Phone" value={f.phone ?? ""} onChange={(v) => set("phone", v || null)} />
          </Section>

          <Section title="Tracking">
            <Field label="GTM ID" value={f.gtm_id ?? ""} onChange={(v) => set("gtm_id", v || null)} placeholder="GTM-XXXXXX" />
            <Field label="Meta Pixel ID" value={f.meta_pixel_id ?? ""} onChange={(v) => set("meta_pixel_id", v || null)} placeholder="123456789" />
          </Section>

          <Section title="Homepage">
            <Field label="Hero Headline" value={f.hero_headline ?? ""} onChange={(v) => set("hero_headline", v || null)} />
            <Field label="Hero Subheadline" value={f.hero_subheadline ?? ""} onChange={(v) => set("hero_subheadline", v || null)} />
            <Field label="Hero Image URL" value={f.hero_image_url ?? ""} onChange={(v) => set("hero_image_url", v || null)} />
          </Section>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!f.active} onChange={(e) => set("active", e.target.checked)} />
            Active
          </label>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={save} disabled={saving} className="flex-1 bg-[#2563eb] text-white py-2 rounded-md text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
          {!isNew && (
            <button onClick={remove} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm">Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-md p-3 space-y-2">
      <h3 className="text-xs font-semibold text-[#1a1a2e] uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, disabled, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm disabled:bg-gray-50 disabled:text-gray-500"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
