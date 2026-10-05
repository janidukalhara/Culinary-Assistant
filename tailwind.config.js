/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./App.tsx", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-primary": "#245b43",
        "brand-secondary": "#183f30",
        "dark-bg": "#f7f8f2",
        "dark-card": "#ffffff",
        "dark-surface": "#eaf0e5",
        "light-text": "#243a2f",
        "medium-text": "#526356",
        "subtle-text": "#667568",
      },
    },
  },
  plugins: [],
};
