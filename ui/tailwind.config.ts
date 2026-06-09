import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', hover: '#1d4ed8' },
        bg: { light: '#ffffff', dark: '#0f172a' },
        surface: { light: '#f8fafc', dark: '#1e293b' },
        border: { light: '#e2e8f0', dark: '#334155' },
        text: {
          primary: { light: '#0f172a', dark: '#f8fafc' },
          secondary: { light: '#475569', dark: '#94a3b8' },
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;