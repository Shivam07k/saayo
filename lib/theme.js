export const DEFAULT_BRAND = "#0ea5e9";

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

export function hexToRgb(hex) {
  let h = String(hex || "").replace("#", "").trim();
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  const n = parseInt(h, 16);
  if (Number.isNaN(n) || h.length !== 6) {
    return hexToRgb(DEFAULT_BRAND);
  }
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function blend(base, target, t) {
  return base
    .map((v, i) => Math.round(v + (target[i] - v) * t))
    .join(" ");
}

// Turn a single hex color into a full Tailwind-style brand palette (50..950),
// where each shade is a space-separated "R G B" triplet for CSS var usage.
export function brandShades(hex = DEFAULT_BRAND) {
  const base = hexToRgb(hex);
  return {
    50: blend(base, WHITE, 0.92),
    100: blend(base, WHITE, 0.82),
    200: blend(base, WHITE, 0.62),
    300: blend(base, WHITE, 0.42),
    400: blend(base, WHITE, 0.22),
    500: base.join(" "),
    600: blend(base, BLACK, 0.18),
    700: blend(base, BLACK, 0.34),
    800: blend(base, BLACK, 0.52),
    900: blend(base, BLACK, 0.66),
    950: blend(base, BLACK, 0.85),
  };
}

export function brandThemeCss(hex = DEFAULT_BRAND) {
  const shades = brandShades(hex);
  const vars = Object.entries(shades)
    .map(([shade, rgb]) => `--brand-${shade}: ${rgb};`)
    .join("");
  return `:root{${vars}}`;
}