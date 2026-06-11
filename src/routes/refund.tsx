import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — CheckoutHubs" },
      { name: "description", content: "Our 30-day money-back guarantee and return process." },
    ],
  }),
  component: Refund,
});

function S({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

function Refund() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground">Refund Policy</h1>
        <p className="mt-6 text-muted-foreground">
          We offer a 30-day money-back guarantee on all products. If you're not happy with your purchase, return it within 30 days of delivery for a full refund of the product price.
        </p>

        <S title="How to return an item">
          <p>Email <strong className="text-foreground">support@checkouthubs.com</strong> with your order number to start a return. We'll send you a return address and instructions. Please do not send items back without contacting us first.</p>
        </S>

        <S title="Condition of items">
          <p>Items must be returned in unused condition with all original packaging, tags and accessories. Items showing signs of use, damage or missing parts may be subject to a partial refund.</p>
        </S>

        <S title="Return shipping">
          <p>Unless the item is faulty or incorrectly supplied, return shipping costs are the customer's responsibility. We recommend using a tracked service as we are not responsible for items lost in transit.</p>
        </S>

        <S title="Refund timeline">
          <p>Once we receive and inspect your return, we'll process the refund within 3–5 business days to your original payment method. Your bank may take a further 2–3 days to show the funds.</p>
        </S>

        <S title="Your statutory rights">
          <p>This policy is in addition to your statutory rights under the Consumer Contracts Regulations 2013 and Consumer Rights Act 2015.</p>
        </S>
      </div>
    </SiteLayout>
  );
}
