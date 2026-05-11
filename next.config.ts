import type { NextConfig } from 'next'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'

const shared: NextConfig = {
  /**
   * Reduserer støy fra Webpack 5 filesystem-cache (`PackFileCacheStrategy` / «Serializing big strings»).
   * Advarselen påvirker først og fremst cache-deserialisering i dev og er vanligvis harmløs.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        level: 'error',
      }
    }
    return config
  },
  /**
   * Unngår cross-origin-advarsel når dev-server åpnes via 127.0.0.1 mens klient forventer localhost (eller omvendt).
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
   */
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  /** Mindre risiko for rare HMR-feil når Supabase ikke bundler inn på nytt ved hver endring. */
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
  /** Tillatte `quality`-verdier for `next/image` (nyere Next krever eksplisitt liste). */
  images: {
    qualities: [75, 90, 95],
  },
  async redirects() {
    return [
      /** Klienter som fortsatt ber om rot-«favicon.ico» får PNG med etablert type (ingen tom .ico-fil i public/). */
      {
        source: '/favicon.ico',
        destination: '/pwa-icon-192.png?v=fav02',
        permanent: false,
      },
      {
        source: '/dottir',
        destination: '/',
        permanent: true,
      },
      {
        source: '/dottir/om-oss',
        destination: '/om-oss',
        permanent: true,
      },
      {
        source: '/dottir/utforsk',
        destination: '/utforsk',
        permanent: true,
      },
      {
        source: '/preview/dottir',
        destination: '/',
        permanent: true,
      },
      {
        source: '/preview/dottir/om-oss',
        destination: '/om-oss',
        permanent: true,
      },
      {
        source: '/preview/dottir/utforsk',
        destination: '/utforsk',
        permanent: true,
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
      {
        source: '/sparing/innspurt',
        destination: '/sparing/smartspare',
        permanent: true,
      },
      {
        source: '/intern/prosjekt',
        destination: '/prosjekt',
        permanent: true,
      },
      {
        source: '/intern/prosjekt/:projectId',
        destination: '/prosjekt/:projectId',
        permanent: true,
      },
      {
        source: '/intern/forum-beta',
        destination: '/forum',
        permanent: true,
      },
      {
        source: '/intern/forum-beta/:path*',
        destination: '/forum/:path*',
        permanent: true,
      },
      {
        source: '/intern/forum',
        destination: '/forum',
        permanent: true,
      },
      {
        source: '/intern/forum/:path*',
        destination: '/forum/:path*',
        permanent: true,
      },
    ]
  },
}

/**
 * `webpackBuildWorker: false` m.m. stabiliserer `next build` på Windows, men skal **kun** gjelde
 * produksjonsbygg — ikke `next dev` (gir ufullstendig `.next` / routes-manifest og 500) eller `next start`.
 */
export default function defineNextConfig(phase: string): NextConfig {
  const prodBuildStability =
    phase === PHASE_PRODUCTION_BUILD
      ? {
          webpackBuildWorker: false,
          parallelServerCompiles: false,
          parallelServerBuildTraces: false,
        }
      : {}

  return {
    ...shared,
    experimental: {
      optimizePackageImports: ['lucide-react', 'recharts'],
      ...prodBuildStability,
    },
  }
}
