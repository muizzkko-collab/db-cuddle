import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useCart } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/cart-drawer";
import { useDomain } from "@/contexts/DomainContext";

const THEME_VARS = `
  --ch-bg: #F4EFE7;
  --ch-bg-elev: #FAF6EE;
  --ch-surface: #FFFFFF;
  --ch-ink: #1F1C17;
  --ch-ink-2: #4B463E;
  --ch-ink-3: #8C8478;
  --ch-hair: #E5DED1;
  --ch-accent: #6C7C5E;
  --ch-accent-2: #C77A56;
  --ch-accent-soft: #D8E0CC;
  --ch-serif: 'Instrument Serif', Georgia, serif;
`;

function Nav() {
  const { cartCount, openCart } = useCart();
  const { company_name, logo_url } = useDomain();
  return (
    <header
      style={{
        background: "var(--ch-bg)",
        borderBottom: "1px solid var(--ch-hair)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: 1320,
          padding: "0 40px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          height: 76,
        }}
      >
        <nav style={{ display: "flex", gap: 32, fontSize: 13, fontWeight: 500 }}>
          <Link to="/shop" style={{ color: "var(--ch-ink)", padding: "4px 0" }}>Shop</Link>
          <Link to="/about" style={{ color: "var(--ch-ink)", padding: "4px 0" }}>About</Link>
          <Link to="/contact" style={{ color: "var(--ch-ink)", padding: "4px 0" }}>Contact</Link>
        </nav>
        <Link
          to="/"
          style={{
            fontFamily: "var(--ch-serif)",
            fontSize: 26,
            letterSpacing: "0.01em",
            textAlign: "center",
            color: "var(--ch-ink)",
          }}
        >
          {logo_url ? (
            <img src={logo_url} alt={company_name} style={{ height: 32, width: "auto", margin: "0 auto" }} />
          ) : (() => {
            // Italicize the last "word" of the brand for the editorial split logo effect.
            // e.g. "checkoutculture" → "checkout" + italic "culture"
            const m = company_name.match(/^(.*?)(culture|hub|store|shop|club|co)$/i);
            if (m) return <>{m[1]}<i style={{ color: "var(--ch-accent)", fontStyle: "italic" }}>{m[2]}</i></>;
            return <>{company_name}</>;
          })()}
        </Link>
        <div style={{ display: "flex", gap: 18, justifyContent: "flex-end", alignItems: "center" }}>
          <button
            onClick={openCart}
            aria-label="Open cart"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--ch-ink)",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              border: 0,
              cursor: "pointer",
            }}
          >
            Bag
            {cartCount > 0 && (
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "var(--ch-accent-2)",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { company_name, support_email, address } = useDomain();
  return (
    <footer style={{ background: "var(--ch-ink)", color: "#D7CFC0", padding: "80px 0 32px", marginTop: 80 }}>
      <div
        className="mx-auto"
        style={{
          maxWidth: 1320,
          padding: "0 40px",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          gap: 48,
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--ch-serif)", fontSize: 36, color: "#fff", lineHeight: 1, marginBottom: 16 }}>
            {(() => {
              const m = company_name.match(/^(.*?)(culture|hub|store|shop|club|co)$/i);
              if (m) return <>{m[1]}<i style={{ color: "var(--ch-accent-soft)", fontStyle: "italic" }}>{m[2]}</i></>;
              return <>{company_name}</>;
            })()}
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.55, maxWidth: 280, color: "#B8AE9C" }}>
            Curated products that work — tested for real life, backed by guarantee.
          </p>
          {support_email && <p style={{ marginTop: 16, fontSize: 12, color: "#B8AE9C" }}>{support_email}</p>}
          {address && <p style={{ marginTop: 4, fontSize: 12, color: "#B8AE9C" }}>{address}</p>}
        </div>

        {[
          { h: "Shop", links: [["Shop all", "/shop"], ["About", "/about"], ["Contact", "/contact"]] },
          { h: "Help", links: [["Shipping", "/shipping"], ["Returns", "/refund"], ["Track order", "/track"]] },
          { h: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"], ["Refund Policy", "/refund"]] },
        ].map((col) => (
          <div key={col.h}>
            <h5 style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#fff", margin: "0 0 18px", fontWeight: 600 }}>{col.h}</h5>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {col.links.map(([label, to]) => (
                <li key={to} style={{ marginBottom: 12 }}>
                  <Link to={to} style={{ fontSize: 13, color: "#B8AE9C", textDecoration: "none" }}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        className="mx-auto"
        style={{
          maxWidth: 1320,
          padding: "24px 40px 0",
          marginTop: 64,
          borderTop: "1px solid #2c2820",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#6f6757",
        }}
      >
        <span>© {new Date().getFullYear()} {company_name}. All rights reserved.</span>
        <span>Made with care · UK</span>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="ch-store"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--ch-bg)",
        color: "var(--ch-ink)",
        fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        .ch-store { ${THEME_VARS} font-size: 15px; line-height: 1.55; }
        .ch-store a { color: inherit; text-decoration: none; }
        .ch-store h1, .ch-store h2, .ch-store h3, .ch-store h4 { color: var(--ch-ink); }
      `}</style>
      <Nav />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
