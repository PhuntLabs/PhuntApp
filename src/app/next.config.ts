
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/join/:serverId',
        destination: '/join/:serverId',
      },
       {
        source: '/discovery',
        destination: '/discovery',
      },
      {
        source: '/add-qolforu',
        destination: '/add-qolforu',
      },
       {
        source: '/api/agora/token',
        destination: '/api/agora/token',
      },
      {
        source: '/channels/me',
        destination: '/channels/me',
      },
      {
        source: '/turbo',
        destination: '/turbo',
      }
    ]
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.pngmart.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gofile.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.cdn.buymeacoffee.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;

