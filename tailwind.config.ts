import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core System Tokens
        primary: "#000000",
        "on-primary": "#ffffff",
        "accent-blue": "#2b89ff",
        ink: "#ffffff",
        "ink-muted": "#b2b6bd",
        "ink-subtle": "#656a76",
        canvas: "#000000",
        "surface-1": "#15181e",
        "surface-2": "#1f232b",
        "surface-3": "#3b3d45",
        hairline: "#3b3d45",
        "hairline-soft": "#252830",
        "inverse-canvas": "#ffffff",
        "inverse-ink": "#000000",

        // Semantic & Accents
        "semantic-success": "#10b981",
        "semantic-warning": "#f59e0b",
        "semantic-error": "#ef4444",

        // Compatibility aliases
        background: "#000000",
        foreground: "#ffffff",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        hashicorpSans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-xl": ["80px", { lineHeight: "1.17", letterSpacing: "-2.5px", fontWeight: "700" }],
        "display-lg": ["56px", { lineHeight: "1.18", letterSpacing: "-1.6px", fontWeight: "700" }],
        "display-md": ["40px", { lineHeight: "1.19", letterSpacing: "-1.0px", fontWeight: "600" }],
        headline: ["28px", { lineHeight: "1.21", letterSpacing: "-0.6px", fontWeight: "600" }],
        "card-title": ["22px", { lineHeight: "1.18", letterSpacing: "-0.4px", fontWeight: "600" }],
        subhead: ["20px", { lineHeight: "1.35", letterSpacing: "-0.2px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "1.69", letterSpacing: "0", fontWeight: "500" }],
        body: ["16px", { lineHeight: "1.50", letterSpacing: "0", fontWeight: "500" }],
        "body-sm": ["14px", { lineHeight: "1.71", letterSpacing: "0", fontWeight: "500" }],
        caption: ["13px", { lineHeight: "1.38", letterSpacing: "0.2px", fontWeight: "500" }],
        button: ["14px", { lineHeight: "1.29", letterSpacing: "0", fontWeight: "600" }],
        eyebrow: ["12px", { lineHeight: "1.23", letterSpacing: "0.6px", fontWeight: "600" }],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        xxl: "24px",
        pill: "9999px",
      },
      spacing: {
        hair: "1px",
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "96px",
      },
      letterSpacing: {
        eyebrow: "0.6px",
        tightest: "-2.5px",
        tighter: "-1.6px",
        tight: "-1.0px",
      },
    },
  },
  plugins: [],
};

export default config;
