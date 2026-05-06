// Convert USD prices from Fake Store API to Rwandan Francs (approximate)
export const RWF_PER_USD = 1340;

export function toRWF(usd: number): number {
  return Math.round(usd * RWF_PER_USD);
}

export function formatRWF(usd: number): string {
  const rwf = toRWF(usd);
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(rwf);
}

export function shortTitle(title: string, max = 60): string {
  return title.length > max ? title.slice(0, max - 1) + "…" : title;
}

export function categoryLabel(slug: string): string {
  return slug
    .split(/[\s'-]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}
