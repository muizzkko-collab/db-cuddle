export const statusBadge = (s?: string | null) => {
  const v = (s ?? "pending").toLowerCase();
  const map: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700",
    paid: "bg-green-100 text-green-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-emerald-200 text-emerald-900",
    refunded: "bg-red-100 text-red-700",
  };
  return map[v] ?? "bg-gray-100 text-gray-700";
};

export const fmtCurrency = (n: number, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(n || 0);

export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—";

export const toCSV = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
};

export const downloadCSV = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
