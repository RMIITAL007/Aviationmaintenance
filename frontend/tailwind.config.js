/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aviation: {
          dark: '#0a0f1d',
          navy: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#0284c7',
          blue: '#2563eb',
          light: '#f8fafc',
          muted: '#94a3b8'
        }
      }
    },
  },
  plugins: [],
}
