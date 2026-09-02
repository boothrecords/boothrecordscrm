/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // permite subir CSV/XLSX grandes en la importación de contactos
    },
  },
};

export default nextConfig;
