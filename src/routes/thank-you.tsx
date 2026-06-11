import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { COUNTRIES, SUPPORTED_COUNTRIES, getCountry, type CountryCode, isCountryCode } from "@/lib/countries";

type Order = Tables<"orders">;
type OrderItem = Tables<"order_items">;

export const Route = createFileRoute("/thank-you")({
  component: ThankYouPage,
});

function ThankYouPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [orderNumber, setOrderNumber] = useState<string>("");

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("order");
    if (!n) return;
    setOrderNumber(n);
    (async () => {
      const { data: o } = await supabase.from("orders").select("*").eq("order_number", Number(n)).maybeSingle();
      if (!o) return;
      setOrder(o as Order);
      const { data: its } = await supabase.from("order_items").select("*").eq("order_id", (o as Order).id);
      const itemList = (its ?? []) as OrderItem[];
      setItems(itemList);

      // GTM purchase event
      const w: any = window;
      w.dataLayer = w.dataLayer || [];
      const cc = (o as any).country_code;
      const gtmItems = itemList.length > 0
        ? itemList.map((i) => ({
            item_name: i.product_name,
            item_id: undefined as string | undefined,
            price: Number(i.unit_price ?? 0),
            quantity: Number(i.quantity ?? 1),
          }))
        : [{ item_name: o.product_name, item_id: undefined as string | undefined, price: Number(o.total ?? 0), quantity: Number(o.quantity ?? 1) }];
      w.dataLayer.push({
        event: "purchase",
        transaction_id: o.order_number,
        value: Number(o.total ?? 0),
        currency: o.currency ?? undefined,
        country_code: cc ?? undefined,
        items: gtmItems,
      });
    })();
  }, []);

  const isStore = order?.source_domain === "checkouthubs.com" || order?.source_domain?.startsWith("checkouthubs.com/");
  const cc = (order as any)?.country_code;
  const symbol = isCountryCode(cc) ? getCountry(cc as CountryCode).currency_symbol
    : order?.currency === "USD" ? "$"
    : order?.currency === "EUR" ? "€"
    : order?.currency === "CAD" ? "CA$"
    : order?.currency === "AUD" ? "AU$"
    : "£";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-xl rounded-lg border bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">✓</div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Order Confirmed!</h1>
          <p className="mt-3 text-gray-700">Your order #{orderNumber} has been received</p>
          {order?.email && <p className="mt-1 text-sm text-gray-600">We'll send a confirmation to {order.email} shortly</p>}
        </div>

        {isStore && items.length > 0 ? (
          <div className="mt-6 rounded-md border bg-gray-50 p-4">
            <h2 className="text-sm font-semibold text-gray-900">Items</h2>
            <ul className="mt-2 divide-y text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between py-2">
                  <span className="text-gray-800">{i.product_name} <span className="text-gray-500">— {i.variant_label} × {i.quantity}</span></span>
                  <span className="font-semibold">{symbol}{Number(i.total_price).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t pt-3 text-base font-bold">
              <span>Total</span><span>{symbol}{Number(order?.total ?? 0).toFixed(2)}</span>
            </div>
          </div>
        ) : order ? (
          <div className="mt-6 rounded-md border bg-gray-50 p-4 text-sm">
            <div className="flex justify-between"><span>{order.product_name}</span><span>{order.variant_label}</span></div>
            <div className="mt-2 flex justify-between font-semibold"><span>Total</span><span>{symbol}{Number(order.total ?? 0).toFixed(2)}</span></div>
          </div>
        ) : null}

        <p className="mt-6 text-center text-sm text-gray-700"><strong>Expected delivery:</strong> 5-8 business days</p>
        <div className="mt-4 text-center">
          <a href="/track" className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white">Track your order</a>
        </div>
      </div>
    </div>
  );
}

// keep SUPPORTED_COUNTRIES referenced to satisfy unused-import strictness if needed
void SUPPORTED_COUNTRIES;
void COUNTRIES;
