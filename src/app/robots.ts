import type { MetadataRoute } from 'next'
import { ENKEL_HANDLELISTE_IN_SIDEBAR } from '@/features/enkelHandleliste/featureFlags'
import { getSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()
  const disallow = ['/admin', '/admin/', '/api/admin/']
  if (!ENKEL_HANDLELISTE_IN_SIDEBAR) {
    disallow.push('/intern/enkel-handleliste', '/intern/enkel-handleliste/')
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow,
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
