import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-sans)"], mono: ["var(--font-mono)"] },
      colors: { ink: "#183044", cream: "#fffaf0", coral: "#e76f51", teal: "#14675c" },
    },
  },
  plugins: [],
};

export default config;
