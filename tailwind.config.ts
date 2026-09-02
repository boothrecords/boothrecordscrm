import type { Config } from 'tailwindcss';

// Paleta base tomada de la referencia de diseño de Booth (fondo oscuro, acento
// naranja, degradados sutiles estilo "fintech"). Ajustar cuando se defina la
// guía de marca final.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        booth: {
          bg: '#0b0b0c',
          surface: '#18181a',
          rail: '#0d0d0f',
          panel: '#141416',
          border: '#2a2a2d',
          accent: '#ff6a1a',
          accentMuted: '#7a3a13',
          text: '#f5f5f5',
          textMuted: '#9a9a9d',
        },
      },
      borderRadius: {
        xl: '1.1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
