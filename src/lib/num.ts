/**
 * Reads a typed number, taking "7,5" (iPhone decimal keypads in comma locales) the same as "7.5".
 * With `integer`, "10.000" or "10,000" reads as ten thousand. Null if blank or not a number.
 */
export function parseNum(text: string, integer = false): number | null {
  let t = text.trim().replace(/\s/g, '')
  if (!t) return null
  if (integer && /^\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, '')
  else t = t.replace(',', '.')
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}
