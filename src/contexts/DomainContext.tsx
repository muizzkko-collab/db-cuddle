import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getRootDomain } from "@/lib/domain";

export type DomainBranding = {
  rootDomain: string;
  company_name: string;
  logo_url: string | null;
  brand_color: string | null;
  button_style: string | null;
  font_family: string | null;
  support_email: string | null;
  address: string | null;
  phone: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_image_url: string | null;
  gtm_id: string | null;
  meta_pixel_id: string | null;
};

const defaults: DomainBranding = {
  rootDomain: "checkouthub.com",
  company_name: "checkoutculture",
  logo_url: null,
  brand_color: "#2563eb",
  button_style: "rounded",
  font_family: null,
  support_email: null,
  address: null,
  phone: null,
  hero_headline: "Quality Products, Fast Delivery",
  hero_subheadline: "Trusted by thousands of customers across the UK",
  hero_image_url: null,
  gtm_id: null,
  meta_pixel_id: null,
};

const DomainContext = createContext<DomainBranding>(defaults);

export function DomainProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<DomainBranding>(defaults);

  useEffect(() => {
    const rootDomain = getRootDomain();
    supabase
      .from("domains" as any)
      .select("*")
      .eq("domain", rootDomain)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        if (!data) {
          setBranding({ ...defaults, rootDomain });
          return;
        }
        setBranding({
          rootDomain,
          company_name: data.company_name ?? defaults.company_name,
          logo_url: data.logo_url ?? null,
          brand_color: data.brand_color ?? defaults.brand_color,
          button_style: data.button_style ?? defaults.button_style,
          font_family: data.font_family ?? null,
          support_email: data.support_email ?? null,
          address: data.address ?? null,
          phone: data.phone ?? null,
          hero_headline: data.hero_headline ?? defaults.hero_headline,
          hero_subheadline: data.hero_subheadline ?? defaults.hero_subheadline,
          hero_image_url: data.hero_image_url ?? null,
          gtm_id: data.gtm_id ?? null,
          meta_pixel_id: data.meta_pixel_id ?? null,
        });
      });
  }, []);

  return <DomainContext.Provider value={branding}>{children}</DomainContext.Provider>;
}

export function useDomain() {
  return useContext(DomainContext);
}
