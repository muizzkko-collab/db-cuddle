import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  product_id: string;
  subdomain: string;
  product_name: string;
  image_url: string;
  variant_label: string;
  unit_price: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantLabel: string) => void;
  updateQuantity: (productId: string, variantLabel: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "checkouthubs_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items, hydrated]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(p => p.product_id === item.product_id && p.variant_label === item.variant_label);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
  };

  const removeItem = (productId: string, variantLabel: string) => {
    setItems(prev => prev.filter(p => !(p.product_id === productId && p.variant_label === variantLabel)));
  };

  const updateQuantity = (productId: string, variantLabel: string, qty: number) => {
    if (qty <= 0) return removeItem(productId, variantLabel);
    setItems(prev => prev.map(p => p.product_id === productId && p.variant_label === variantLabel ? { ...p, quantity: qty } : p));
  };

  const clearCart = () => setItems([]);

  const cartTotal = useMemo(() => items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0), [items]);
  const cartCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart, cartTotal, cartCount,
      isOpen, openCart: () => setOpen(true), closeCart: () => setOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
