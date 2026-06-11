import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/upsell")({
  component: UpsellPage,
});

function UpsellPage() {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("order_id");
    if (!orderId) { setLoading(false); return; }
    (async () => {
      const { data: o } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (!o) { setLoading(false); return; }
      setOrder(o);
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("products").select("*").eq("id", o.product_id ?? "").maybeSingle(),
        supabase.from("site_settings").select("brand_color,button_text_color").eq("subdomain", (o.source_domain ?? "").split(".")[0] ?? "").maybeSingle(),
      ]);
      setProduct(p); setSettings(s);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  if (!order || !product) return <div className="flex min-h-screen items-center justify-center">Order not found.</div>;

  const brand = settings?.brand_color || "#2563eb";
  const btnText = settings?.button_text_color || "#ffffff";
  const sym = order.currency === "USD" || order.currency === "CAD" || order.currency === "AUD" ? "$" : order.currency === "EUR" ? "€" : "£";

  const accept = async () => {
    setProcessing(true);
    const upsellPrice = Number(product.upsell_price || 0);
    await supabase.from("orders").update({
      upsell_accepted: true,
      total: Number(order.total) + upsellPrice,
    }).eq("id", order.id);
    window.location.href = `/thank-you?order=${order.order_number}`;
  };
  const decline = () => {
    window.location.href = `/thank-you?order=${order.order_number}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-xl rounded-lg border bg-white p-8 text-center shadow-sm">
        <p className="text-sm uppercase tracking-wide text-gray-500">Wait! Special one-time offer for</p>
        <h1 className="mt-1 text-2xl font-bold">{order.customer_name}</h1>
        <h2 className="mt-6 text-xl font-semibold text-gray-900">{product.upsell_headline || "Add this exclusive bonus to your order"}</h2>
        <button
          disabled={processing}
          onClick={accept}
          className="mt-8 w-full rounded-md px-6 py-4 text-lg font-bold disabled:opacity-60"
          style={{ backgroundColor: brand, color: btnText }}
        >
          {processing ? "Adding…" : `Yes, add to my order — ${sym}${Number(product.upsell_price || 0).toFixed(2)}`}
        </button>
        <button onClick={decline} className="mt-4 text-sm text-gray-500 underline">No thanks, complete my order</button>
      </div>
    </div>
  );
}
