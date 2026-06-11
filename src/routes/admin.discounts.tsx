import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Code = Tables<"discount_codes">;

export const Route = createFileRoute("/admin/discounts")({
  component: Discounts,
});

function Discounts() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ code: "", discount_type: "percent", discount_value: 10, max_uses: 0, expires_at: "" });

  const load = async () => {
    const { data } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
    setCodes((data ?? []) as Code[]);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (c: Code) => {
    await supabase.from("discount_codes").update({ active: !c.active }).eq("id", c.id);
    load();
  };

  const add = async () => {
    await supabase.from("discount_codes").insert({
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      max_uses: form.max_uses || null,
      expires_at: form.expires_at || null,
      active: true,
    });
    setAdding(false);
    setForm({ code: "", discount_type: "percent", discount_value: 10, max_uses: 0, expires_at: "" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-[#1a1a2e]">Discount Codes</h2>
        <button onClick={() => setAdding(true)} className="bg-[#2563eb] text-white px-3 py-1.5 rounded-md text-sm">Add Code</button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-muted-foreground">
            <tr><th className="px-3 py-2">Code</th><th>Type</th><th>Value</th><th>Uses</th><th>Max</th><th>Expires</th><th>Active</th></tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono">{c.code}</td>
                <td>{c.discount_type}</td>
                <td>{c.discount_type === "percent" ? `${c.discount_value}%` : `£${c.discount_value}`}</td>
                <td>{c.uses_count ?? 0}</td>
                <td>{c.max_uses ?? "∞"}</td>
                <td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                <td>
                  <button onClick={() => toggle(c)} className={`text-xs px-2 py-0.5 rounded ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {c.active ? "Active" : "Inactive"}
                  </button>
                </td>
              </tr>
            ))}
            {!codes.length && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No codes yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setAdding(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="font-bold text-[#1a1a2e] mb-4">Add Discount Code</h3>
            <div className="space-y-3 text-sm">
              <label className="block"><span className="text-xs text-muted-foreground">Code</span>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="mt-1 w-full border rounded-md px-2 py-1.5" />
              </label>
              <label className="block"><span className="text-xs text-muted-foreground">Type</span>
                <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="mt-1 w-full border rounded-md px-2 py-1.5">
                  <option value="percent">Percent</option><option value="fixed">Fixed</option>
                </select>
              </label>
              <label className="block"><span className="text-xs text-muted-foreground">Value</span>
                <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} className="mt-1 w-full border rounded-md px-2 py-1.5" />
              </label>
              <label className="block"><span className="text-xs text-muted-foreground">Max Uses (0 = unlimited)</span>
                <input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || 0 })} className="mt-1 w-full border rounded-md px-2 py-1.5" />
              </label>
              <label className="block"><span className="text-xs text-muted-foreground">Expires</span>
                <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="mt-1 w-full border rounded-md px-2 py-1.5" />
              </label>
            </div>
            <button onClick={add} className="mt-4 w-full bg-[#2563eb] text-white py-2 rounded-md text-sm font-medium">Create</button>
          </div>
        </div>
      )}
    </div>
  );
}
