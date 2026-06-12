import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/contexts/CartContext";
import { useDomain } from "@/contexts/DomainContext";
import { MAIN_DOMAIN } from "@/lib/domain";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export const Route = createFileRoute("/products/$subdomain")({
  component: ProductDetail,
});

const CARD_TINTS = [
  { tint: "#FBE4DC", ink: "#2A1410" },
  { tint: "#E8DFFF", ink: "#1E1640" },
  { tint: "#DBEEF6", ink: "#0E2A3A" },
  { tint: "#DCEEDC", ink: "#0F2E1C" },
  { tint: "#F6E2EC", ink: "#3A1024" },
  { tint: "#FFF1C2", ink: "#3A2B05" },
  { tint: "#E2E6EE", ink: "#161C28" },
  { tint: "#E5E5E5", ink: "#1A1A1A" },
];

function getTint(subdomain: string) {
  let h = 0;
  for (let i = 0; i < subdomain.length; i++) h = (h * 31 + subdomain.charCodeAt(i)) & 0xffffff;
  return CARD_TINTS[h % CARD_TINTS.length];
}

const COLORS = [
  { name: "Olive",    hex: "#5B6B3A" },
  { name: "Sand",     hex: "#D8C9A9" },
  { name: "Charcoal", hex: "#2A2A2A" },
  { name: "Lavender", hex: "#B7A8D2" },
];

const PDP_CSS = `
  /* PDP page wrapper */
  .pdp-page { padding: 0 44px; }

  /* Breadcrumb */
  .pdp-crumbs {
    display: flex; gap: 8px; align-items: center;
    font-size: 13px; margin-bottom: 16px;
  }
  .pdp-crumbs a:hover { text-decoration: underline; }

  /* Hero grid */
  .pdp-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 56px; padding: 24px 0 64px; align-items: start;
  }

  /* Gallery */
  .pdp-gallery { position: sticky; top: 20px; display: flex; flex-direction: column; gap: 12px; }
  .pdp-main {
    position: relative; aspect-ratio: 1 / 1;
    border-radius: 28px; padding: 24px;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .pdp-tag {
    position: absolute; top: 16px; left: 16px;
    font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600;
    padding: 6px 10px; background: rgba(0,0,0,0.08); border-radius: 999px;
  }
  .pdp-off {
    position: absolute; top: 16px; right: 16px;
    font-size: 12px; font-weight: 700; padding: 6px 10px;
    background: rgba(0,0,0,0.85); color: #fff; border-radius: 999px;
  }
  .pdp-main-icon { width: 65%; height: 65%; display: flex; align-items: center; justify-content: center; }
  .pdp-zoom {
    position: absolute; bottom: 16px; right: 16px;
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(0,0,0,0.06);
    display: inline-flex; align-items: center; justify-content: center;
    border: none; cursor: pointer;
  }
  .pdp-zoom:hover { background: rgba(0,0,0,0.12); }
  .pdp-thumbs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  .pdp-thumb {
    aspect-ratio: 1; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid transparent; transition: border-color 150ms; cursor: pointer; padding: 8px;
  }
  .pdp-thumb.active { border-color: var(--ink); }

  /* Details */
  .pdp-details { padding-top: 8px; }
  .pdp-name {
    font-family: 'Instrument Serif', serif; font-weight: 400;
    font-size: clamp(44px, 5vw, 68px);
    line-height: 0.96; letter-spacing: -0.02em; margin: 0 0 14px;
  }
  .pdp-blurb { font-size: 16px; line-height: 1.45; margin: 0 0 18px; max-width: 480px; }
  .pdp-rating {
    display: flex; align-items: center; gap: 8px; font-size: 13.5px;
    margin-bottom: 22px; flex-wrap: wrap;
  }
  .pdp-rating-sep { opacity: 0.5; }
  .pdp-stock { display: inline-flex; align-items: center; gap: 6px; }
  .pulse-dot { width: 7px; height: 7px; border-radius: 50%; animation: pdp-pulse 1.6s ease-in-out infinite; }
  @keyframes pdp-pulse { 50% { opacity: 0.4; } }

  .pdp-price-row { display: flex; align-items: baseline; gap: 14px; margin-bottom: 28px; flex-wrap: wrap; }
  .pdp-price { font-family: 'Instrument Serif', serif; font-size: 42px; line-height: 1; letter-spacing: -0.02em; }
  .pdp-was { font-size: 18px; text-decoration: line-through; opacity: 0.5; }
  .pdp-save {
    font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
    padding: 5px 10px; border-radius: 999px; text-transform: uppercase;
  }

  /* Options */
  .pdp-option { margin-bottom: 22px; }
  .pdp-option-label { display: flex; gap: 8px; font-size: 14px; margin-bottom: 10px; align-items: baseline; }
  .pdp-swatches { display: flex; gap: 10px; }
  .pdp-swatch {
    width: 36px; height: 36px; border-radius: 50%;
    border: 2px solid transparent; cursor: pointer;
    transition: transform 120ms; outline: 2px solid var(--surface); outline-offset: -4px;
  }
  .pdp-swatch:hover { transform: scale(1.05); }
  .pdp-swatch.active { outline-color: var(--surface); }
  .pdp-variants { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .pdp-variant {
    border: 1.5px solid; border-radius: 14px; padding: 12px 14px;
    text-align: left; background: transparent; color: var(--ink);
    font-family: inherit; cursor: pointer; transition: border-color 150ms, transform 150ms;
  }
  .pdp-variant:hover { transform: translateY(-1px); }
  .pdp-variant.active { border-color: var(--ink) !important; }
  .pdp-variant-top { display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; }
  .pdp-variant-top strong { font-size: 15px; }
  .pdp-variant-sub { font-size: 12px; display: block; margin-top: 2px; }

  /* CTA row */
  .pdp-cta-row { display: flex; gap: 12px; margin-top: 32px; align-items: stretch; }
  .pdp-qty {
    display: flex; align-items: center; border: 1.5px solid; border-radius: 999px; padding: 4px;
  }
  .pdp-qty button {
    width: 36px; height: 36px; border-radius: 50%;
    font-size: 18px; font-weight: 500; background: none; border: none; cursor: pointer;
  }
  .pdp-qty button:hover { background: rgba(0,0,0,0.06); }
  .pdp-qty span { min-width: 32px; text-align: center; font-size: 15px; font-weight: 600; }
  .pdp-add {
    flex: 1; justify-content: center; padding: 16px 22px; font-size: 15px; gap: 6px;
    display: inline-flex; align-items: center; border-radius: 999px; font-weight: 600;
  }
  .pdp-add-price { opacity: 0.7; font-weight: 500; }
  .pdp-buy-now {
    width: 100%; margin-top: 10px; padding: 14px 22px;
    border-radius: 999px; border: 1.5px solid; font-size: 14.5px; font-weight: 600;
    background: transparent; cursor: pointer; transition: background 150ms; font-family: inherit;
  }
  .pdp-buy-now:hover { background: rgba(0,0,0,0.04); }

  /* Promises */
  .pdp-promises {
    list-style: none; padding: 22px 0 0; margin: 28px 0 0;
    border-top: 1px solid var(--line);
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
  }
  .pdp-promises li { display: flex; gap: 12px; align-items: flex-start; }
  .pdp-promises strong { display: block; font-size: 13.5px; }
  .pdp-promises span { font-size: 12.5px; line-height: 1.4; }

  /* Long description */
  .pdp-long {
    display: grid; grid-template-columns: 1.1fr 1.4fr; gap: 60px;
    padding: 64px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
  }
  .pdp-long-right p { font-size: 17px; line-height: 1.5; margin: 0 0 28px; max-width: 540px; }
  .pdp-specs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; }
  .pdp-spec {
    display: flex; justify-content: space-between; gap: 16px;
    padding: 14px 0; border-bottom: 1px solid; font-size: 14px;
  }
  .pdp-spec:nth-last-child(-n+2) { border-bottom: none; }

  /* Bundle */
  .bundle-section { padding: 64px 0 56px; }
  .section-head { margin-bottom: 36px; }
  .bundle-row {
    display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    gap: 36px; align-items: stretch;
  }
  .bundle-items { display: flex; gap: 12px; align-items: stretch; flex-wrap: wrap; }
  .bundle-card {
    flex: 1; min-width: 180px; border-radius: 22px; padding: 16px;
    display: flex; flex-direction: column; gap: 12px;
    position: relative; cursor: pointer;
    transition: transform 200ms, box-shadow 200ms, opacity 200ms;
    opacity: 0.55;
  }
  .bundle-card.picked { opacity: 1; box-shadow: 0 18px 36px -28px rgba(0,0,0,0.4); }
  .bundle-card:hover { transform: translateY(-2px); }
  .bundle-card input { position: absolute; opacity: 0; pointer-events: none; }
  .bundle-check {
    width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid;
    display: inline-flex; align-items: center; justify-content: center;
    background: transparent; align-self: flex-end; opacity: 0; transition: opacity 150ms;
  }
  .bundle-card.picked .bundle-check { opacity: 1; background: rgba(0,0,0,0.1); }
  .bundle-icon { width: 100%; aspect-ratio: 1.2 / 1; display: flex; align-items: center; justify-content: center; }
  .bundle-meta { display: flex; flex-direction: column; gap: 4px; }
  .bundle-name { font-family: 'Instrument Serif', serif; font-size: 18px; line-height: 1.05; }
  .bundle-price { font-size: 14px; font-weight: 600; }
  .bundle-this {
    position: absolute; top: 14px; left: 14px;
    font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600;
    padding: 4px 8px; background: rgba(0,0,0,0.12); border-radius: 999px;
  }
  .bundle-plus {
    align-self: center; font-family: 'Instrument Serif', serif;
    font-size: 28px; opacity: 0.5; padding: 0 4px;
  }
  .bundle-summary {
    border: 1.5px solid; border-radius: 22px; padding: 22px;
    display: flex; flex-direction: column; gap: 14px; align-self: flex-start;
  }
  .bundle-sum-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 14.5px; }
  .bundle-sum-row strong { font-family: 'Instrument Serif', serif; font-size: 28px; letter-spacing: -0.02em; }
  .bundle-save-chip { font-size: 13px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
  .bundle-add {
    justify-content: center; padding: 14px 22px; font-size: 14.5px; margin-top: 4px;
    display: flex; align-items: center; gap: 10px; border-radius: 999px; font-weight: 600;
  }
  .bundle-tip { font-size: 12.5px; text-align: center; }

  /* Section headers */
  .eyebrow {
    font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600;
  }
  .section-title {
    font-family: 'Instrument Serif', serif; font-weight: 400;
    font-size: clamp(40px, 5vw, 68px); line-height: 0.96;
    letter-spacing: -0.02em; margin: 8px 0 0;
  }

  /* Product grid (reuse from homepage) */
  .grid-section { padding: 56px 0 64px; }
  .grid-header {
    display: grid; grid-template-columns: 1.2fr 1fr; gap: 40px; align-items: end; margin-bottom: 36px;
  }
  .grid-intro { font-size: 15.5px; line-height: 1.5; max-width: 460px; margin: 0; }
  .product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .product-card {
    border-radius: 22px; padding: 14px;
    display: flex; flex-direction: column; gap: 14px;
    transition: transform 200ms ease, box-shadow 200ms ease;
    position: relative; overflow: hidden; text-decoration: none; color: inherit;
  }
  .product-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -28px rgba(0,0,0,0.3); }
  .product-media {
    position: relative; aspect-ratio: 1 / 1; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.35);
  }
  .product-tag {
    position: absolute; top: 10px; left: 10px;
    font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
    font-weight: 600; padding: 4px 8px; background: rgba(0,0,0,0.06); border-radius: 999px;
  }
  .product-off {
    position: absolute; top: 10px; right: 10px;
    font-size: 11px; font-weight: 700; padding: 4px 8px;
    background: rgba(0,0,0,0.85); color: #fff; border-radius: 999px;
  }
  .product-icon-wrap { width: 70%; height: 70%; display: flex; align-items: center; justify-content: center; }
  .product-meta { display: flex; flex-direction: column; gap: 4px; padding: 0 4px; }
  .product-name { font-family: 'Instrument Serif', serif; font-size: 22px; line-height: 1.02; letter-spacing: -0.015em; }
  .product-price-row { display: flex; align-items: baseline; gap: 8px; }
  .product-price { font-size: 15px; font-weight: 600; }
  .product-was { font-size: 12.5px; text-decoration: line-through; opacity: 0.5; }
  .product-cta {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; border-radius: 999px; font-size: 13px; font-weight: 600;
    transition: filter 150ms;
  }
  .product-card:hover .product-cta { filter: brightness(0.95); }

  /* Responsive */
  @media (max-width: 1100px) {
    .pdp-hero { grid-template-columns: 1fr; gap: 32px; }
    .pdp-gallery { position: static; }
    .pdp-long { grid-template-columns: 1fr; gap: 32px; }
    .bundle-row { grid-template-columns: 1fr; }
    .product-grid { grid-template-columns: repeat(3, 1fr); }
    .grid-header { grid-template-columns: 1fr; }
  }
  @media (max-width: 720px) {
    .pdp-page { padding: 0 20px; }
    .pdp-promises { grid-template-columns: 1fr; gap: 14px; }
    .pdp-variants { grid-template-columns: 1fr; }
    .pdp-specs { grid-template-columns: 1fr; }
    .bundle-items { flex-direction: column; }
    .pdp-cta-row { flex-wrap: wrap; }
    .product-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

function Stars({ size = 14 }: { size?: number }) {
  return (
    <svg width={size * 5 + 8} height={size} viewBox={`0 0 ${5 * (size + 2)} ${size}`} style={{ color: "#F5B400" }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          transform={`translate(${i * (size + 2)} 0) scale(${size / 14})`}
          d="M7 0 L8.6 4.6 L13.5 4.6 L9.6 7.6 L11 12.4 L7 9.5 L3 12.4 L4.4 7.6 L0.5 4.6 L5.4 4.6 Z"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

function PlaceholderIcon({ ink }: { ink: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", stroke: ink, fill: "none", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" }}>
      <rect x="22" y="30" width="56" height="40" rx="4" />
      <path d="M22 42 L78 42" />
      <circle cx="66" cy="56" r="3" />
      <rect x="34" y="42" width="16" height="14" rx="2" />
    </svg>
  );
}

function ProductDetail() {
  const { subdomain } = useParams({ from: "/products/$subdomain" });
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();
  const { rootDomain } = useDomain();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThumb, setActiveThumb] = useState(0);
  const [variant, setVariant] = useState(2);
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState("Olive");
  const [bundlePicked, setBundlePicked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("products").select("*").eq("subdomain", subdomain).maybeSingle();
      if (p) {
        setProduct(p as Product);
        setVariant((p as Product).default_variant ?? 2);
        const domain = rootDomain || MAIN_DOMAIN;
        const isMain = domain === MAIN_DOMAIN;
        const filter = isMain ? `root_domain.eq.${MAIN_DOMAIN},root_domain.is.null` : `root_domain.eq.${domain}`;
        const { data: rd, error: re } = await (
          supabase.from("products").select("*").neq("active", false).neq("subdomain", subdomain).limit(4) as any
        ).or(filter);
        if (!re) setRelated((rd ?? []) as Product[]);
        else {
          const { data: fb } = await supabase.from("products").select("*").neq("active", false).neq("subdomain", subdomain).limit(4);
          setRelated((fb ?? []) as Product[]);
        }
      }
      setLoading(false);
    })();
  }, [subdomain, rootDomain]);

  const selected = useMemo(() => {
    if (!product) return { label: "", price: 0 };
    if (variant === 1) return { label: product.label_1 ?? "Single", price: Number(product.price_1) };
    if (variant === 3) return { label: product.label_3 ?? "Bulk",   price: Number(product.price_3) };
    return { label: product.label_2 ?? "Bundle", price: Number(product.price_2) };
  }, [product, variant]);

  const addToCart = () => {
    if (!product) return;
    addItem({ product_id: product.id, subdomain: product.subdomain, product_name: product.product_name, image_url: product.image_url ?? "", variant_label: selected.label, unit_price: selected.price, quantity: qty });
  };

  if (loading) return (
    <SiteLayout>
      <div style={{ padding: "120px 44px", textAlign: "center", color: "var(--muted)" }}>Loading…</div>
    </SiteLayout>
  );

  if (!product) return (
    <SiteLayout>
      <div style={{ padding: "120px 44px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 40 }}>Product not found.</p>
        <Link to="/shop" style={{ marginTop: 16, display: "inline-block", textDecoration: "underline" }}>← Back to shop</Link>
      </div>
    </SiteLayout>
  );

  const unit1 = Number(product.price_1);
  const unit2 = Number(product.price_2);
  const unit3 = Number(product.price_3);
  const showSale = unit1 > unit2 && unit2 > 0;
  const savings = showSale ? unit1 - unit2 : 0;
  const offPct = showSale ? Math.round((1 - unit2 / unit1) * 100) : 0;

  const displayPrice = unit2 > 0 ? unit2 : unit1;
  const activeTint = activeThumb === 0 ? getTint(product.subdomain) : getTint(related[activeThumb - 1]?.subdomain ?? product.subdomain);
  const activeProduct = activeThumb === 0 ? product : (related[activeThumb - 1] ?? product);

  const variants = [
    { id: 1, name: product.label_1 ?? "Single", sub: "One item",             price: unit1, extra: null },
    { id: 2, name: product.label_2 ?? "Bundle", sub: "Two items — best value", price: unit2, extra: showSale ? `Save ${offPct}%` : null },
    { id: 3, name: product.label_3 ?? "Bulk",   sub: "Max savings",           price: unit3, extra: unit1 > 0 && unit3 > 0 ? `Save ${Math.round((1 - unit3 / unit1) * 100)}%` : null },
  ].filter((v) => v.price > 0);

  const bundleItems = [product, ...related.slice(0, 2)];
  const bundleTotal = bundleItems.reduce((s, it) => it.id === product.id || bundlePicked[it.id] ? s + Number(it.price_2) : s, 0);
  const bundleWas = bundleItems.reduce((s, it) => it.id === product.id || bundlePicked[it.id] ? s + (Number(it.price_1) || Number(it.price_2)) : s, 0);

  const specs: [string, string][] = [
    ["Delivery",  "3–5 business days"],
    ["Returns",   "30 days, hassle-free"],
    ["Warranty",  "2 years included"],
    ["Shipping",  "Free over £40"],
    ["Condition", "Brand new"],
    ["Support",   "Live chat + email"],
  ];

  return (
    <SiteLayout>
      <style>{PDP_CSS}</style>

      <div className="pdp-page">

        {/* HERO */}
        <section className="pdp-hero">

          {/* Gallery */}
          <div className="pdp-gallery">
            <div className="pdp-main" style={{ background: activeTint.tint, color: activeTint.ink }}>
              <span className="pdp-tag">{activeProduct.subdomain?.replace(/-/g, " ")}</span>
              {showSale && <span className="pdp-off">−{offPct}% off</span>}
              <div className="pdp-main-icon">
                {activeProduct.image_url ? (
                  <img src={activeProduct.image_url} alt={activeProduct.product_name} style={{ width: "65%", height: "65%", objectFit: "contain" }} />
                ) : (
                  <PlaceholderIcon ink={activeTint.ink} />
                )}
              </div>
              <button className="pdp-zoom" aria-label="Zoom">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" /><path d="M21 21 L16 16 M11 8 V14 M8 11 H14" />
                </svg>
              </button>
            </div>

            <div className="pdp-thumbs">
              {[product, ...related.slice(0, 4)].map((item, i) => {
                const t = getTint(item.subdomain);
                return (
                  <button key={item.id} className={`pdp-thumb${activeThumb === i ? " active" : ""}`}
                    style={{ background: t.tint, color: t.ink }} onClick={() => setActiveThumb(i)}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} style={{ width: "70%", height: "70%", objectFit: "contain" }} />
                    ) : (
                      <svg viewBox="0 0 100 100" style={{ width: "70%", height: "70%", stroke: t.ink, fill: "none", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }}>
                        <rect x="22" y="30" width="56" height="40" rx="4" /><circle cx="50" cy="50" r="10" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div className="pdp-details">
            <div className="pdp-crumbs" style={{ color: "var(--muted)" }}>
              <Link to="/">Home</Link>
              <span>›</span>
              <Link to="/shop">{product.subdomain?.replace(/-/g, " ")}</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>{product.product_name}</span>
            </div>

            <h1 className="pdp-name">{product.product_name}</h1>
            {product.subheadline && <p className="pdp-blurb" style={{ color: "var(--muted)" }}>{product.subheadline}</p>}

            <div className="pdp-rating">
              <Stars />
              <strong>4.8</strong>
              <span style={{ color: "var(--muted)" }}>· 2,318 reviews</span>
              <span className="pdp-rating-sep" style={{ color: "var(--muted)" }}>·</span>
              <span className="pdp-stock">
                <span className="pulse-dot" style={{ background: "#1FA362" }} />
                In stock, ships today
              </span>
            </div>

            <div className="pdp-price-row">
              <span className="pdp-price">£{displayPrice.toFixed(2)}</span>
              {showSale && <span className="pdp-was">£{unit1.toFixed(2)}</span>}
              {savings > 0 && (
                <span className="pdp-save" style={{ background: "var(--accent)", color: "var(--ink)" }}>
                  You save £{savings.toFixed(2)}
                </span>
              )}
            </div>

            {/* Color option */}
            <div className="pdp-option">
              <div className="pdp-option-label">
                <span style={{ color: "var(--muted)" }}>Color</span>
                <strong>{color}</strong>
              </div>
              <div className="pdp-swatches">
                {COLORS.map((c) => (
                  <button key={c.name} className={`pdp-swatch${color === c.name ? " active" : ""}`}
                    style={{ background: c.hex, borderColor: color === c.name ? "var(--ink)" : "transparent" }}
                    onClick={() => setColor(c.name)} aria-label={c.name} />
                ))}
              </div>
            </div>

            {/* Pack / variant */}
            {variants.length > 1 && (
              <div className="pdp-option">
                <div className="pdp-option-label">
                  <span style={{ color: "var(--muted)" }}>Pack</span>
                  <strong>{variants.find((v) => v.id === variant)?.name}</strong>
                </div>
                <div className="pdp-variants">
                  {variants.map((v) => (
                    <button key={v.id} className={`pdp-variant${variant === v.id ? " active" : ""}`}
                      style={{ borderColor: variant === v.id ? "var(--ink)" : "var(--line)" }}
                      onClick={() => setVariant(v.id)}>
                      <div className="pdp-variant-top">
                        <strong>{v.name}</strong>
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>{v.extra ?? `£${v.price.toFixed(2)}`}</span>
                      </div>
                      <span className="pdp-variant-sub" style={{ color: "var(--muted)" }}>{v.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA row */}
            <div className="pdp-cta-row">
              <div className="pdp-qty" style={{ borderColor: "var(--line)" }}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} aria-label="Increase">+</button>
              </div>
              <button className="pdp-add"
                style={{ background: "var(--accent)", color: "var(--ink)", border: "none", cursor: "pointer" }}
                onClick={() => { addToCart(); openCart(); }}>
                Add to checkout
                <span className="pdp-add-price">· £{(selected.price * qty).toFixed(2)}</span>
              </button>
            </div>

            <button className="pdp-buy-now"
              style={{ borderColor: "var(--ink)", color: "var(--ink)" }}
              onClick={() => { addToCart(); navigate({ to: "/checkout" }); }}>
              Buy now — express checkout
            </button>

            {/* Promises */}
            <ul className="pdp-promises">
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="13" height="10" rx="1.5" /><path d="M15 10 H19 L22 13 V17 H15 Z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" />
                </svg>
                <div><strong>Free shipping</strong><span style={{ color: "var(--muted)" }}>On orders over £40</span></div>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12 a8 8 0 1 1 4 7" /><path d="M3 8 L4 12 L8 11" />
                </svg>
                <div><strong>30-day returns</strong><span style={{ color: "var(--muted)" }}>Free if it doesn't click</span></div>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 L20 5 V12 C20 16.5 16.5 20 12 22 C7.5 20 4 16.5 4 12 V5 Z" /><path d="M8.5 12 L11 14.5 L16 9.5" />
                </svg>
                <div><strong>2-year warranty</strong><span style={{ color: "var(--muted)" }}>Real humans, real replacements</span></div>
              </li>
            </ul>
          </div>
        </section>

        {/* LONG DESCRIPTION + SPECS */}
        <section className="pdp-long">
          <div className="pdp-long-left">
            <span className="eyebrow" style={{ color: "var(--muted)" }}>Why it's good</span>
            <h2 className="section-title">Built to last.<br />Designed to work.</h2>
          </div>
          <div className="pdp-long-right">
            <p style={{ color: "var(--ink)" }}>
              {product.subheadline ?? `The ${product.product_name} is designed for people who want quality without compromise. Every detail has been tested and refined — no shortcuts, no filler.`}
            </p>
            <div className="pdp-specs">
              {specs.map(([k, v]) => (
                <div key={k} className="pdp-spec" style={{ borderColor: "var(--line)" }}>
                  <span style={{ color: "var(--muted)" }}>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FREQUENTLY BOUGHT TOGETHER */}
        {bundleItems.length > 1 && (
          <section className="bundle-section">
            <div className="section-head">
              <span className="eyebrow" style={{ color: "var(--muted)" }}>Built to pair</span>
              <h2 className="section-title">Frequently bought together.</h2>
            </div>
            <div className="bundle-row">
              <div className="bundle-items">
                {bundleItems.map((it, i) => {
                  const bt = getTint(it.subdomain);
                  const isPrimary = it.id === product.id;
                  const isPicked = isPrimary || !!bundlePicked[it.id];
                  return (
                    <>
                      {i > 0 && <div className="bundle-plus" style={{ color: "var(--ink)" }}>+</div>}
                      <label key={it.id} className={`bundle-card${isPicked ? " picked" : ""}`}
                        style={{ background: bt.tint, color: bt.ink }}
                        onClick={!isPrimary ? () => setBundlePicked((p) => ({ ...p, [it.id]: !p[it.id] })) : undefined}>
                        <input type="checkbox" checked={isPicked} readOnly />
                        <span className="bundle-check" style={{ borderColor: bt.ink }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12 L10 17 L20 7" />
                          </svg>
                        </span>
                        <div className="bundle-icon">
                          {it.image_url ? (
                            <img src={it.image_url} alt={it.product_name} style={{ width: "55%", height: "55%", objectFit: "contain" }} />
                          ) : (
                            <svg viewBox="0 0 100 100" style={{ width: "55%", height: "55%", stroke: bt.ink, fill: "none", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" }}>
                              <rect x="22" y="30" width="56" height="40" rx="4" /><circle cx="50" cy="50" r="10" />
                            </svg>
                          )}
                        </div>
                        <div className="bundle-meta">
                          <span className="bundle-name">{it.product_name}</span>
                          <span className="bundle-price">£{Number(it.price_2).toFixed(2)}</span>
                        </div>
                        {isPrimary && <span className="bundle-this">This item</span>}
                      </label>
                    </>
                  );
                })}
              </div>

              <div className="bundle-summary" style={{ borderColor: "var(--line)" }}>
                <div className="bundle-sum-row">
                  <span style={{ color: "var(--muted)" }}>Bundle price</span>
                  <span>
                    <strong>£{bundleTotal.toFixed(2)}</strong>
                    {bundleWas > bundleTotal && (
                      <s style={{ color: "var(--muted)", fontWeight: 400, marginLeft: 8 }}>£{bundleWas.toFixed(2)}</s>
                    )}
                  </span>
                </div>
                {bundleWas > bundleTotal && (
                  <div className="bundle-sum-row">
                    <span style={{ color: "var(--muted)" }}>You save</span>
                    <span className="bundle-save-chip" style={{ background: "var(--accent)", color: "var(--ink)" }}>
                      £{(bundleWas - bundleTotal).toFixed(2)}
                    </span>
                  </div>
                )}
                <button className="bundle-add"
                  style={{ background: "var(--ink)", color: "var(--bg)", border: "none", cursor: "pointer" }}
                  onClick={() => {
                    bundleItems.forEach((it) => {
                      if (it.id === product.id || bundlePicked[it.id]) {
                        addItem({ product_id: it.id, subdomain: it.subdomain, product_name: it.product_name, image_url: it.image_url ?? "", variant_label: it.label_2 ?? "Bundle", unit_price: Number(it.price_2), quantity: 1 });
                      }
                    });
                    openCart();
                  }}>
                  Add bundle to checkout
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12 L19 12 M13 6 L19 12 L13 18" /></svg>
                </button>
                <span className="bundle-tip" style={{ color: "var(--muted)" }}>Toggle add-ons to update the price.</span>
              </div>
            </div>
          </section>
        )}

        {/* YOU MIGHT ALSO LIKE */}
        {related.length > 0 && (
          <section className="grid-section">
            <div className="grid-header">
              <div>
                <span className="eyebrow" style={{ color: "var(--muted)" }}>Customers also bought</span>
                <h2 className="section-title">You might also like.</h2>
              </div>
              <p className="grid-intro" style={{ color: "var(--muted)" }}>
                Picked from thousands of products our team actually uses. No duds, no hype.
              </p>
            </div>
            <div className="product-grid">
              {related.slice(0, 4).map((p) => {
                const rt = getTint(p.subdomain);
                const rs = Number(p.price_1) > Number(p.price_2) && Number(p.price_2) > 0;
                const roff = rs ? Math.round((1 - Number(p.price_2) / Number(p.price_1)) * 100) : 0;
                return (
                  <Link key={p.id} to="/products/$subdomain" params={{ subdomain: p.subdomain }}
                    className="product-card" style={{ background: rt.tint, color: rt.ink }}>
                    <div className="product-media">
                      <span className="product-tag">{p.subdomain?.replace(/-/g, " ")}</span>
                      <div className="product-icon-wrap">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.product_name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        ) : (
                          <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", stroke: rt.ink, fill: "none", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }}>
                            <rect x="22" y="30" width="56" height="40" rx="4" /><circle cx="50" cy="50" r="10" />
                          </svg>
                        )}
                      </div>
                      {rs && roff > 0 && <span className="product-off">−{roff}%</span>}
                    </div>
                    <div className="product-meta">
                      <div className="product-name">{p.product_name}</div>
                      <div className="product-price-row">
                        <span className="product-price">£{Number(p.price_2).toFixed(2)}</span>
                        {rs && <span className="product-was">£{Number(p.price_1).toFixed(2)}</span>}
                      </div>
                    </div>
                    <div className="product-cta" style={{ background: "var(--accent)", color: "#141414" }}>
                      <span>Add to checkout</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12 L19 12 M13 6 L19 12 L13 18" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </SiteLayout>
  );
}
