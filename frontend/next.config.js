/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'i.ibb.co', 'ibb.co', 'ra7ba-backend-9tyo.onrender.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'vercel.com',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ra7ba-backend-9tyo.onrender.com',
      },
    ],
  },
  async rewrites() {
    const raw = process.env.NEXT_PUBLIC_API_URL;
    const invalid = !raw || raw === 'undefined' || raw === 'null' || raw.trim() === '' || /your-backend/i.test(raw) || /localhost/i.test(raw) || /127\.0\.0\.1/i.test(raw);
    const apiUrl = invalid ? 'https://ra7ba-backend-9tyo.onrender.com/api' : raw;

    console.log('✅ API rewrites enabled for:', apiUrl);
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
