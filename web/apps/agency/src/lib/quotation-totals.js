export function lineTotal(item) {
  const q = Number(item?.quantity ?? 0);
  const p = Number(item?.unitPrice ?? 0);
  if (!Number.isFinite(q) || !Number.isFinite(p)) return 0;
  return Math.round(q * p * 100) / 100;
}

export function itemsTotal(items) {
  return Math.round((items ?? []).reduce((sum, item) => sum + lineTotal(item), 0) * 100) / 100;
}
