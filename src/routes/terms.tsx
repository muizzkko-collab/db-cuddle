import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — CheckoutHubs" },
      { name: "description", content: "Terms and conditions for using CheckoutHubs and purchasing products." },
    ],
  }),
  component: Terms,
});

function S({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

function Terms() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 1 January 2025</p>
        <p className="mt-6 text-muted-foreground">
          These terms govern your use of checkouthubs.com and any purchase made through our website. By using the site you agree to these terms.
        </p>

        <S title="Use of site">
          <p>You agree to use this site lawfully and not to misuse it (e.g. by introducing malware, attempting unauthorised access, or scraping content). We may suspend access if you breach these terms.</p>
        </S>

        <S title="Products">
          <p>We make reasonable efforts to display products accurately, but colours, sizes and descriptions may vary slightly. All product availability is subject to stock. We reserve the right to refuse or cancel any order at our discretion.</p>
        </S>

        <S title="Pricing and payment">
          <p>Prices are in GBP and include VAT where applicable. Delivery charges are shown at checkout. Payment is taken at the point of order. We accept major debit and credit cards via secure third-party payment processors.</p>
        </S>

        <S title="Delivery">
          <p>Delivery timelines are estimates. See our Shipping Policy for details. Risk of loss passes to you on delivery.</p>
        </S>

        <S title="Returns and refunds">
          <p>See our Refund Policy. Your statutory rights under the Consumer Rights Act 2015 and Consumer Contracts Regulations 2013 are not affected.</p>
        </S>

        <S title="Liability">
          <p>To the fullest extent permitted by law, our liability for any loss arising from your use of the site or purchase of products is limited to the price paid for the relevant product. Nothing in these terms limits our liability for death, personal injury caused by negligence, or fraud.</p>
        </S>

        <S title="Governing law">
          <p>These terms are governed by the laws of England and Wales. Disputes are subject to the exclusive jurisdiction of the courts of England and Wales.</p>
        </S>

        <S title="Contact">
          <p>Questions? Email <strong className="text-foreground">support@checkouthubs.com</strong>.</p>
        </S>
      </div>
    </SiteLayout>
  );
}
