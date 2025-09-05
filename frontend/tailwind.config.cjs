/** Tailwind v3 config (Angular 20) */
module.exports = {
  content: ["./src/**/*.{html,ts,scss,css}"],
  theme: {
    extend: {
      boxShadow: { soft: "0 2px 12px rgba(0,0,0,0.24)" },
      colors: {
        tvbg: "#0d1116",
        tvsurface: "#111418",
        tvborder: "#232a32",
        tvtext: "#e6e8eb",
        tvmuted: "#9aa4ad",
        tvaccent: "#06b6d4"
      }
    }
  },
  plugins: []
};
