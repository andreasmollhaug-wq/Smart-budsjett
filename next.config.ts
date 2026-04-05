import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /** Mindre risiko for rare HMR-feil når Supabase ikke bundler inn på nytt ved hver endring. */
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  async redirects() {
    return [
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
