import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtCurrency } from "@/lib/admin-utils";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { COUNTRIES, SUPPORTED_COUNTRIES, type CountryCode } from "@/lib/countries";

type Product = Tables<"products">;

export const Route = createFileRoute("/admin/products")({
  component: Products,
});

const toSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const blank = (): TablesInsert<"products"> & { root_domain?: string } => ({
  subdomain: "",
  product_name: "",
  headline: "",
  subheadline: "",
  image_url: "",
  image_url_2: "",
  price_1: 0, label_1: "",
  price_2: 0, label_2: "",
  price_3: 0, label_3: "",
  price_4: 0, label_4: "",
  default_variant: 1,
  bump_enabled: false, bump_text: "", bump_price: 0,
  upsell_enabled: false, upsell_headline: "", upsell_price: 0,
  countdown_minutes: 15, stock_count: 100, active: true,
  why_choose_title: "", why_choose_items: [], reviews_title: "", reviews: [],
  colors: [],
  root_domain: "",
});

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Map<string, { count: number; rev: number }>>(new Map());
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const [{ data: p }, { data: o }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("product_id,total,payment_status"),
    ]);
    setProducts((p ?? []) as Product[]);
    const m = new Map<string, { count: number; rev: number }>();
    (o ?? []).forEach((r: any) => {
      if (!r.product_id) return;
      const v = m.get(r.product_id) ?? { count: 0, rev: 0 };
      v.count++;
      if (r.payment_status === "paid") v.rev += r.total ?? 0;
      m.set(r.product_id, v);
    });
    setStats(m);
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (p: Product) => {
    await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-[#1a1a2e]">Products</h2>
        <button onClick={() => setCreating(true)} className="bg-[#2563eb] text-white px-3 py-1.5 rounded-md text-sm">Add Product</button>
      </div>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-muted-foreground">
            <tr><th className="px-3 py-2">Subdomain</th><th>Product</th><th>Domain</th><th>Active</th><th>Orders</th><th>Revenue</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const s = stats.get(p.id) ?? { count: 0, rev: 0 };
              return (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{p.subdomain}</td>
                  <td>{p.product_name}</td>
                  <td className="text-xs text-muted-foreground">{(p as any).root_domain ?? <span className="italic">unassigned</span>}</td>
                  <td>
                    <button onClick={() => toggleActive(p)} className={`text-xs px-2 py-0.5 rounded ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {p.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>{s.count}</td>
                  <td>{fmtCurrency(s.rev)}</td>
                  <td><button onClick={() => setEditing(p)} className="text-[#2563eb] text-xs">Edit</button></td>
                </tr>
              );
            })}
            {!products.length && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <ProductForm
          initial={editing ?? blank()}
          isNew={creating}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function ProductForm({ initial, isNew, onClose, onSaved }: { initial: Product | TablesInsert<"products">; isNew: boolean; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>(initial);
  const [saving, setSaving] = useState(false);
  const [domains, setDomains] = useState<{ domain: string; company_name: string | null }[]>([]);
  // Track whether the user manually typed a subdomain so we stop auto-filling
  const [slugLocked, setSlugLocked] = useState(!isNew);

  useEffect(() => {
    supabase.from("domains" as any).select("domain,company_name").eq("active", true)
      .then(({ data }: { data: any }) => setDomains(data ?? []));
  }, []);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const handleNameChange = (v: string) => {
    set("product_name", v);
    if (!slugLocked) set("subdomain", toSlug(v));
  };

  const handleSlugChange = (v: string) => {
    setSlugLocked(true);
    set("subdomain", v);
  };

  const save = async () => {
    setSaving(true);
    if (isNew) {
      await supabase.from("products").insert(f);
    } else {
      await supabase.from("products").update(f).eq("id", f.id);
    }
    setSaving(false);
    onSaved();
  };
  const remove = async () => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", f.id);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-white h-full overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[#1a1a2e]">{isNew ? "Add Product" : "Edit Product"}</h2>
          <button onClick={onClose} className="text-2xl leading-none">×</button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Input label="Product Name" value={f.product_name} onChange={handleNameChange} />
          <label className="block">
            <span className="text-xs text-muted-foreground">
              Subdomain / URL Slug
              {!slugLocked && <span className="ml-1 text-blue-500">(auto)</span>}
            </span>
            <input
              value={f.subdomain ?? ""}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="e.g. oral-aura"
              className="mt-1 w-full border rounded-md px-2 py-1.5"
            />
          </label>

          {/* Domain assignment */}
          <label className="col-span-2 block">
            <span className="text-xs text-muted-foreground">Assign to Domain <span className="text-gray-400">(leave unassigned to show on all stores)</span></span>
            <select
              value={f.root_domain ?? ""}
              onChange={(e) => set("root_domain", e.target.value || null)}
              className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
            >
              <option value="">— Unassigned (shows on all stores) —</option>
              {domains.map((d) => (
                <option key={d.domain} value={d.domain}>
                  {d.domain}{d.company_name ? ` (${d.company_name})` : ""}
                </option>
              ))}
            </select>
          </label>

          {/* URL preview — only shown when both slug and domain are set */}
          {f.subdomain && f.root_domain && (
            <div className="col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2.5">
              <p className="text-xs font-semibold text-blue-800">Generated URLs for this product</p>

              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">Checkout page (production)</p>
                <p className="font-mono text-xs text-blue-900 break-all">{f.subdomain}.{f.root_domain}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">Checkout page (localhost preview)</p>
                <a
                  href={`/?subdomain=${f.subdomain}&domain=${f.root_domain}&country=uk`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-blue-700 underline break-all"
                >
                  /?subdomain={f.subdomain}&domain={f.root_domain}&country=uk
                </a>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">Product detail page (localhost preview)</p>
                <a
                  href={`/products/${f.subdomain}?domain=${f.root_domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-blue-700 underline break-all"
                >
                  /products/{f.subdomain}?domain={f.root_domain}
                </a>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">Main store (shows this product on homepage + shop)</p>
                <a
                  href={`/?domain=${f.root_domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-blue-700 underline break-all"
                >
                  /?domain={f.root_domain}
                </a>
              </div>
            </div>
          )}

          <Input label="Headline" value={f.headline ?? ""} onChange={(v) => set("headline", v)} full />
          <Input label="Subheadline" value={f.subheadline ?? ""} onChange={(v) => set("subheadline", v)} full />
          <div className="col-span-2">
            <ImageGallery
              images={normalizeImages(f)}
              checkoutImage={f.checkout_image_url ?? f.image_url ?? ""}
              onChange={(imgs, checkoutImg) => {
                setF((p: any) => ({
                  ...p,
                  images: imgs,
                  image_url: imgs[0] ?? "",
                  image_url_2: imgs[1] ?? "",
                  checkout_image_url: checkoutImg || imgs[0] || "",
                }));
              }}
            />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-span-2 grid grid-cols-2 gap-3">
              <Input label={`Label ${i}`} value={f[`label_${i}`] ?? ""} onChange={(v) => set(`label_${i}`, v)} />
              <Input label={`Price ${i}`} type="number" value={f[`price_${i}`] ?? 0} onChange={(v) => set(`price_${i}`, parseFloat(v) || 0)} />
            </div>
          ))}
          <Input label="Default Variant (1-3)" type="number" value={f.default_variant ?? 1} onChange={(v) => set("default_variant", parseInt(v) || 1)} />
          <Input label="Countdown Minutes" type="number" value={f.countdown_minutes ?? 15} onChange={(v) => set("countdown_minutes", parseInt(v) || 0)} />
          <Input label="Stock Count" type="number" value={f.stock_count ?? 0} onChange={(v) => set("stock_count", parseInt(v) || 0)} />
          <Toggle label="Active" value={!!f.active} onChange={(v) => set("active", v)} />
          <Toggle label="Bump Enabled" value={!!f.bump_enabled} onChange={(v) => set("bump_enabled", v)} />
          <Input label="Bump Text" value={f.bump_text ?? ""} onChange={(v) => set("bump_text", v)} />
          <Input label="Bump Price" type="number" value={f.bump_price ?? 0} onChange={(v) => set("bump_price", parseFloat(v) || 0)} />
          <Toggle label="Upsell Enabled" value={!!f.upsell_enabled} onChange={(v) => set("upsell_enabled", v)} />
          <Input label="Upsell Headline" value={f.upsell_headline ?? ""} onChange={(v) => set("upsell_headline", v)} />
          <Input label="Upsell Price" type="number" value={f.upsell_price ?? 0} onChange={(v) => set("upsell_price", parseFloat(v) || 0)} />

          <div className="col-span-2 mt-4 border-t pt-4">
            <h3 className="font-semibold text-[#1a1a2e] mb-2">Color Options</h3>
            <p className="text-xs text-muted-foreground mb-2">Leave empty if the product has no color variants. The "Choose Your Color" picker will only show when at least one color is added.</p>
            <JsonListEditor
              label="Colors"
              value={Array.isArray(f.colors) ? f.colors : []}
              onChange={(v) => set("colors", v)}
              fields={[
                { key: "name", label: "Color Name", placeholder: "Midnight Black" },
                { key: "hex", label: "Hex Code", placeholder: "#000000" },
              ]}
              empty={() => ({ name: "", hex: "#000000" })}
            />
          </div>

          <div className="col-span-2 mt-4 border-t pt-4">
            <h3 className="font-semibold text-[#1a1a2e] mb-2">Why Choose Section</h3>
            <Input label='Section Title (e.g. "Why Choose Voltix Energy Saver")' value={f.why_choose_title ?? ""} onChange={(v) => set("why_choose_title", v)} full />
            <JsonListEditor
              label="Why-Choose Items"
              value={Array.isArray(f.why_choose_items) ? f.why_choose_items : []}
              onChange={(v) => set("why_choose_items", v)}
              fields={[
                { key: "icon", label: "Icon (emoji)", placeholder: "👥" },
                { key: "title", label: "Title", placeholder: "Over 75,000+ Happy Customers" },
                { key: "body", label: "Body", placeholder: "Loved by tens of thousands…", textarea: true },
              ]}
              empty={() => ({ icon: "", title: "", body: "" })}
            />
          </div>

          <div className="col-span-2 mt-4 border-t pt-4">
            <h3 className="font-semibold text-[#1a1a2e] mb-2">Reviews Section</h3>
            <Input label='Section Title (e.g. "Over 3,000 5-Star Reviews")' value={f.reviews_title ?? ""} onChange={(v) => set("reviews_title", v)} full />
            <JsonListEditor
              label="Reviews"
              value={Array.isArray(f.reviews) ? f.reviews : []}
              onChange={(v) => set("reviews", v)}
              fields={[
                { key: "name", label: "Reviewer Name", placeholder: "James T." },
                { key: "title", label: "Review Title", placeholder: "Remarkable results" },
                { key: "text", label: "Review Body", placeholder: "I've been using…", textarea: true },
              ]}
              empty={() => ({ name: "", title: "", text: "" })}
            />

          {!isNew && f.subdomain ? (
            <div className="col-span-2 mt-4 border-t pt-4">
              <h3 className="font-semibold text-[#1a1a2e] mb-2">Country Pricing</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Override per-country prices. Leave fields blank to use the default product prices above. Disable + clear to remove.
              </p>
              <CountryPricingSection subdomain={f.subdomain} />
            </div>
          ) : null}
          {!isNew && f.subdomain ? (
            <div className="col-span-2 mt-4 border-t pt-4">
              <h3 className="font-semibold text-[#1a1a2e] mb-2">Country Performance</h3>
              <CountryPerformancePanel subdomain={f.subdomain} />
            </div>
          ) : null}
        </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={save} disabled={saving} className="bg-[#2563eb] text-white px-4 py-2 rounded-md text-sm font-medium flex-1 disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
          {!isNew && <button onClick={remove} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm">Delete</button>}
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", full }: { label: string; value: any; onChange: (v: string) => void; type?: string; full?: boolean }) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full border rounded-md px-2 py-1.5" />
    </label>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 mt-5">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}

type FieldDef = { key: string; label: string; placeholder?: string; textarea?: boolean };
function JsonListEditor({
  label, value, onChange, fields, empty,
}: {
  label: string;
  value: Array<Record<string, any>>;
  onChange: (v: Array<Record<string, any>>) => void;
  fields: FieldDef[];
  empty: () => Record<string, any>;
}) {
  const update = (i: number, key: string, val: string) => {
    const next = value.slice();
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, empty()]);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <button type="button" onClick={add} className="text-xs bg-[#2563eb] text-white px-2 py-1 rounded">+ Add</button>
      </div>
      <div className="space-y-3">
        {value.length === 0 && <p className="text-xs text-muted-foreground italic">No items — defaults will be shown on the checkout page.</p>}
        {value.map((item, i) => (
          <div key={i} className="border rounded-md p-3 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold">#{i + 1}</span>
              <button type="button" onClick={() => remove(i)} className="text-xs text-red-600">Remove</button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {fields.map((f) => (
                <label key={f.key} className="block">
                  <span className="text-[11px] text-muted-foreground">{f.label}</span>
                  {f.textarea ? (
                    <textarea
                      value={item[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => update(i, f.key, e.target.value)}
                      rows={2}
                      className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
                    />
                  ) : (
                    <input
                      value={item[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => update(i, f.key, e.target.value)}
                      className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeImages(f: any): string[] {
  const arr = Array.isArray(f.images) ? f.images.filter((x: any) => typeof x === "string" && x) : [];
  if (arr.length) return arr;
  const legacy = [f.image_url, f.image_url_2].filter((x: any) => typeof x === "string" && x);
  return legacy as string[];
}

function ImageGallery({
  images,
  checkoutImage,
  onChange,
}: {
  images: string[];
  checkoutImage: string;
  onChange: (images: string[], checkoutImage: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) {
        alert(`Upload failed: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    const next = [...images, ...uploaded];
    onChange(next, checkoutImage || next[0] || "");
    setUploading(false);
  };

  const addUrl = () => {
    if (!urlInput.trim()) return;
    const next = [...images, urlInput.trim()];
    onChange(next, checkoutImage || next[0] || "");
    setUrlInput("");
  };

  const remove = (i: number) => {
    const removed = images[i];
    const next = images.filter((_, idx) => idx !== i);
    const nextCheckout = checkoutImage === removed ? (next[0] ?? "") : checkoutImage;
    onChange(next, nextCheckout);
  };

  const pickCheckout = (url: string) => onChange(images, url);

  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold text-[#1a1a2e] mb-2">Product Images</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Upload one or more images. Click the ★ to choose which image appears on the checkout page's product card.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <label className="cursor-pointer bg-[#2563eb] text-white px-3 py-1.5 rounded-md text-xs font-medium">
          {uploading ? "Uploading…" : "Upload Images"}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            className="hidden"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
          />
        </label>
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="…or paste an image URL"
          className="flex-1 min-w-[160px] border rounded-md px-2 py-1.5 text-xs"
        />
        <button type="button" onClick={addUrl} className="bg-gray-700 text-white px-3 py-1.5 rounded-md text-xs">Add URL</button>
      </div>

      {images.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No images yet.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((url, i) => {
            const isCheckout = url === checkoutImage;
            return (
              <div key={`${url}-${i}`} className={`relative rounded-md border-2 overflow-hidden bg-gray-50 ${isCheckout ? "border-[#2563eb]" : "border-transparent"}`}>
                <img src={url} alt="" className="w-full h-24 object-cover" />
                <button
                  type="button"
                  onClick={() => pickCheckout(url)}
                  title={isCheckout ? "Shown on checkout card" : "Use on checkout card"}
                  className={`absolute top-1 left-1 h-6 w-6 rounded-full text-xs flex items-center justify-center ${isCheckout ? "bg-[#2563eb] text-white" : "bg-white/90 text-gray-700"}`}
                >★</button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  title="Remove"
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-600 text-white text-xs"
                >×</button>
                {isCheckout && (
                  <div className="absolute bottom-0 inset-x-0 bg-[#2563eb] text-white text-[10px] text-center py-0.5">Checkout card</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type PCSRow = {
  active: boolean;
  price_1: string;
  price_2: string;
  price_3: string;
  bump_price: string;
  upsell_price: string;
  exists: boolean;
};

function emptyRow(): PCSRow {
  return { active: false, price_1: "", price_2: "", price_3: "", bump_price: "", upsell_price: "", exists: false };
}

function CountryPricingSection({ subdomain }: { subdomain: string }) {
  const [rows, setRows] = useState<Record<CountryCode, PCSRow>>(() => {
    const r = {} as Record<CountryCode, PCSRow>;
    SUPPORTED_COUNTRIES.forEach((c) => { r[c] = emptyRow(); });
    return r;
  });
  const [openCode, setOpenCode] = useState<CountryCode | null>(null);
  const [saving, setSaving] = useState<CountryCode | null>(null);
  const [status, setStatus] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase.from("product_country_settings").select("*").eq("subdomain", subdomain);
    setRows((prev) => {
      const next = { ...prev };
      SUPPORTED_COUNTRIES.forEach((c) => { next[c] = emptyRow(); });
      (data ?? []).forEach((r: any) => {
        if (!SUPPORTED_COUNTRIES.includes(r.country_code)) return;
        next[r.country_code as CountryCode] = {
          active: !!r.active,
          price_1: r.price_1 != null ? String(r.price_1) : "",
          price_2: r.price_2 != null ? String(r.price_2) : "",
          price_3: r.price_3 != null ? String(r.price_3) : "",
          bump_price: r.bump_price != null ? String(r.bump_price) : "",
          upsell_price: r.upsell_price != null ? String(r.upsell_price) : "",
          exists: true,
        };
      });
      return next;
    });
  };

  useEffect(() => { load(); }, [subdomain]);

  const setField = (code: CountryCode, key: keyof PCSRow, value: any) => {
    setRows((p) => ({ ...p, [code]: { ...p[code], [key]: value } }));
  };

  const save = async (code: CountryCode) => {
    setSaving(code);
    const r = rows[code];
    const c = COUNTRIES[code];
    const allBlank = !r.price_1 && !r.price_2 && !r.price_3 && !r.bump_price && !r.upsell_price;
    if (!r.active && allBlank) {
      if (r.exists) {
        const { error } = await supabase.from("product_country_settings").delete()
          .eq("subdomain", subdomain).eq("country_code", code);
        setSaving(null);
        if (error) { setStatus((s) => ({ ...s, [code]: `Error: ${error.message}` })); return; }
        setStatus((s) => ({ ...s, [code]: "Removed" }));
        load();
      } else {
        setSaving(null);
        setStatus((s) => ({ ...s, [code]: "Nothing to save" }));
      }
      return;
    }
    const toNum = (v: string) => v.trim() === "" ? null : Number(v);
    const { error } = await supabase.from("product_country_settings").upsert({
      subdomain,
      country_code: code,
      country_name: c.name,
      currency: c.currency,
      currency_symbol: c.currency_symbol,
      price_1: toNum(r.price_1),
      price_2: toNum(r.price_2),
      price_3: toNum(r.price_3),
      bump_price: toNum(r.bump_price),
      upsell_price: toNum(r.upsell_price),
      active: r.active,
    }, { onConflict: "subdomain,country_code" });
    setSaving(null);
    if (error) { setStatus((s) => ({ ...s, [code]: `Error: ${error.message}` })); return; }
    setStatus((s) => ({ ...s, [code]: "Saved" }));
    load();
  };

  return (
    <div className="space-y-2">
      {SUPPORTED_COUNTRIES.map((code) => {
        const c = COUNTRIES[code];
        const r = rows[code];
        const open = openCode === code;
        return (
          <div key={code} className="border rounded-md bg-gray-50">
            <button
              type="button"
              onClick={() => setOpenCode(open ? null : code)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 font-medium">
                <span className="text-lg">{c.flag}</span>
                <span>{c.name}</span>
                {r.exists ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">{r.active ? "Active" : "Inactive"}</span> : null}
              </span>
              <span className="text-xs text-gray-500">{open ? "▲" : "▼"}</span>
            </button>
            {open ? (
              <div className="px-3 pb-3 space-y-2 border-t bg-white">
                <label className="flex items-center gap-2 text-sm mt-3">
                  <input type="checkbox" checked={r.active} onChange={(e) => setField(code, "active", e.target.checked)} />
                  Active
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <PriceInput label={`Price 1 (${c.currency_symbol})`} value={r.price_1} onChange={(v) => setField(code, "price_1", v)} />
                  <PriceInput label={`Price 2 (${c.currency_symbol})`} value={r.price_2} onChange={(v) => setField(code, "price_2", v)} />
                  <PriceInput label={`Price 3 (${c.currency_symbol})`} value={r.price_3} onChange={(v) => setField(code, "price_3", v)} />
                  <PriceInput label={`Bump Price (${c.currency_symbol})`} value={r.bump_price} onChange={(v) => setField(code, "bump_price", v)} />
                  <PriceInput label={`Upsell Price (${c.currency_symbol})`} value={r.upsell_price} onChange={(v) => setField(code, "upsell_price", v)} />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button type="button" onClick={() => save(code)} disabled={saving === code}
                    className="bg-[#2563eb] text-white px-3 py-1.5 rounded text-xs disabled:opacity-50">
                    {saving === code ? "Saving…" : "Save"}
                  </button>
                  {status[code] ? <span className="text-xs text-gray-600">{status[code]}</span> : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function CountryPerformancePanel({ subdomain }: { subdomain: string }) {
  const [rows, setRows] = useState<Array<{ code: CountryCode; flag: string; name: string; orders: number; rev: number; paid: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("orders")
      .select("country_code,total,payment_status,source_domain")
      .ilike("source_domain", `%${subdomain}%`)
      .then(({ data }) => {
        const m = new Map<string, { orders: number; rev: number; paid: number }>();
        (data ?? []).forEach((o: any) => {
          const k = (o.country_code ?? "").toLowerCase();
          if (!SUPPORTED_COUNTRIES.includes(k as CountryCode)) return;
          const v = m.get(k) ?? { orders: 0, rev: 0, paid: 0 };
          v.orders++;
          if (o.payment_status === "paid") { v.paid++; v.rev += o.total ?? 0; }
          m.set(k, v);
        });
        const result = SUPPORTED_COUNTRIES
          .map((code) => {
            const e = m.get(code);
            if (!e) return null;
            return { code, ...COUNTRIES[code], ...e };
          })
          .filter(Boolean) as Array<{ code: CountryCode; flag: string; name: string; orders: number; rev: number; paid: number }>;
        setRows(result);
        setLoading(false);
      });
  }, [subdomain]);

  if (loading) return <p className="text-xs text-muted-foreground">Loading…</p>;
  if (!rows.length) return <p className="text-xs text-muted-foreground italic">No orders yet for this product.</p>;

  return (
    <div className="overflow-hidden rounded-md border text-sm">
      <table className="w-full">
        <thead className="bg-gray-50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Country</th>
            <th>Orders</th>
            <th>Revenue</th>
            <th>Paid</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.code} className="border-t">
              <td className="px-3 py-2">{r.flag} {r.name}</td>
              <td>{r.orders}</td>
              <td>{fmtCurrency(r.rev)}</td>
              <td>{r.paid}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PriceInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Leave blank to use default product price"
        className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
      />
    </label>
  );
}
