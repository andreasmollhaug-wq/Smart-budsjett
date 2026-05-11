import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ForumMarkdownProps {
  text: string
  compact?: boolean
}

/**
 * Rendrer brukerkontrollert Markdown uten raw HTML-node (ingen rehype-raw).
 */
export default function ForumMarkdown({ text, compact }: ForumMarkdownProps) {
  const size = compact ? 'text-sm leading-relaxed' : 'text-base sm:text-[17px] leading-relaxed'

  return (
    <div className={[size, 'prose-forum-minimal min-w-0 break-words'].filter(Boolean).join(' ')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => {
          const u = url.trim()
          if (u.startsWith('https://') || u.startsWith('http://') || u.startsWith('mailto:')) {
            return url
          }
          return ''
        }}
        components={{
          a({ href, children, ...props }) {
            const safe = typeof href === 'string' ? href.trim() : ''
            if (!safe.startsWith('http') && !safe.startsWith('mailto:')) return <span {...props}>{children}</span>
            return (
              <a
                href={href}
                {...props}
                rel="noopener noreferrer"
                target="_blank"
                className="underline font-medium underline-offset-2 decoration-[color-mix(in_srgb,var(--primary)_85%,transparent)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-sm"
                style={{ color: 'var(--primary)' }}
              >
                {children}
              </a>
            )
          },
          code({ children, ...props }) {
            return (
              <code {...props} className="rounded-md px-1 py-0.5 text-[13px]" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                {children}
              </code>
            )
          },
          pre({ children }) {
            return (
              <pre
                className="overflow-x-auto rounded-xl border p-3 text-xs my-3"
                style={{
                  borderColor: 'var(--border)',
                  background: 'color-mix(in srgb, var(--text-muted) 6%, var(--bg))',
                }}
              >
                {children}
              </pre>
            )
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
