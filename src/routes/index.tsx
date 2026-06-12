import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { isCountryCode, mapIsoToCode, SUPPORTED_COUNTRIES, type CountryCode } from "@/lib/countries";
import { SiteLayout } from "@/components/site-layout";
import { CheckoutPage } from "@/components/checkout-page";
import { useDomain } from "@/contexts/DomainContext";
import { MAIN_DOMAIN } from "@/lib/domain";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "checkoutculture — Quality Products, Fast UK Delivery" },
      { name: "description", content: "Trusted UK e-commerce store offering quality products with fast delivery and secure checkout." },
      { property: "og:title", content: "checkoutculture — Quality Products, Fast UK Delivery" },
      { property: "og:description", content: "Trusted UK e-commerce store offering quality products with fast delivery and secure checkout." },
    ],
  }),
  component: RootRouter,
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
const MARQUEE_ITEMS = [
  "Free shipping over £40",
  "30-day money-back",
  "2-year warranty included",
  "Worldwide delivery",
  "Same-day dispatch before 3pm",
  "Verified-merchant program",
];
const CATEGORIES = ["All", "Wellness", "Recovery", "Outdoor", "Fitness", "Beauty", "Audio", "Home", "Work", "EDC"];

function RootRouter() {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<CountryCode | null>(null);
  const [countryResolved, setCountryResolved] = useState(false);
  const [countryFixed, setCountryFixed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hostname = window.location.hostname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const previewSub = params.get("subdomain");
    const previewCountry = params.get("country");

    let detectedSub: string | null = null;
    if (previewSub) {
      detectedSub = previewSub;
    } else {
      const isMainStoreHostname =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "checkouthub.com" ||
        hostname === "www.checkouthub.com" ||
        hostname.endsWith(".lovable.app") ||
        hostname.endsWith(".lovableproject.com") ||
        hostname.endsWith(".vercel.app");
      if (!isMainStoreHostname && hostname.includes(".")) {
        const sub = hostname.split(".")[0];
        if (sub && sub !== "www") detectedSub = sub;
      }
    }

    if (!detectedSub) return;
    setSubdomain(detectedSub);

    // Never rewrite the URL path — TanStack Router would try to match /uk as
    // a route, find nothing, and show 404. Country is tracked in state only.
    const isPreviewMode = true;

    // Country resolution: preview param > url path > ip geolocate
    if (previewCountry && isCountryCode(previewCountry)) {
      setCountryCode(previewCountry);
      setCountryFixed(true);
      setCountryResolved(true);
      return;
    }

    const firstSeg = window.location.pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
    if (isCountryCode(firstSeg)) {
      setCountryCode(firstSeg);
      setCountryFixed(true);
      setCountryResolved(true);
      return;
    }

    if (firstSeg && !isCountryCode(firstSeg) && SUPPORTED_COUNTRIES.length > 0) {
      if (!isPreviewMode) window.history.replaceState(null, "", `/uk${window.location.search}`);
      setCountryCode("uk");
      setCountryFixed(true);
      setCountryResolved(true);
      return;
    }

    // Empty path — auto-detect via IP (country not fixed, show dropdown)
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => {
        const code = mapIsoToCode(d?.country_code);
        if (!isPreviewMode) window.history.replaceState(null, "", `/${code}${window.location.search}`);
        setCountryCode(code);
        setCountryFixed(false);
        setCountryResolved(true);
      })
      .catch(() => {
        if (!isPreviewMode) window.history.replaceState(null, "", `/uk${window.location.search}`);
        setCountryCode("uk");
        setCountryFixed(false);
        setCountryResolved(true);
      });
  }, []);

  if (subdomain) {
    if (!countryResolved || !countryCode) {
      return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
    }
    return <CheckoutPage subdomain={subdomain} countryCode={countryCode} countryFixed={countryFixed} />;
  }




  return <MainStore />;
}

type Product = Tables<"products">;

function useCountdown(initialSeconds: number) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : initialSeconds)), 1000);
    return () => clearInterval(t);
  }, [initialSeconds]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function MainStore() {
  const { rootDomain } = useDomain();
  const { addItem, openCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const countdown = useCountdown(9589);

  useEffect(() => {
    const load = async () => {
      const domain = rootDomain || MAIN_DOMAIN;
      const isMain = domain === MAIN_DOMAIN;
      const filter = isMain ? `root_domain.eq.${MAIN_DOMAIN},root_domain.is.null` : `root_domain.eq.${domain}`;
      const { data, error } = await (supabase.from("products").select("*").neq("active", false) as any)
        .or(filter).order("created_at", { ascending: false });
      if (!error) { setProducts((data ?? []) as Product[]); return; }
      const { data: fb } = await supabase.from("products").select("*").neq("active", false).order("created_at", { ascending: false });
      setProducts((fb ?? []) as Product[]);
    };
    load();
  }, [rootDomain]);

  const handleAdd = (p: Product) => {
    const v = p.default_variant ?? 2;
    const price = v === 1 ? Number(p.price_1) : v === 3 ? Number(p.price_3) : Number(p.price_2);
    const label = v === 1 ? (p.label_1 ?? "Single") : v === 3 ? (p.label_3 ?? "Bulk") : (p.label_2 ?? "Bundle");
    addItem({ product_id: p.id, subdomain: p.subdomain, product_name: p.product_name, image_url: p.image_url ?? "", variant_label: label, unit_price: price, quantity: 1 });
    openCart();
  };

  const carouselProducts = useMemo(() => products.slice(0, 6), [products]);
  const shelfProducts = useMemo(() => products, [products]);

  return (
    <SiteLayout>
      <style>{`
        /* ---- Page-level overrides ---- */
        main { padding: 0 44px; }
        @keyframes co-pg-marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }

        /* ---- Promo + marquee ---- */
        .promo-bar {
          height: 38px;
          display: flex; align-items: center; justify-content: center;
          gap: 10px; font-size: 13px; letter-spacing: 0.02em; font-weight: 500;
        }
        .promo-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .promo-sep { opacity: 0.4; }
        .pg-marquee {
          background: var(--accent);
          color: #141414;
          border-top: 1px solid rgba(0,0,0,0.08);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          overflow: hidden; height: 36px;
          display: flex; align-items: center;
          margin: 0 -44px;
        }
        .pg-marquee-track {
          display: flex; gap: 36px; white-space: nowrap;
          animation: co-pg-marquee 38s linear infinite;
          padding-left: 36px;
          font-weight: 600; font-size: 13px;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .pg-marquee-item { display: inline-flex; align-items: center; gap: 14px; }
        .pg-marquee-bullet { font-size: 10px; opacity: 0.6; }

        /* ---- Hero ---- */
        .hero {
          padding: 24px 0 56px;
          text-align: center;
          display: flex; flex-direction: column; align-items: center;
        }
        .hero-rating {
          display: inline-flex; align-items: center; gap: 12px;
          font-size: 13px; color: var(--muted);
        }
        .hero-avatars { display: inline-flex; }
        .hero-avatars span {
          display: inline-block; width: 24px; height: 24px;
          border-radius: 50%; border: 2px solid var(--bg);
          margin-left: -8px;
        }
        .hero-avatars span:first-child { margin-left: 0; }
        .hero-stars { color: #F5B400; display: inline-flex; }
        .hero-rating-meta { display: inline-flex; gap: 6px; align-items: baseline; }
        .hero-rating-meta strong { color: var(--ink); font-weight: 600; }
        .hero-headline {
          font-family: 'Instrument Serif', serif;
          font-weight: 400;
          font-size: clamp(64px, 8.8vw, 132px);
          line-height: 0.94;
          letter-spacing: -0.025em;
          margin: 18px 0 22px;
        }
        .hero-headline em { font-style: italic; font-weight: 400; }
        .hero-sub {
          font-size: 17px; line-height: 1.45;
          max-width: 460px; color: var(--muted);
          margin: 0 auto 28px;
        }
        .hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
        .btn {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 22px; border-radius: 999px;
          font-size: 15px; font-weight: 600;
          border: 1px solid transparent;
          transition: transform 150ms, box-shadow 150ms;
          cursor: pointer;
        }
        .btn:hover { transform: translateY(-1px); }
        .btn-primary { background: var(--accent); color: var(--ink); }
        .btn-ghost { border-color: var(--line); color: var(--ink); background: transparent; }
        .btn-ghost:hover { background: rgba(0,0,0,0.04); }
        .hero-promises {
          list-style: none; padding: 0;
          margin: 26px 0 0;
          display: flex; flex-wrap: wrap; gap: 20px;
          font-size: 13.5px; color: var(--muted);
          justify-content: center;
        }
        .hero-promises li { display: inline-flex; align-items: center; gap: 8px; }
        .promise-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
        .hero-carousel {
          margin-top: 52px;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
          width: 100%;
        }
        .hero-carousel-card {
          aspect-ratio: 3 / 4;
          border-radius: 18px;
          padding: 14px;
          display: flex; flex-direction: column; justify-content: space-between;
          text-align: left;
          transition: transform 250ms;
          cursor: pointer;
        }
        .hero-carousel-card:hover { transform: translateY(-6px) !important; }
        .hero-carousel-card-icon {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
        }
        .hero-carousel-name {
          font-family: 'Instrument Serif', serif;
          font-size: 17px; line-height: 1.05; letter-spacing: -0.01em;
        }

        /* ---- Trust row ---- */
        .trust-row {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          margin: 28px 0;
        }
        .trust-item {
          padding: 22px 24px;
          border-right: 1px solid var(--line);
          display: flex; align-items: center; gap: 16px;
        }
        .trust-item:last-child { border-right: none; }
        .trust-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(0,0,0,0.06);
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .trust-item:first-child .trust-icon { background: rgba(0,0,0,0.12); }
        .trust-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .trust-k {
          font-family: 'Instrument Serif', serif;
          font-size: 28px; letter-spacing: -0.02em; line-height: 1;
        }
        .trust-v { font-size: 13px; line-height: 1.3; color: var(--muted); }
        .trust-item:first-child .trust-v { color: var(--ink); }

        /* ---- Grid section ---- */
        .grid-section { padding: 56px 0 64px; }
        .grid-header {
          display: grid; grid-template-columns: 1.2fr 1fr;
          gap: 40px; align-items: end; margin-bottom: 36px;
        }
        .eyebrow {
          font-size: 12px; letter-spacing: 0.12em;
          text-transform: uppercase; font-weight: 600; color: var(--muted);
        }
        .section-title {
          font-family: 'Instrument Serif', serif;
          font-weight: 400;
          font-size: clamp(40px, 5vw, 68px);
          line-height: 0.96; letter-spacing: -0.02em;
          margin: 8px 0 0;
        }
        .grid-intro { font-size: 15.5px; line-height: 1.5; max-width: 460px; margin: 0; color: var(--muted); }
        .category-strip {
          display: flex; justify-content: space-between; align-items: center;
          gap: 16px; padding: 16px 0; margin-bottom: 24px;
          border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
          flex-wrap: wrap;
        }
        .category-strip-inner { display: flex; gap: 8px; flex-wrap: wrap; }
        .chip {
          padding: 8px 14px; border-radius: 999px;
          font-size: 13px; font-weight: 500;
          border: 1px solid transparent;
          transition: background 150ms, color 150ms;
          cursor: pointer; background: transparent;
        }
        .chip:hover { background: rgba(0,0,0,0.04); }
        .chip-active { background: var(--ink); color: var(--bg); font-weight: 600; }
        .chip-active:hover { background: var(--ink); opacity: 0.9; }
        .chip-inactive { border-color: var(--line); color: var(--muted); }
        .category-sort { display: inline-flex; gap: 6px; align-items: center; font-size: 13px; color: var(--muted); }
        .product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .grid-footer { display: flex; justify-content: center; margin-top: 40px; }
        .link-arrow {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 22px; border-radius: 999px;
          border: 1px solid var(--line); font-size: 14.5px; font-weight: 600;
          transition: background 150ms; color: var(--ink);
        }
        .link-arrow:hover { background: rgba(0,0,0,0.04); }

        /* ---- Product card ---- */
        .product-card {
          border-radius: 22px; padding: 14px;
          display: flex; flex-direction: column; gap: 14px;
          transition: transform 200ms ease, box-shadow 200ms ease;
          position: relative; overflow: hidden;
          text-decoration: none; color: inherit;
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -28px rgba(0,0,0,0.3);
        }
        .product-media {
          position: relative; aspect-ratio: 1 / 1;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.35);
        }
        .product-tag {
          position: absolute; top: 10px; left: 10px;
          font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
          font-weight: 600; padding: 4px 8px;
          background: rgba(0,0,0,0.06); border-radius: 999px;
        }
        .product-off {
          position: absolute; top: 10px; right: 10px;
          font-size: 11px; font-weight: 700; padding: 4px 8px;
          background: rgba(0,0,0,0.85); color: #fff; border-radius: 999px;
        }
        .product-icon-wrap {
          width: 70%; height: 70%;
          display: flex; align-items: center; justify-content: center;
          transition: transform 300ms;
        }
        .product-card:hover .product-icon-wrap { transform: scale(1.05) rotate(-2deg); }
        .product-meta { display: flex; flex-direction: column; gap: 4px; padding: 0 4px; }
        .product-name {
          font-family: 'Instrument Serif', serif;
          font-size: 22px; line-height: 1.02; letter-spacing: -0.015em;
        }
        .product-price-row { display: flex; align-items: baseline; gap: 8px; }
        .product-price { font-size: 15px; font-weight: 600; }
        .product-was { font-size: 12.5px; text-decoration: line-through; opacity: 0.5; }
        .product-cta {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-radius: 999px;
          font-size: 13px; font-weight: 600; color: #141414;
          background: var(--accent);
          transition: filter 150ms;
        }
        .product-card:hover .product-cta { filter: brightness(0.95); }

        /* ---- Responsive ---- */
        @media (max-width: 1100px) {
          .product-grid { grid-template-columns: repeat(3, 1fr); }
          .hero-carousel { grid-template-columns: repeat(3, 1fr); }
          .grid-header { grid-template-columns: 1fr; }
        }
        @media (max-width: 720px) {
          main { padding: 0 20px; }
          .pg-marquee { margin: 0 -20px; }
          .product-grid { grid-template-columns: repeat(2, 1fr); }
          .trust-row { grid-template-columns: repeat(2, 1fr); }
          .trust-item:nth-child(2n) { border-right: none; }
        }
      `}</style>

      {/* PROMO BAR */}
      <div className="promo-bar" style={{ background: "var(--strip-bg)", color: "var(--strip-ink)" }}>
        <span className="promo-dot" style={{ background: "var(--accent)" }} />
        <span>End-of-season clearance — up to <strong>60% off</strong></span>
        <span className="promo-sep">·</span>
        <span>Ends in <strong style={{ fontVariantNumeric: "tabular-nums" }}>{countdown}</strong></span>
      </div>

      {/* MARQUEE — yellow bg, uppercase */}
      <div className="pg-marquee">
        <div className="pg-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((m, i) => (
            <span key={i} className="pg-marquee-item">
              <span className="pg-marquee-bullet">✦</span>
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* HERO — centered layout */}
      <section className="hero">
        {/* Rating block */}
        <div className="hero-rating">
          <div className="hero-avatars">
            {[{ bg: "#E8C9B5" }, { bg: "#B8C7E8" }, { bg: "#D6BCE0" }, { bg: "#C7E0BC" }].map((a, i) => (
              <span key={i} style={{ background: a.bg }} />
            ))}
          </div>
          <div className="hero-stars">
            <svg width="78" height="14" viewBox="0 0 78 14"><g fill="#F5B400">
              {[0,1,2,3,4].map((i) => (
                <path key={i} transform={`translate(${i * 16} 0)`} d="M7 0 L8.6 4.6 L13.5 4.6 L9.6 7.6 L11 12.4 L7 9.5 L3 12.4 L4.4 7.6 L0.5 4.6 L5.4 4.6 Z" />
              ))}
            </g></svg>
          </div>
          <div className="hero-rating-meta">
            <strong>4.8</strong>
            <span>· 12,480 verified reviews</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="hero-headline">
          The good stuff,<br />
          <em>checked out</em> fast.
        </h1>

        <p className="hero-sub">
          Hand-picked gadgets at sharp prices. Free shipping over £40. Thirty-day money-back, no questions.
        </p>

        {/* CTAs */}
        <div className="hero-ctas">
          <Link to="/shop">
            <button className="btn btn-primary">
              Shop everything
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12 L19 12 M13 6 L19 12 L13 18" /></svg>
            </button>
          </Link>
          <Link to="/shop">
            <button className="btn btn-ghost">Best sellers</button>
          </Link>
        </div>

        {/* Promises */}
        <ul className="hero-promises">
          <li><span className="promise-dot" />Free shipping £40+</li>
          <li><span className="promise-dot" />30-day returns</li>
          <li><span className="promise-dot" />2-year warranty</li>
        </ul>

        {/* Hero carousel */}
        <div className="hero-carousel">
          {(carouselProducts.length > 0 ? carouselProducts : Array(6).fill(null)).map((p, i) => {
            const tint = CARD_TINTS[i % CARD_TINTS.length];
            return (
              <div
                key={p?.id ?? i}
                className="hero-carousel-card"
                style={{
                  background: tint.tint,
                  color: tint.ink,
                  transform: `translateY(${i % 2 ? 12 : -12}px) rotate(${(i - 2.5) * 1.5}deg)`,
                }}
                onClick={p ? () => handleAdd(p) : undefined}
              >
                <div className="hero-carousel-card-icon">
                  {p?.image_url ? (
                    <img src={p.image_url} alt={p.product_name} style={{ width: "55%", height: "55%", objectFit: "contain" }} />
                  ) : (
                    <svg viewBox="0 0 100 100" style={{ width: "55%", height: "55%", stroke: tint.ink, fill: "none", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }}>
                      <rect x="26" y="36" width="48" height="32" rx="4" />
                      <circle cx="50" cy="52" r="9" />
                      <circle cx="50" cy="52" r="4" />
                    </svg>
                  )}
                </div>
                <div className="hero-carousel-name">{p?.product_name ?? "Coming soon"}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TRUST ROW */}
      <section className="trust-row">
        {[
          {
            k: "4.8★", v: "across 12,480 reviews", yellow: true,
            icon: (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4 L19.2 11.4 L27 12.2 L21.2 17.4 L23 25 L16 21 L9 25 L10.8 17.4 L5 12.2 L12.8 11.4 Z"/>
              </svg>
            ),
          },
          {
            k: "30-day", v: "no-questions returns",
            icon: (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 14 A10 10 0 1 1 8 22"/>
                <path d="M3 10 L6 14 L10 11"/>
                <text x="16" y="20" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="Inter Tight, sans-serif" stroke="none" fill="currentColor">30</text>
              </svg>
            ),
          },
          {
            k: "2-yr", v: "warranty on everything",
            icon: (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4 L26 8 V15 C26 21 21 25.5 16 28 C11 25.5 6 21 6 15 V8 Z"/>
                <path d="M11.5 16 L14.5 19 L20.5 13"/>
              </svg>
            ),
          },
          {
            k: "Free", v: "shipping on £40 orders",
            icon: (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="9" width="14" height="11" rx="1.5"/>
                <path d="M17 12 L23 12 L27 16 V20 H17 Z"/>
                <circle cx="9" cy="22" r="2.4"/>
                <circle cx="22" cy="22" r="2.4"/>
                <path d="M3 13 H17"/>
              </svg>
            ),
          },
        ].map((it, i) => (
          <div key={i} className="trust-item" style={it.yellow ? { background: "var(--accent)", color: "var(--ink)" } : {}}>
            <div className="trust-icon">{it.icon}</div>
            <div className="trust-text">
              <div className="trust-k">{it.k}</div>
              <div className="trust-v">{it.v}</div>
            </div>
          </div>
        ))}
      </section>

      {/* THE SHELF — grid section */}
      <section className="grid-section" id="shop">
        <div className="grid-header">
          <div>
            <span className="eyebrow">The shelf</span>
            <h2 className="section-title">
              {shelfProducts.length > 0 ? `${shelfProducts.length} things` : "Things"}<br />
              worth checking out.
            </h2>
          </div>
          <p className="grid-intro">
            Curated weekly from thousands of gadgets — only the ones our team would actually buy. No drop-shipped duds, no fake reviews, no "as seen on TV" nonsense.
          </p>
        </div>

        {/* Category strip */}
        <div className="category-strip">
          <div className="category-strip-inner">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat}
                className={`chip ${activeCategory === cat ? "chip-active" : "chip-inactive"}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="category-sort">
            <span>Sorted by</span>
            <strong style={{ color: "var(--ink)" }}>Most loved</strong>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9 L12 15 L18 9"/></svg>
          </div>
        </div>

        {/* Product grid */}
        {shelfProducts.length === 0 ? (
          <p style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)", fontFamily: "'Instrument Serif', serif", fontSize: 28 }}>
            The shelf is being stocked — check back soon.
          </p>
        ) : (
          <div className="product-grid">
            {shelfProducts.map((p, idx) => (
              <CoProductCard key={p.id} product={p} index={idx} onAdd={() => handleAdd(p)} />
            ))}
          </div>
        )}

        {shelfProducts.length > 0 && (
          <div className="grid-footer">
            <Link to="/shop" className="link-arrow">
              Browse all {shelfProducts.length} products
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12 L19 12 M13 6 L19 12 L13 18"/></svg>
            </Link>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function CoProductCard({ product, index, onAdd }: { product: Product; index: number; onAdd: () => void }) {
  const { tint, ink } = CARD_TINTS[index % CARD_TINTS.length];
  const showSale = Number(product.price_1) > Number(product.price_2) && Number(product.price_2) > 0;
  const offPct = showSale ? Math.round((1 - Number(product.price_2) / Number(product.price_1)) * 100) : 0;

  return (
    <Link to="/products/$subdomain" params={{ subdomain: product.subdomain }} className="product-card" style={{ background: tint, color: ink }}>
      <div className="product-media">
        <span className="product-tag">{product.subdomain?.replace(/-/g, " ") || "Product"}</span>
        <div className="product-icon-wrap">
          {product.image_url ? (
            <img src={product.image_url} alt={product.product_name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", stroke: ink, fill: "none", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }}>
              <rect x="22" y="30" width="56" height="40" rx="4"/>
              <path d="M22 42 L78 42"/>
              <circle cx="66" cy="56" r="3"/>
            </svg>
          )}
        </div>
        {showSale && offPct > 0 && <span className="product-off">−{offPct}%</span>}
      </div>

      <div className="product-meta">
        <div className="product-name">{product.product_name}</div>
        <div className="product-price-row">
          <span className="product-price">£{Number(product.price_2).toFixed(2)}</span>
          {showSale && <span className="product-was">£{Number(product.price_1).toFixed(2)}</span>}
        </div>
      </div>

      <button
        className="product-cta"
        onClick={(e) => { e.preventDefault(); onAdd(); }}
        style={{ background: "var(--accent)", color: "#141414", border: "none", cursor: "pointer" }}
      >
        <span>Add to checkout</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12 L19 12 M13 6 L19 12 L13 18"/></svg>
      </button>
    </Link>
  );
}
