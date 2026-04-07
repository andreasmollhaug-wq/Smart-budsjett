import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import GuideArticle, { GuideBlocks } from '@/components/marketing/GuideArticle'
import LandingFooter from '@/components/marketing/LandingFooter'
import LandingHeader from '@/components/marketing/LandingHeader'
import { getAllArticleSlugs, getArticleBySlug } from '@/lib/articles'
import { getSiteUrl } from '@/lib/site-url'

type Props = { params: Promise<{ slug: string }> }

function formatNorwegianDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const base = getSiteUrl()
  const url = `${base}/guider/${article.slug}`

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: `${article.title} · Smart Budsjett`,
      description: article.description,
      url,
      siteName: 'Smart Budsjett',
      locale: 'nb_NO',
      type: 'article',
      publishedTime: `${article.publishedAt}T12:00:00.000Z`,
      ...(article.updatedAt ? { modifiedTime: `${article.updatedAt}T12:00:00.000Z` } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.title} · Smart Budsjett`,
      description: article.description,
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function GuiderArticlePage({ params }: Props) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const base = getSiteUrl()
  const url = `${base}/guider/${article.slug}`
  const published = new Date(`${article.publishedAt}T12:00:00.000Z`)
  const modified = article.updatedAt
    ? new Date(`${article.updatedAt}T12:00:00.000Z`)
    : published

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: published.toISOString(),
    dateModified: modified.toISOString(),
    author: {
      '@type': 'Organization',
      name: 'EnkelExcel',
    },
    publisher: {
      '@type': 'Organization',
      name: 'EnkelExcel',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
  }

  const publishedLabel = `Publisert ${formatNorwegianDate(article.publishedAt)}`

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <LandingHeader />
        <GuideArticle title={article.title} description={article.description} publishedLabel={publishedLabel}>
          <GuideBlocks blocks={article.blocks} />
        </GuideArticle>
        <LandingFooter />
      </div>
    </>
  )
}
