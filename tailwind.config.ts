import type { Config } from 'tailwindcss';

// Paleta base tomada de la referencia de diseño de Booth (fondo oscuro, acento naranja).
// Ajustar estos valores cuando se defina la guía de marca final.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        booth: {
          bg: '#0f0f10',
          surface: '#18181a',
          border: '#2a2a2d',
          accent: '#ff6a1a',
          accentMuted: '#7a3a13',
          text: '#f5f5f5',
          textMuted: '#9a9a9d',
        },
      },
      borderRadius: {
        xl: '0.875rem',
      },
    },
  },
  plugins: [],
};

export default config;
