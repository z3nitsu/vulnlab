import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          primary: "#2563eb",
          dark: "#1d4ed8",
          light: "#60a5fa",
        },
        surface: {
          DEFAULT: "#0f172a",
          muted: "#111827",
          panel: "#1e293b",
        },
      },
      boxShadow: {
        panel: "0 2px 20px rgba(15, 23, 42, 0.35)",
      },
    },
  },
  plugins: [forms],
}
