/** @type {import('next').NextConfig} */
const nextConfig = {
  staticPageGenerationTimeout: 180,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'rainbowdevs.com'
      },
      {
        protocol: 'https',
        hostname: 'www.rainbowdevs.com'
      },
      {
        protocol: 'https',
        hostname: 'whackahack.com'
      },
      {
        protocol: 'https',
        hostname: 'www.whackahack.com'
      },
      {
        protocol: 'https',
        hostname: 'pokeharbor.com'
      },
      {
        protocol: 'https',
        hostname: 'www.pokeharbor.com'
      },
      {
        protocol: 'https',
        hostname: 'assets.pokemon.com'
      },
      {
        protocol: 'https',
        hostname: 'archives.bulbagarden.net'
      },
      {
        protocol: 'https',
        hostname: 'm.archives.bulbagarden.net'
      },
      {
        protocol: 'https',
        hostname: 'assets-prd.ignimgs.com'
      },
      {
        protocol: 'https',
        hostname: 'assets1.ignimgs.com'
      },
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io'
      },
      {
        protocol: 'https',
        hostname: 'images.scrydex.com'
      },
      {
        protocol: 'https',
        hostname: 'assets.tcgdex.net'
      },
      {
        protocol: 'https',
        hostname: 'www.serebii.net'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com'
      }
    ]
  }
};

export default nextConfig;
