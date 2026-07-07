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
        "home-dark": "#1A1D25",
        "home-dark-elevated": "#161a22",
        "home-blue": "#344B6F",
        "home-gray": "#5D708B",
        "home-light": "#EAEAEA",
        "home-muted": "#9ca3af",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-up": "slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "scale-in": "scale-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
