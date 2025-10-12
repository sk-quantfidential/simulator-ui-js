import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/presentation/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme colors - war room aesthetic
        background: {
          DEFAULT: '#0a0e17',
          secondary: '#121825',
          tertiary: '#1a202e'
        },
        surface: {
          DEFAULT: '#1e2633',
          hover: '#252d3d',
          active: '#2c3545'
        },
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          light: '#60a5fa'
        },
        success: {
          DEFAULT: '#10b981',
          dark: '#059669',
          light: '#34d399'
        },
        warning: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
          light: '#fbbf24'
        },
        danger: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
          light: '#f87171'
        },
        text: {
          DEFAULT: '#e2e8f0',
          secondary: '#94a3b8',
          tertiary: '#64748b'
        },
        border: {
          DEFAULT: '#334155',
          light: '#475569'
        }
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 30px rgba(59, 130, 246, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
export default config
