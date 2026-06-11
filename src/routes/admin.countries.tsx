import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, SUPPORTED_COUNTRIES, type CountryCode } from "@/lib/countries";

type Row = {
  country_code: string;
  country_name: string;
  currency: string;
  currency_symbol: string;
  meta_pixel_id: string | null;
  gtm_id: string | null;
  tiktok_pixel_id: string | null;
  ga4_id: string | null;
  active: boolean | null;
};

export const Route = createFileRoute("/admin/countries")({
  component: AdminCountries,
});

function AdminCountries() {
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("country_settings").select("*");
    const map: Record<string, Row> = {};
    SUPPORTED_COUNTRIES.forEach((code) => {
      const existing = (data ?? []).find((r: any) => r.country_code === code);
      const c = COUNTRIES[code];
      map[code] = existing
        ? (existing as Row)
        : {
            country_code: code,
            country_name: c.name,
            currency: c.currency,
            currency_symbol: c.currency_symbol,
            meta_pixel_id: null,
            gtm_id: null,
            tiktok_pixel_id: null,
            ga4_id: null,
            active: true,
          };
    });
    setRows(map);
  };

  useEffect(() => { load(); }, []);

  const set = (code: string, key: keyof Row, value: any) => {
    setRows((p) => ({ ...p, [code]: { ...p[code], [key]: value } }));
  };

  const save = async (code: string) => {
    setSaving(code);
    const r = rows[code];
    const { error } = await supabase.from("country_settings").upsert({
      country_code: r.country_code,
      country_name: r.country_name,
      currency: r.currency,
      currency_symbol: r.currency_symbol,
      meta_pixel_id: r.meta_pixel_id,
      gtm_id: r.gtm_id,
      tiktok_pixel_id: r.tiktok_pixel_id,
      ga4_id: r.ga4_id,
      active: r.active,
    }, { onConflict: "country_code" });
    setSaving(null);
    if (error) alert(`Save failed: ${error.message}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-[#1a1a2e]">Countries</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Per-country tracking IDs. Note: the GTM container actually loaded on checkout pages is the one set on each product's Site Settings — these fields are for reference and other admin uses.
        </p>
      </div>
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Flag</th>
              <th>Country</th>
              <th>Currency</th>
              <th>Meta Pixel</th>
              <th>GTM</th>
              <th>TikTok Pixel</th>
              <th>GA4</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {SUPPORTED_COUNTRIES.map((code) => {
              const c = COUNTRIES[code];
              const r = rows[code];
              if (!r) return null;
              return (
                <tr key={code} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-xl">{c.flag}</td>
                  <td className="font-medium">{c.name}</td>
                  <td className="text-xs">{c.currency} ({c.currency_symbol})</td>
                  <td><input className="border rounded px-2 py-1 text-xs w-40" value={r.meta_pixel_id ?? ""} onChange={(e) => set(code, "meta_pixel_id", e.target.value || null)} placeholder="e.g. 123456789" /></td>
                  <td><input className="border rounded px-2 py-1 text-xs w-40" value={r.gtm_id ?? ""} onChange={(e) => set(code, "gtm_id", e.target.value || null)} placeholder="GTM-XXXXXX" /></td>
                  <td><input className="border rounded px-2 py-1 text-xs w-40" value={r.tiktok_pixel_id ?? ""} onChange={(e) => set(code, "tiktok_pixel_id", e.target.value || null)} placeholder="CXXXXXXXXX" /></td>
                  <td><input className="border rounded px-2 py-1 text-xs w-40" value={r.ga4_id ?? ""} onChange={(e) => set(code, "ga4_id", e.target.value || null)} placeholder="G-XXXXXX" /></td>
                  <td>
                    <button
                      onClick={() => save(code)}
                      disabled={saving === code}
                      className="bg-[#2563eb] text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                    >{saving === code ? "Saving…" : "Save"}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
