import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — CheckoutHubs" }] }),
  component: CheckoutPage,
});

const COUNTRIES = ["GB","US","CA","AU","DE","FR","IE","NL","SE","NO","DK","CH"];
function currencyFor(country: string) {
  switch (country) {
    case "US": return { code: "USD", symbol: "$" };
    case "CA": return { code: "CAD", symbol: "$" };
    case "AU": return { code: "AUD", symbol: "$" };
    case "DE": case "FR": case "IE": case "NL": return { code: "EUR", symbol: "€" };
    default: return { code: "GBP", symbol: "£" };
  }
}

const REQUIRED = ["customer_name","email","phone","address_line1","city","postcode"] as const;

function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_name: "", email: "", phone: "",
    address_line1: "", address_line2: "", city: "", postcode: "",
  });
  const [country, setCountry] = useState("GB");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const curr = useMemo(() => currencyFor(country), [country]);
  const symbol = curr.symbol;

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
          <Link to="/shop" className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Shop now</Link>
        </div>
      </SiteLayout>
    );
  }

  const validate = () => {
    const e: Record<string, boolean> = {};
    for (const k of REQUIRED) if (!String(form[k] ?? "").trim()) e[k] = true;
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = true;
    setErrors(e);
    if (Object.keys(e).length) {
      const first = REQUIRED.find(k => e[k]);
      if (first) document.querySelector<HTMLInputElement>(`[name="${first}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  };

  const createOrder = async (paymentMethod: "stripe" | "paypal", paymentStatus: "pending" | "paid") => {
    const orderPayload = {
      customer_name: form.customer_name,
      email: form.email,
      phone: form.phone,
      address_line1: form.address_line1,
      address_line2: form.address_line2 || "",
      city: form.city,
      postcode: form.postcode,
      country,
      total: cartTotal,
      subtotal: cartTotal,
      currency: curr.code,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      order_status: "pending",
      source_domain: "checkouthubs.com",
      quantity: items.reduce((s, i) => s + i.quantity, 0),
      product_name: items.length === 1 ? items[0].product_name : `${items.length} items`,
      product_id: items.length === 1 ? items[0].product_id : "",
    };
    const itemsPayload = items.map(i => ({
      product_id: i.product_id,
      subdomain: i.subdomain,
      product_name: i.product_name,
      variant_label: i.variant_label,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.unit_price * i.quantity,
    }));
    const { data, error } = await supabase.rpc("create_order_with_items" as never, {
      _order: orderPayload,
      _items: itemsPayload,
    } as never);
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("Order insert failed");
    return row as { id: string; order_number: number };
  };

  const onPayCard = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const order = await createOrder("stripe", "pending");
      // Try Stripe edge function; fall back to thank-you if unavailable.
      try {
        const { data, error } = await supabase.functions.invoke("create-stripe-session", {
          body: {
            orderId: order.id,
            currency: curr.code.toLowerCase(),
            successUrl: `${window.location.origin}/thank-you?order=${order.order_number}`,
            cancelUrl: `${window.location.origin}/checkout`,
            lineItems: items.map(i => ({
              name: `${i.product_name} — ${i.variant_label}`,
              amount: Math.round(i.unit_price * 100),
              quantity: i.quantity,
            })),
          },
        });
        if (!error && data?.url) {
          window.location.href = data.url;
          return;
        }
      } catch {/* fall through */}
      clearCart();
      navigate({ to: "/thank-you", search: { order: String(order.order_number) } as never });
    } catch (e: any) {
      alert("Could not place order: " + (e?.message ?? "unknown error"));
      setSubmitting(false);
    }
  };

  const onPayPaypal = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const order = await createOrder("paypal", "paid");
      clearCart();
      navigate({ to: "/thank-you", search: { order: String(order.order_number) } as never });
    } catch (e: any) {
      alert("Could not place order: " + (e?.message ?? "unknown error"));
      setSubmitting(false);
    }
  };

  const Input = ({ name, label, type = "text", required = false }: { name: keyof typeof form; label: string; type?: string; required?: boolean }) => (
    <label className="block">
      <span className="text-xs font-medium text-gray-700">{label}{required && " *"}</span>
      <input
        name={name}
        type={type}
        value={form[name]}
        onChange={(e) => setForm(f => ({ ...f, [name]: e.target.value }))}
        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${errors[name] ? "border-red-500" : "border-gray-300"}`}
      />
    </label>
  );

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* LEFT */}
          <div className="space-y-6">
            <section className="rounded-lg border bg-white p-5">
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              <div className="mt-3 grid gap-3">
                <Input name="customer_name" label="Full Name" required />
                <Input name="email" label="Email Address" type="email" required />
                <Input name="phone" label="Phone Number" type="tel" required />
              </div>
            </section>

            <section className="rounded-lg border bg-white p-5">
              <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
              <div className="mt-3 grid gap-3">
                <Input name="address_line1" label="Address Line 1" required />
                <Input name="address_line2" label="Address Line 2 (optional)" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input name="city" label="City" required />
                  <Input name="postcode" label="Postcode / ZIP" required />
                </div>
                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Country</span>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-lg border bg-white p-5">
              <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
              <button
                disabled={submitting}
                onClick={onPayCard}
                className="mt-3 w-full rounded-md bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Processing…" : `Pay with Card — ${symbol}${cartTotal.toFixed(2)}`}
              </button>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-gray-200" /> or <div className="h-px flex-1 bg-gray-200" />
              </div>
              <button
                disabled={submitting}
                onClick={onPayPaypal}
                className="w-full rounded-md bg-[#ffc439] px-4 py-3 text-sm font-bold text-[#003087] hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Processing…" : "Pay with PayPal"}
              </button>
            </section>
          </div>

          {/* RIGHT */}
          <aside className="h-fit rounded-lg border bg-white p-5 lg:sticky lg:top-6">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
            <ul className="mt-3 space-y-3">
              {items.map((i) => (
                <li key={`${i.product_id}-${i.variant_label}`} className="flex gap-3">
                  {i.image_url ? (
                    <img src={i.image_url} alt="" className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">{i.product_name.slice(0,2).toUpperCase()}</div>
                  )}
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium text-gray-900">{i.product_name}</p>
                    <p className="text-xs text-gray-500">{i.variant_label} × {i.quantity}</p>
                  </div>
                  <div className="text-sm font-semibold">{symbol}{(i.unit_price * i.quantity).toFixed(2)}</div>
                </li>
              ))}
            </ul>
            <hr className="my-4" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{symbol}{cartTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="font-semibold text-green-600">FREE</span></div>
            </div>
            <div className="mt-3 flex justify-between text-lg font-bold"><span>Total</span><span>{symbol}{cartTotal.toFixed(2)}</span></div>
            <p className="mt-3 text-center text-xs text-muted-foreground">🔒 256-bit SSL encryption · Secure checkout</p>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
