import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /**
   * Unngår cross-origin-advarsel når dev-server åpnes via 127.0.0.1 mens klient forventer localhost (eller omvendt).
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
   */
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  /** Mindre risiko for rare HMR-feil når Supabase ikke bundler inn på nytt ved hver endring. */
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  async redirects() {
    return [
      /** Mange klienter ber om /favicon.ico; vi bruker dynamisk /icon (ImageResponse). */
      {
        source: '/favicon.ico',
        destination: '/icon',
        permanent: false,
      },
      {
        source: '/rapporter/sparemål',
        destination: '/rapporter/sparemal',
        permanent: true,
      },
      {
        source: '/claude',
        destination: '/enkelexcel-ai',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
