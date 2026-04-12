/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#f3f1f8",
        surface: "#ffffff",
        panel: "#faf8fc",
        border: "#e2dce8",
        ink: "#16141d",
        accent: "#5c52d4",
        "accent-dim": "#4840b0",
        "accent-glow": "#7b74e0",
        cyan: { DEFAULT: "#0d9ec7", dim: "#0a7a99" },
        emerald: { DEFAULT: "#059669", dim: "#047857" },
        amber: { DEFAULT: "#d97706", dim: "#b45309" },
        rose: { DEFAULT: "#e11d48", dim: "#be123c" },
        muted: "#6b6578",
        subtle: "#ebe6f4",
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.3s ease forwards",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
