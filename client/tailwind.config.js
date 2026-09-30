/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}", "../shared/**/*.js"],
  theme: {
    extend: {
      colors: {
        // Brand navy — exact value from the company logo: #2E2C75
        navy: {
          50: "#f2f2f9",
          100: "#e4e4f3",
          200: "#c8c7e6",
          300: "#a3a1d5",
          400: "#7a77c0",
          500: "#5653a5",
          600: "#3f3c8b",
          700: "#2e2c75",
          800: "#26245f",
          900: "#1b1a45",
        },
        // Brand orange — exact value from the company logo: #F16629
        orange: {
          50: "#fff5ee",
          100: "#ffe8d8",
          200: "#ffcfaf",
          300: "#ffab7b",
          400: "#fa8347",
          500: "#f16629",
          600: "#dc4f14",
          700: "#b63c12",
          800: "#903116",
          900: "#752c15",
        },
        ink: {
          500: "#64748b",
          700: "#334155",
          900: "#141338",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      backgroundImage: {
        "mesh-light":
          "radial-gradient(at 12% 8%, rgba(160,158,222,0.30) 0px, transparent 55%), radial-gradient(at 88% 4%, rgba(255,171,120,0.26) 0px, transparent 50%), radial-gradient(at 70% 70%, rgba(46,44,117,0.10) 0px, transparent 55%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(20, 19, 56, 0.08)",
        lift: "0 20px 48px -18px rgba(241, 102, 41, 0.45)",
        liftNavy: "0 20px 48px -18px rgba(46, 44, 117, 0.45)",
      },
      transitionTimingFunction: {
        // A gentle deceleration curve — noticeably smoother than the browser
        // default `ease` on hovers and lifts. Same curve Reveal.jsx already
        // uses for scroll-in motion, so CSS and Framer Motion transitions
        // now feel like the same hand drew both.
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        350: "350ms",
        450: "450ms",
        600: "600ms",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        marquee: "marquee 32s linear infinite",
        heartbeat: "marquee 2.4s linear infinite",
        "toast-in": "toast-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
