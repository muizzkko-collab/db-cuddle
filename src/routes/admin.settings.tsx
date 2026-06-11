import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Settings = Tables<"site_settings">;

export const Route = createFileRoute("/admin/settings")({
  validateSearch: (s: Record<string, unknown>) => ({
    subdomain: typeof s.subdomain === "string" ? s.subdomain : undefined,
  }),
  component: SettingsPage,
});

const FONTS = ["Inter", "Playfair Display", "Montserrat", "Poppins", "Lato"];
const BUTTON_STYLES = ["rounded", "square", "pill"];
const TEMPLATES = [
  { id: 1, label: "Standard (image left, form right)" },
  { id: 2, label: "Hero (full-width image top)" },
  { id: 3, label: "Minimal (centred, clean)" },
  { id: 4, label: "Water Flosser (premium conversion)" },
];

function SettingsPage() {
  const search = useSearch({ from: "/admin/settings" });
  const [subs, setSubs] = useState<string[]>([]);
  const [sub, setSub] = useState<string>(search.subdomain ?? "");
  const [f, setF] = useState<Partial<Settings>>({});
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("products").select("subdomain").then(({ data }) => {
      const list = [...new Set((data ?? []).map((p: any) => p.subdomain).filter(Boolean))] as string[];
      setSubs(list);
      if (!sub && list.length) setSub(list[0]);
    });
  }, []);

  useEffect(() => {
    if (!sub) return;
    supabase.from("site_settings").select("*").eq("subdomain", sub).maybeSingle().then(({ data }) => {
      setF(data ?? { subdomain: sub });
    });
  }, [sub]);

  // Load preview font dynamically
  useEffect(() => {
    const font = f.font_family;
    if (!font) return;
    const id = `gfont-${font.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700&display=swap`;
    document.head.appendChild(link);
  }, [f.font_family]);

  const set = (k: keyof Settings, v: any) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    const payload = { ...f, subdomain: sub } as any;
    const { error } = await supabase.from("site_settings").upsert(payload, { onConflict: "subdomain" });
    setMsg(error ? `Error: ${error.message}` : "Saved");
    setTimeout(() => setMsg(null), 2500);
  };

  const brand = f.brand_color ?? "#2563eb";
  const btnText = f.button_text_color ?? "#ffffff";
  const bg = f.background_color ?? "#ffffff";
  const headline = f.headline_color ?? "#111827";
  const text = f.text_color ?? "#374151";
  const font = f.font_family ?? "Inter";
  const btnRadius = f.button_style === "pill" ? "9999px" : f.button_style === "square" ? "0px" : "8px";

  return (
    <div className="space-y-4 max-w-6xl">
      <h2 className="font-semibold text-[#1a1a2e]">Site Settings</h2>
      <label className="block max-w-md">
        <span className="text-xs text-muted-foreground">Subdomain</span>
        <select value={sub} onChange={(e) => setSub(e.target.value)} className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm">
          <option value="">Select…</option>
          {subs.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      {sub && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border rounded-lg p-4 space-y-4 text-sm">
            <section className="space-y-3">
              <h3 className="font-medium text-[#1a1a2e]">Design</h3>
              <div>
                <span className="text-xs text-muted-foreground">Template</span>
                <select
                  value={f.template_id ?? 1}
                  onChange={(e) => set("template_id", Number(e.target.value))}
                  className="mt-1 w-full border rounded-md px-2 py-1.5"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.id} — {t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["brand_color", "Brand Color", "#2563eb"],
                  ["button_text_color", "Button Text Color", "#ffffff"],
                  ["background_color", "Background Color", "#ffffff"],
                  ["headline_color", "Headline Color", "#111827"],
                  ["text_color", "Text Color", "#374151"],
                ].map(([k, label, def]) => (
                  <label key={k} className="block">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <input
                      type="color"
                      value={(f as any)[k] ?? def}
                      onChange={(e) => set(k as keyof Settings, e.target.value)}
                      className="mt-1 w-full h-10 border rounded-md"
                    />
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Button Style</span>
                  <select
                    value={f.button_style ?? "rounded"}
                    onChange={(e) => set("button_style", e.target.value)}
                    className="mt-1 w-full border rounded-md px-2 py-1.5"
                  >
                    {BUTTON_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Font Family</span>
                  <select
                    value={f.font_family ?? "Inter"}
                    onChange={(e) => set("font_family", e.target.value)}
                    className="mt-1 w-full border rounded-md px-2 py-1.5"
                  >
                    {FONTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>

              <div>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Custom CSS</span>
                  <textarea
                    rows={5}
                    value={f.custom_css ?? ""}
                    onChange={(e) => set("custom_css", e.target.value)}
                    className="mt-1 w-full border rounded-md px-2 py-1.5 font-mono text-xs"
                    placeholder=".checkout-page { ... }"
                  />
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Write any CSS here to override styles for this subdomain only
                </p>
              </div>
            </section>

            <section className="space-y-3 border-t pt-4">
              <h3 className="font-medium text-[#1a1a2e]">Branding & Tracking</h3>

              <ImageUploadField
                label="Logo"
                value={f.logo_url ?? ""}
                onChange={(v) => set("logo_url", v)}
                sub={sub}
                kind="logo"
              />
              <ImageUploadField
                label="Favicon"
                value={f.favicon_url ?? ""}
                onChange={(v) => set("favicon_url", v)}
                sub={sub}
                kind="favicon"
                accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
              />

              {[
                ["gtm_id", "GTM ID"],
                ["meta_pixel_id", "Meta Pixel ID"],
                ["ga4_id", "GA4 ID"],
                ["tiktok_pixel_id", "TikTok Pixel ID"],
                ["thank_you_redirect_url", "Thank You Redirect URL"],
                ["support_email", "Support Email"],
              ].map(([k, label]) => (
                <label key={k} className="block">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <input
                    value={(f as any)[k] ?? ""}
                    onChange={(e) => set(k as keyof Settings, e.target.value)}

                    className="mt-1 w-full border rounded-md px-2 py-1.5"
                  />
                </label>
              ))}
            </section>

            <button
              onClick={save}
              className="w-full bg-[#2563eb] text-white py-2 rounded-md text-sm font-medium"
            >
              Save Settings
            </button>
            {msg && <p className="text-center text-sm" style={{ color: msg.startsWith("Error") ? "#dc2626" : "#16a34a" }}>{msg}</p>}
          </div>

          {/* Live preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-3">
              <h3 className="font-medium text-[#1a1a2e] text-sm">Live Preview</h3>
              <div
                className="border rounded-lg p-5 space-y-4"
                style={{ backgroundColor: bg, color: text, fontFamily: `'${font}', sans-serif` }}
              >
                <h4 style={{ color: headline, fontFamily: `'${font}', sans-serif`, fontWeight: 700, fontSize: 22, margin: 0 }}>
                  Sample Headline
                </h4>
                <p style={{ margin: 0, fontSize: 14 }}>
                  This is sample body text rendered with your selected font, text color, and background color.
                </p>
                <button
                  style={{
                    backgroundColor: brand,
                    color: btnText,
                    borderRadius: btnRadius,
                    padding: "10px 20px",
                    border: "none",
                    fontWeight: 600,
                    fontFamily: `'${font}', sans-serif`,
                    cursor: "pointer",
                  }}
                >
                  Buy Now
                </button>
              </div>
              <div className="text-xs text-muted-foreground">
                Template: {f.template_id ?? 1} · Font: {font} · Button: {f.button_style ?? "rounded"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
  sub,
  kind,
  accept = "image/*",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  sub: string;
  kind: "logo" | "favicon";
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upload = async (file: File) => {
    setErr(null);
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    // Flat path matches the policy on the product-images bucket
    const path = `${kind}-${sub}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) {
      setErr(`Upload failed: ${error.message}`);
    } else {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt={label}
            className="h-12 w-12 object-contain border rounded bg-white"
          />
        ) : (
          <div className="h-12 w-12 border rounded bg-gray-50 flex items-center justify-center text-[10px] text-muted-foreground">
            none
          </div>
        )}
        <label className="cursor-pointer text-xs bg-gray-100 hover:bg-gray-200 border rounded-md px-3 py-1.5">
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        )}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste a URL"
        className="w-full border rounded-md px-2 py-1.5 text-xs"
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}

