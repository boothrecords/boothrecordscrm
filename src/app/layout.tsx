import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Booth Platform',
  description: 'CRM de Booth para bases de datos de eventos y campañas de WhatsApp y email.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>{children}</body>
    </html>
  );
}
