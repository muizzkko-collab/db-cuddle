import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping Policy — CheckoutHubs" },
      { name: "description", content: "UK and international shipping options, delivery times and tracking." },
    ],
  }),
  component: Shipping,
});

function S({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

function Shipping() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground">Shipping Policy</h1>
        <p className="mt-6 text-muted-foreground">
          We dispatch orders Monday to Friday from our UK warehouse. Orders placed before 2pm GMT are typically shipped the same day.
        </p>

        <S title="UK delivery">
          <p>Standard UK delivery takes 3–5 business days. Shipping is <strong className="text-foreground">free on all orders over £50</strong>. Orders under £50 are charged a flat rate at checkout.</p>
        </S>

        <S title="International delivery">
          <p>We ship to most international destinations. Delivery typically takes 7–14 business days depending on the destination. Shipping costs are calculated at checkout based on weight and location.</p>
        </S>

        <S title="Order tracking">
          <p>Once your order is dispatched you'll receive a confirmation email with a tracking number and a link to follow your parcel. If you haven't received tracking within 2 business days, contact us at <strong className="text-foreground">support@checkouthubs.com</strong>.</p>
        </S>

        <S title="Customs and duties">
          <p>International orders may be subject to customs duties, import taxes or other fees charged by the destination country. These are the responsibility of the recipient and are not included in the product or shipping price.</p>
        </S>
      </div>
    </SiteLayout>
  );
}
