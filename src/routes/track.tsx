import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/track")({
  component: TrackPage,
});

function TrackPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true); setResult(null); setNotFound(false);
    const { data } = await supabase.from("orders")
      .select("order_number,product_name,created_at,order_status,fulfillment_tracking")
      .eq("order_number", Number(input.trim()))
      .maybeSingle();
    setLoading(false);
    if (!data) setNotFound(true); else setResult(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
        <form onSubmit={submit} className="mt-5 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Enter your order number" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white" disabled={loading}>
            {loading ? "…" : "Track"}
          </button>
        </form>

        {result ? (
          <div className="mt-6 rounded-md border bg-gray-50 p-5 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Order</span><span className="font-semibold">#{result.order_number}</span></div>
            <div className="mt-2 flex justify-between"><span className="text-gray-600">Product</span><span>{result.product_name}</span></div>
            <div className="mt-2 flex justify-between"><span className="text-gray-600">Date</span><span>{new Date(result.created_at).toLocaleDateString()}</span></div>
            <div className="mt-2 flex justify-between"><span className="text-gray-600">Status</span>
              <span className="inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold uppercase text-blue-800">{result.order_status}</span>
            </div>
            {result.fulfillment_tracking ? (
              <p className="mt-4 text-sm">Your tracking number: <strong>{result.fulfillment_tracking}</strong></p>
            ) : null}
          </div>
        ) : null}

        {notFound ? <p className="mt-6 text-sm text-red-600">Order not found. Please check your number or contact support.</p> : null}
      </div>
    </div>
  );
}
