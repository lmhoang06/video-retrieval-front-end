export function toNumberSafe(v) {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function sortByFrameNameAsc(a, b) {
  const an = toNumberSafe(a?.frameName);
  const bn = toNumberSafe(b?.frameName);
  if (an != null && bn != null) return an - bn;
  // Fallback to string compare if non-numeric
  const as = String(a?.frameName ?? "");
  const bs = String(b?.frameName ?? "");
  return as.localeCompare(bs, undefined, { numeric: true, sensitivity: "base" });
}

export function groupByVideoName(images) {
  const groups = new Map();
  for (const img of images || []) {
    const key = img?.videoName || "(unknown)";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(img);
  }
  const result = [];
  for (const [key, items] of groups.entries()) {
    items.sort(sortByFrameNameAsc);
    result.push({ key, label: key, count: items.length, items });
  }
  // sort groups by label alphabetically, case-insensitive natural
  result.sort((g1, g2) => g1.label.localeCompare(g2.label, undefined, { numeric: true, sensitivity: "base" }));
  return result;
}
