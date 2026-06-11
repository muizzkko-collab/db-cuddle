import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtCurrency } from "@/lib/admin-utils";
import { COUNTRIES, SUPPORTED_COUNTRIES, type CountryCode } from "@/lib/countries";

export const Route = createFileRoute("/admin/subdomains")({
  component: Subdomains,
});

function Subdomains() {
  const router = useRouter();
  type SubRow = { domain: string; count: number; rev: number; paid: number; byCountry: Record<string, { rev: number; symbol: string }> };
  const [rows, setRows] = useState<SubRow[]>([]);

  useEffect(() => {
    supabase.from("orders").select("source_domain,total,payment_status,country_code,currency").then(({ data }) => {
      const m = new Map<string, SubRow>();
      (data ?? []).forEach((o: any) => {
        const k = o.source_domain ?? "(none)";
        const v = m.get(k) ?? { domain: k, count: 0, rev: 0, paid: 0, byCountry: {} };
        v.count++;
        if (o.payment_status === "paid") {
          v.paid++;
          v.rev += o.total ?? 0;
          const cc = (o.country_code ?? "").toLowerCase() as CountryCode;
          if (SUPPORTED_COUNTRIES.includes(cc)) {
            const prev = v.byCountry[cc] ?? { rev: 0, symbol: COUNTRIES[cc].currency_symbol };
            prev.rev += o.total ?? 0;
            v.byCountry[cc] = prev;
          }
        }
        m.set(k, v);
      });
      setRows([...m.values()].sort((a, b) => b.rev - a.rev));
    });
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-[#1a1a2e]">Subdomains</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => {
          const conv = r.count ? ((r.paid / r.count) * 100).toFixed(1) : "0";
          return (
            <div key={r.domain} className="bg-white border rounded-lg p-4">
              <h3 className="font-bold text-[#1a1a2e]">{r.domain}</h3>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span>{fmtCurrency(r.rev)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Orders</span><span>{r.count}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Conversion</span><span>{conv}%</span></div>
              </div>
              {Object.keys(r.byCountry).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {SUPPORTED_COUNTRIES.filter((code) => r.byCountry[code]?.rev > 0).map((code) => {
                    const c = COUNTRIES[code];
                    const bc = r.byCountry[code];
                    return (
                      <span key={code} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {c.flag} {bc.symbol}{bc.rev.toFixed(0)}
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => router.navigate({ to: "/admin/orders", search: { domain: r.domain } })}
                  className="flex-1 text-xs border rounded-md py-1.5 hover:bg-gray-50"
                >View Orders</button>
                <button
                  onClick={() => router.navigate({ to: "/admin/settings", search: { subdomain: r.domain.split(".")[0] } })}
                  className="flex-1 text-xs bg-[#2563eb] text-white rounded-md py-1.5"
                >Edit Settings</button>
              </div>
            </div>
          );
        })}
        {!rows.length && <p className="text-sm text-muted-foreground">No subdomains with orders yet.</p>}
      </div>
    </div>
  );
}
