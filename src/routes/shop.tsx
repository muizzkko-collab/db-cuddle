import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/contexts/CartContext";
import { useDomain } from "@/contexts/DomainContext";
import { MAIN_DOMAIN } from "@/lib/domain";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — checkoutculture" },
      { name: "description", content: "Browse our full range of tested, vetted products with fast UK delivery." },
    ],
  }),
  component: Shop,
});

const BG_TINTS = ["#F4EFE7", "#E8DDD0", "#DDE3D2", "#F0E5D6", "#E4DAC8", "#EDE4D2", "#E1E8D9", "#EFE2D5"];

function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("featured");
  const { addItem, openCart } = useCart();
  const { rootDomain } = useDomain();

  useEffect(() => {
    const loadProducts = async () => {
      const domain = rootDomain || MAIN_DOMAIN;
      const isMain = domain === MAIN_DOMAIN;
      const filter = isMain
        ? `root_domain.eq.${MAIN_DOMAIN},root_domain.is.null`
        : `root_domain.eq.${domain}`;
      const { data, error } = await (supabase.from("products").select("*").neq("active", false) as any)
        .or(filter)
        .order("created_at", { ascending: false });
      if (!error) { setProducts((data ?? []) as Product[]); setLoading(false); return; }
      const { data: fallback } = await supabase.from("products").select("*").neq("active", false)
        .order("created_at", { ascending: false });
      setProducts((fallback ?? []) as Product[]);
      setLoading(false);
    };
    loadProducts();
  }, [rootDomain]);

  const sorted = useMemo(() => {
    const arr = [...products];
    if (sort === "price-asc") return arr.sort((a, b) => Number(a.price_2) - Number(b.price_2));
    if (sort === "price-desc") return arr.sort((a, b) => Number(b.price_2) - Number(a.price_2));
    return arr;
  }, [products, sort]);

  const handleAdd = (p: Product) => {
    const v = p.default_variant ?? 2;
    const price = v === 1 ? Number(p.price_1) : v === 3 ? Number(p.price_3) : Number(p.price_2);
    const label = v === 1 ? (p.label_1 ?? "Single") : v === 3 ? (p.label_3 ?? "Bulk") : (p.label_2 ?? "Bundle");
    addItem({ product_id: p.id, subdomain: p.subdomain, product_name: p.product_name, image_url: p.image_url ?? "", variant_label: label, unit_price: price, quantity: 1 });
    openCart();
  };

  return (
    <SiteLayout>
      <style>{`
        .ch-shop-product:hover .ch-add { opacity: 1; transform: translateY(0); }
        .ch-shop-product:hover .ch-img-wrap { transform: translateY(-4px); }
      `}</style>
      <div className="mx-auto" style={{ maxWidth: 1320, padding: "48px 40px 96px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 12, display: "flex", gap: 8, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ch-ink-3)" }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <span style={{ color: "var(--ch-ink-2)" }}>Shop</span>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56, paddingTop: 24 }}>
          <span style={{ fontFamily: "var(--ch-serif)", fontStyle: "italic", fontSize: 18, color: "var(--ch-accent)" }}>— The full edit</span>
          <h1 style={{ fontFamily: "var(--ch-serif)", fontSize: "clamp(48px, 6vw, 72px)", lineHeight: 1, letterSpacing: "-0.015em", margin: "12px 0 16px", fontWeight: 400 }}>
            Shop the collection.
          </h1>
          <p style={{ color: "var(--ch-ink-2)", fontSize: 15, maxWidth: 480, margin: "0 auto" }}>
            {loading ? "Loading…" : `${sorted.length} product${sorted.length !== 1 ? "s" : ""}, every one tested by our team.`}
          </p>
        </div>

        {/* Sort bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: "1px solid var(--ch-hair)", borderBottom: "1px solid var(--ch-hair)", marginBottom: 40 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ch-ink-3)", fontWeight: 500 }}>
            {sorted.length} items
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              background: "transparent",
              border: 0,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--ch-ink)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28 }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} style={{ aspectRatio: "1 / 1.4", background: "var(--ch-bg-elev)", borderRadius: 14, animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontFamily: "var(--ch-serif)", fontSize: 32, color: "var(--ch-ink)" }}>The shelf is empty.</p>
            <p style={{ color: "var(--ch-ink-2)", marginTop: 8 }}>We're stocking up — check back soon.</p>
            <Link
              to="/contact"
              style={{
                display: "inline-flex",
                marginTop: 24,
                padding: "14px 22px",
                borderRadius: 999,
                border: "1px solid var(--ch-ink)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Contact us →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28 }}>
            {sorted.map((p, idx) => (
              <ShopProductCard key={p.id} product={p} index={idx} onAdd={() => handleAdd(p)} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function ShopProductCard({ product, index, onAdd }: { product: Product; index: number; onAdd: () => void }) {
  const bg = BG_TINTS[index % BG_TINTS.length];
  const showSale = Number(product.price_1) > Number(product.price_2) && Number(product.price_2) > 0;
  const badge = index === 0 ? "Best seller" : index === 1 ? "New" : showSale ? `−${Math.round((1 - Number(product.price_2) / Number(product.price_1)) * 100)}%` : null;
  const badgeBg = badge === "New" ? "var(--ch-accent)" : badge?.startsWith("−") ? "#B5432B" : "var(--ch-ink)";

  return (
    <div className="ch-shop-product" style={{ position: "relative" }}>
      <Link to="/products/$subdomain" params={{ subdomain: product.subdomain }} style={{ color: "inherit" }}>
        <div className="ch-img-wrap" style={{ position: "relative", aspectRatio: "1 / 1.1", background: bg, borderRadius: 14, overflow: "hidden", marginBottom: 18, transition: "transform .3s ease" }}>
          {badge && (
            <span style={{ position: "absolute", top: 14, left: 14, background: badgeBg, color: "#fff", padding: "5px 10px", borderRadius: 999, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, zIndex: 2 }}>
              {badge}
            </span>
          )}
          {product.image_url ? (
            <img src={product.image_url} alt={product.product_name}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ch-serif)", fontSize: 64, color: "var(--ch-ink-3)" }}>
              {product.product_name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); onAdd(); }}
            className="ch-add"
            style={{ position: "absolute", left: 14, right: 14, bottom: 14, padding: "12px 14px", background: "var(--ch-ink)", color: "#fff", border: 0, borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0, transform: "translateY(8px)", transition: "opacity .25s ease, transform .25s ease", zIndex: 2, cursor: "pointer" }}
          >
            Add to bag · £{Number(product.price_2).toFixed(0)}
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11, color: "var(--ch-ink-3)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
          <span>{product.subdomain}</span>
          <span>★ 4.8</span>
        </div>
        <h3 style={{ fontFamily: "var(--ch-serif)", fontSize: 22, lineHeight: 1.15, margin: "0 0 6px", fontWeight: 400 }}>{product.product_name}</h3>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {showSale && <span style={{ color: "var(--ch-ink-3)", textDecoration: "line-through", fontWeight: 400, marginRight: 6 }}>£{Number(product.price_1).toFixed(2)}</span>}
          £{Number(product.price_2).toFixed(2)}
        </div>
      </Link>
    </div>
  );
}
