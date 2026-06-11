import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/contexts/CartContext";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Shopping Cart — CheckoutHubs" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, cartTotal, cartCount, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
          <Link to="/shop" className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Start shopping
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground">Shopping Cart ({cartCount} items)</h1>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
          <section>
            <ul className="divide-y rounded-lg border bg-white">
              {items.map((item) => (
                <li key={`${item.product_id}-${item.variant_label}`} className="flex gap-4 p-4">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.product_name} className="h-20 w-20 flex-shrink-0 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md bg-gray-200 text-sm text-gray-500">{item.product_name.slice(0,2).toUpperCase()}</div>
                  )}
                  <div className="flex flex-1 flex-col">
                    <p className="font-semibold text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-500">{item.variant_label}</p>
                    <p className="mt-1 text-sm text-gray-700">£{item.unit_price.toFixed(2)} each</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product_id, item.variant_label, item.quantity - 1)} className="h-7 w-7 rounded border text-sm hover:bg-gray-50">−</button>
                      <input
                        type="number" min={1} value={item.quantity}
                        onChange={(e) => updateQuantity(item.product_id, item.variant_label, Math.max(1, Number(e.target.value) || 1))}
                        className="h-7 w-14 rounded border text-center text-sm"
                      />
                      <button onClick={() => updateQuantity(item.product_id, item.variant_label, item.quantity + 1)} className="h-7 w-7 rounded border text-sm hover:bg-gray-50">+</button>
                      <button onClick={() => removeItem(item.product_id, item.variant_label)} className="ml-3 text-xs font-medium text-red-600 hover:underline">Remove</button>
                    </div>
                  </div>
                  <div className="text-right font-bold text-gray-900">£{(item.unit_price * item.quantity).toFixed(2)}</div>
                </li>
              ))}
            </ul>
            <Link to="/shop" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">← Continue Shopping</Link>
          </section>

          <aside className="h-fit rounded-lg border bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {items.map((i) => (
                <li key={`${i.product_id}-${i.variant_label}`} className="flex justify-between">
                  <span className="truncate text-gray-700">{i.product_name} × {i.quantity}</span>
                  <span className="font-medium">£{(i.unit_price * i.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>£{cartTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="font-semibold text-green-600">FREE</span></div>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span>£{cartTotal.toFixed(2)}</span></div>
            <Link to="/checkout" className="mt-4 block rounded-md bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700">
              Proceed to Checkout
            </Link>
            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              🔒 Secure SSL Checkout
            </p>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
