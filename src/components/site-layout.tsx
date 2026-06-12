import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useCart } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/cart-drawer";
import { useDomain } from "@/contexts/DomainContext";
import { supabase } from "@/integrations/supabase/client";

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Inter Tight', 'Inter', system-ui, -apple-system, sans-serif;
    background: var(--bg, #FAF7F0);
    color: var(--ink, #1A1A1A);
    -webkit-font-smoothing: antialiased;
    font-feature-settings: 'ss01','cv11';
  }
  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }

  .co-page {
    --bg: #FAF7F0;
    --surface: #FFFFFF;
    --ink: #1A1A1A;
    --muted: #766E63;
    --line: rgba(20,20,20,0.08);
    --accent: #F5C242;
    --strip-bg: #1F1A2A;
    --strip-ink: #FAF7F0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    color: var(--ink);
  }

  /* ----- Nav ----- */
  .co-nav {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0 44px;
    height: 68px;
    gap: 24px;
    border-bottom: 1px solid var(--line);
    background: var(--bg);
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .co-brand { display: inline-flex; align-items: center; gap: 10px; }
  .co-brand-mark {
    width: 30px; height: 30px;
    border-radius: 9px;
    background: var(--accent);
    color: #141414;
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .co-brand-name {
    font-family: 'Instrument Serif', 'Times New Roman', serif;
    font-size: 24px;
    letter-spacing: -0.01em;
    font-style: italic;
    font-weight: 400;
    color: var(--ink);
  }
  .co-nav-links {
    display: flex;
    gap: 28px;
    font-size: 14.5px;
    font-weight: 500;
    justify-self: center;
    align-items: center;
  }
  .co-nav-links a { display: inline-flex; align-items: center; gap: 6px; opacity: 0.92; transition: opacity 150ms; }
  .co-nav-links a:hover { opacity: 1; }
  .co-nav-pill {
    font-size: 10.5px;
    padding: 1px 6px;
    border-radius: 999px;
    font-weight: 700;
    background: var(--accent);
    color: #141414;
  }
  .co-nav-actions { display: flex; gap: 8px; justify-self: end; align-items: center; }
  .co-icon-btn {
    width: 38px; height: 38px;
    border-radius: 12px;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid var(--line);
    position: relative;
    background: transparent;
    cursor: pointer;
    transition: background 150ms;
  }
  .co-icon-btn:hover { background: rgba(0,0,0,0.04); }
  .co-bag-count {
    position: absolute;
    top: -4px; right: -4px;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 999px;
    min-width: 16px; height: 16px;
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--accent);
    color: #141414;
  }

  /* ----- Footer ----- */
  .co-footer {
    border-top: 1px solid var(--line);
    padding: 56px 44px 28px;
    margin-top: 24px;
    background: var(--bg);
  }
  .co-footer-top {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 60px;
    margin-bottom: 48px;
  }
  .co-footer-tag {
    font-size: 14.5px;
    line-height: 1.5;
    max-width: 380px;
    margin: 18px 0 22px;
    color: var(--muted);
  }
  .co-newsletter { display: flex; gap: 8px; max-width: 420px; }
  .co-newsletter input {
    flex: 1;
    padding: 12px 16px;
    border-radius: 999px;
    border: 1px solid var(--line);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    background: var(--surface);
    color: var(--ink);
  }
  .co-newsletter input:focus { border-color: var(--ink); }
  .co-newsletter button {
    padding: 12px 18px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    background: var(--accent);
    color: #141414;
    border: none;
  }
  .co-footer-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
  .co-footer-col h4 {
    font-size: 13px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin: 0 0 14px;
    color: var(--ink);
  }
  .co-footer-col a {
    display: block;
    font-size: 14.5px;
    padding: 5px 0;
    color: var(--muted);
    transition: color 150ms;
  }
  .co-footer-col a:hover { color: var(--ink); }
  .co-footer-bottom {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 22px;
    border-top: 1px solid var(--line);
    font-size: 13px;
    color: var(--muted);
    flex-wrap: wrap;
    gap: 16px;
  }
  .co-payments { display: inline-flex; gap: 6px; }
  .co-pay-chip {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 5px 8px;
    border: 1px solid var(--line);
    border-radius: 6px;
    opacity: 0.7;
  }

  /* ----- Responsive ----- */
  @media (max-width: 1100px) {
    .co-footer-top { grid-template-columns: 1fr; }
  }
  @media (max-width: 720px) {
    .co-nav { padding: 0 20px; grid-template-columns: 1fr auto; }
    .co-nav-links { display: none; }
    .co-footer { padding-left: 20px; padding-right: 20px; }
    .co-footer-cols { grid-template-columns: repeat(2, 1fr); }
  }
`;

function CoNav() {
  const { cartCount, openCart } = useCart();
  const { company_name } = useDomain();

  const brandName = company_name || "checkoutr";

  return (
    <header className="co-nav">
      <Link to="/" className="co-brand">
        <span className="co-brand-mark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12 L10 17 L20 6" />
          </svg>
        </span>
        <span className="co-brand-name">{brandName}</span>
      </Link>

      <div className="co-nav-links">
        <Link to="/shop">Shop</Link>
        <a href="#new">New <span className="co-nav-pill">14</span></a>
        <a href="#deals">Deals</a>
        <a href="#track">Track order</a>
        <a href="#help">Help</a>
      </div>

      <div className="co-nav-actions">
        <button className="co-icon-btn" aria-label="Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21 L16 16" />
          </svg>
        </button>
        <button className="co-icon-btn" aria-label="Bag" onClick={openCart} style={{ position: "relative" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8 L18 8 L19 20 L5 20 Z" />
            <path d="M9 8 V6 a3 3 0 0 1 6 0 V8" />
          </svg>
          {cartCount > 0 && <span className="co-bag-count">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}

function CoFooter() {
  const { company_name, rootDomain } = useDomain();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await supabase.from("newsletter_signups" as any).insert({ email: email.trim(), root_domain: rootDomain });
    setSent(true);
    setEmail("");
  };

  const brandName = company_name || "checkoutr";

  return (
    <footer className="co-footer">
      <div className="co-footer-top">
        <div>
          <Link to="/" className="co-brand" style={{ display: "inline-flex", marginBottom: 0 }}>
            <span className="co-brand-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12 L10 17 L20 6" />
              </svg>
            </span>
            <span className="co-brand-name" style={{ marginLeft: 10 }}>{brandName}</span>
          </Link>
          <p className="co-footer-tag">
            Gear that actually works, at prices that don't insult you. Shipped worldwide.
          </p>
          {sent ? (
            <p style={{ fontSize: 13, color: "green", fontWeight: 600 }}>✓ You're subscribed — check your inbox for the code.</p>
          ) : (
            <form onSubmit={handleNewsletter} className="co-newsletter">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
              />
              <button type="submit">Get £10 off</button>
            </form>
          )}
        </div>

        <div className="co-footer-cols">
          <div className="co-footer-col">
            <h4>Shop</h4>
            <Link to="/shop">New arrivals</Link>
            <Link to="/shop">Best sellers</Link>
            <Link to="/shop">Under £50</Link>
            <a href="#">Gift cards</a>
          </div>
          <div className="co-footer-col">
            <h4>Help</h4>
            <a href="#">Track order</a>
            <a href="#">Returns</a>
            <a href="#">Shipping</a>
            <a href="#">Contact</a>
          </div>
          <div className="co-footer-col">
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <a href="#">Press</a>
            <a href="#">Affiliates</a>
            <a href="#">Careers</a>
          </div>
        </div>
      </div>

      <div className="co-footer-bottom">
        <span>© {new Date().getFullYear()} {brandName} · All rights reserved.</span>
        <span className="co-payments">
          {["VISA", "MC", "AMEX", "PAYPAL", "APPLE PAY"].map((p) => (
            <span key={p} className="co-pay-chip">{p}</span>
          ))}
        </span>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="co-page">
      <style>{GLOBAL_CSS}</style>
      <CoNav />
      <main style={{ flex: 1 }}>{children}</main>
      <CoFooter />
      <CartDrawer />
    </div>
  );
}
