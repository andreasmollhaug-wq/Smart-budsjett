import type { MetadataRoute } from 'next'
import { articles } from '@/lib/articles'
import { getSiteUrl } from '@/lib/site-url'

const staticPaths: { path: string; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency']; priority: number }[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/iris', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/guider', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/personvern', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/vilkar', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/logg-inn', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/registrer', changeFrequency: 'monthly', priority: 0.65 },
]

function toLastModified(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`)
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map(({ path, changeFrequency, priority }) => ({
    url: path === '/' ? `${base}/` : `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/guider/${a.slug}`,
    lastModified: toLastModified(a.updatedAt ?? a.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }))

  return [...staticEntries, ...articleEntries]
}
