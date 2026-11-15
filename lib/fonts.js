// Available fonts that can be selected for a page in the admin panel.
// Keys are stored in the Page.fontFamily column; labels shown in the admin editor.
// `css` is the CSS font-family stack applied at render time. It references the
// CSS variables injected by next/font/google in the root layout (see app/layout.jsx).

export const FONT_OPTIONS = [
  { key: "inter", label: "Inter (default)", css: "var(--font-inter), system-ui, -apple-system, sans-serif" },
  { key: "roboto", label: "Roboto", css: "var(--font-roboto), system-ui, sans-serif" },
  { key: "open-sans", label: "Open Sans", css: "var(--font-open-sans), system-ui, sans-serif" },
  { key: "lato", label: "Lato", css: "var(--font-lato), system-ui, sans-serif" },
  { key: "nunito", label: "Nunito", css: "var(--font-nunito), system-ui, sans-serif" },
  { key: "poppins", label: "Poppins", css: "var(--font-poppins), system-ui, sans-serif" },
  { key: "montserrat", label: "Montserrat", css: "var(--font-montserrat), system-ui, sans-serif" },
  { key: "raleway", label: "Raleway", css: "var(--font-raleway), system-ui, sans-serif" },
  { key: "merriweather", label: "Merriweather", css: "var(--font-merriweather), Georgia, serif" },
  { key: "playfair", label: "Playfair Display", css: "var(--font-playfair), Georgia, serif" },
  { key: "system", label: "System Default", css: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
];

export const DEFAULT_FONT = "inter";

export function fontCss(key) {
  const hit = FONT_OPTIONS.find((f) => f.key === key);
  return (hit || FONT_OPTIONS.find((f) => f.key === DEFAULT_FONT)).css;
}