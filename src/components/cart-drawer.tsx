import { Link } from "@tanstack/react-router";
import { useCart } from "@/contexts/CartContext";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, cartTotal } = useCart();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={closeCart}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
          <button onClick={closeCart} aria-label="Close cart" className="text-2xl leading-none text-gray-500 hover:text-gray-900">×</button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
            <p className="text-gray-600">Your cart is empty</p>
            <Link to="/shop" onClick={closeCart} className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Shop now
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={`${item.product_id}-${item.variant_label}`} className="flex gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} className="h-[50px] w-[50px] flex-shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-md bg-gray-200 text-xs text-gray-500">{item.product_name.slice(0,2).toUpperCase()}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-xs text-gray-500">{item.variant_label}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.product_id, item.variant_label, item.quantity - 1)} className="h-6 w-6 rounded border text-sm leading-none hover:bg-gray-50">−</button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.variant_label, item.quantity + 1)} className="h-6 w-6 rounded border text-sm leading-none hover:bg-gray-50">+</button>
                        <button onClick={() => removeItem(item.product_id, item.variant_label)} className="ml-auto text-gray-400 hover:text-red-600" aria-label="Remove">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">£{(item.unit_price * item.quantity).toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t px-5 py-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Subtotal</span>
                <span className="font-bold text-gray-900">£{cartTotal.toFixed(2)}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link to="/cart" onClick={closeCart} className="rounded-md border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
                  View Cart
                </Link>
                <Link to="/checkout" onClick={closeCart} className="rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700">
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
