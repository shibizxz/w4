/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0B0F1A",
        primary: "#00C896",
        card: "#1E2A3A",
        muted: "#9CA3AF",
      },
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        soft: "0 24px 80px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top right, rgba(0, 200, 150, 0.18), transparent 42%), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.12), transparent 30%)",
      },
    },
  },
  plugins: [],
};
