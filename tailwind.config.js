/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      colors: {
        base: {
          950: "#020617",
          900: "#0a0f1f",
          800: "#111827",
        },
        signal: {
          indigo: "#6366f1",
          violet: "#a855f7",
          cyan: "#22d3ee",
          magenta: "#f472b6",
          gold: "#fbbf24",
        },
      },
      boxShadow: {
        glow: "0 0 20px -2px rgba(99, 102, 241, 0.55)",
        "glow-cyan": "0 0 24px -4px rgba(34, 211, 238, 0.6)",
        "glow-gold": "0 0 30px -4px rgba(251, 191, 36, 0.65)",
      },
      backgroundImage: {
        "signal-gradient":
          "linear-gradient(135deg, #6366f1 0%, #a855f7 55%, #22d3ee 100%)",
      },
      keyframes: {
        "border-flow": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "border-flow": "border-flow 6s ease infinite",
        "rise-in": "rise-in 0.5s ease forwards",
      },
    },
  },
  plugins: [],
};
