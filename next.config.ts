import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // <--- A Mágica da RAM
  reactCompiler: true,
  images: {
    // Importante para economizar CPU no servidor se você usar o componente <Image> no futuro
    // Se estiver usando <img> normal (como está no seu código), isso não afeta tanto.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;