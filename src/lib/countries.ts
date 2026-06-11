// Central country config for the 5 supported checkout countries.
export type CountryCode = "uk" | "us" | "de" | "ca" | "au";

export type CountryConfig = {
  code: CountryCode;
  iso: "GB" | "US" | "DE" | "CA" | "AU";
  name: string;
  flag: string;
  currency: "GBP" | "USD" | "EUR" | "CAD" | "AUD";
  currency_symbol: string;
  phone_prefix: string;
  postcode_label: string;
};

export const SUPPORTED_COUNTRIES: CountryCode[] = ["uk", "us", "de", "ca", "au"];

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  uk: { code: "uk", iso: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", currency_symbol: "£",   phone_prefix: "+44", postcode_label: "Postcode" },
  us: { code: "us", iso: "US", name: "United States",  flag: "🇺🇸", currency: "USD", currency_symbol: "$",   phone_prefix: "+1",  postcode_label: "ZIP Code" },
  de: { code: "de", iso: "DE", name: "Germany",        flag: "🇩🇪", currency: "EUR", currency_symbol: "€",   phone_prefix: "+49", postcode_label: "PLZ" },
  ca: { code: "ca", iso: "CA", name: "Canada",         flag: "🇨🇦", currency: "CAD", currency_symbol: "CA$", phone_prefix: "+1",  postcode_label: "Postal Code" },
  au: { code: "au", iso: "AU", name: "Australia",      flag: "🇦🇺", currency: "AUD", currency_symbol: "AU$", phone_prefix: "+61", postcode_label: "Postcode" },
};

const ISO_TO_CODE: Record<string, CountryCode> = {
  GB: "uk", US: "us", DE: "de", CA: "ca", AU: "au",
};

export function isCountryCode(v: unknown): v is CountryCode {
  return typeof v === "string" && SUPPORTED_COUNTRIES.includes(v as CountryCode);
}

export function mapIsoToCode(iso?: string | null): CountryCode {
  if (iso && ISO_TO_CODE[iso.toUpperCase()]) return ISO_TO_CODE[iso.toUpperCase()];
  return "uk";
}

export function getCountry(code: CountryCode | string | null | undefined): CountryConfig {
  if (isCountryCode(code)) return COUNTRIES[code];
  return COUNTRIES.uk;
}
