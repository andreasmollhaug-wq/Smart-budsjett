'use client'

import Link from 'next/link'
import { Check, Square } from 'lucide-react'
import { Children, isValidElement, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AiChatMarkdownProps {
  text: string
}

function isCheckboxInput(node: ReactNode): node is React.ReactElement<{ type?: string; checked?: boolean }> {
  if (!isValidElement<{ type?: string; checked?: boolean }>(node)) return false
  return node.type === 'input' && node.props.type === 'checkbox'
}

function extractTaskListParts(children: ReactNode): { checked: boolean; content: ReactNode[] } | null {
  const items = Children.toArray(children)
  const checkboxIndex = items.findIndex(isCheckboxInput)
  if (checkboxIndex === -1) return null
  const checkbox = items[checkboxIndex]
  if (!isCheckboxInput(checkbox)) return null
  return {
    checked: Boolean(checkbox.props.checked),
    content: items.filter((_, i) => i !== checkboxIndex),
  }
}

function isTaskListUl(className: unknown): boolean {
  if (typeof className === 'string') return className.includes('contains-task-list')
  if (Array.isArray(className)) return className.some((c) => typeof c === 'string' && c.includes('contains-task-list'))
  return false
}

/**
 * Rendrer assistent-svar med GitHub-flavored Markdown (lister, fet, overskrifter, sjekklister).
 * Ingen raw HTML — samme sikkerhetsmodell som forum.
 */
export default function AiChatMarkdown({ text }: AiChatMarkdownProps) {
  return (
    <div className="ai-chat-markdown min-w-0 break-words text-sm leading-relaxed mt-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => {
          const u = url.trim()
          if (
            u.startsWith('https://') ||
            u.startsWith('http://') ||
            u.startsWith('mailto:') ||
            (u.startsWith('/') && !u.startsWith('//'))
          ) {
            return url
          }
          return ''
        }}
        components={{
          h1({ children }) {
            return (
              <h3 className="text-base font-semibold mt-4 mb-2 first:mt-0" style={{ color: 'var(--text)' }}>
                {children}
              </h3>
            )
          },
          h2({ children }) {
            return (
              <h3 className="text-[15px] font-semibold mt-4 mb-2 first:mt-0" style={{ color: 'var(--text)' }}>
                {children}
              </h3>
            )
          },
          h3({ children }) {
            return (
              <h4 className="text-sm font-semibold mt-3 mb-1.5 first:mt-0" style={{ color: 'var(--text)' }}>
                {children}
              </h4>
            )
          },
          p({ children }) {
            return (
              <p className="my-2 first:mt-0 last:mb-0" style={{ color: 'var(--text)' }}>
                {children}
              </p>
            )
          },
          strong({ children }) {
            return (
              <strong className="font-semibold" style={{ color: 'var(--text)' }}>
                {children}
              </strong>
            )
          },
          em({ children }) {
            return <em className="italic">{children}</em>
          },
          ul({ className, children, ...props }) {
            const task = isTaskListUl(className)
            return (
              <ul
                {...props}
                className={task ? 'my-2 space-y-1.5 pl-0 list-none' : 'my-2 space-y-1 pl-5 list-disc marker:text-[var(--primary)]'}
              >
                {children}
              </ul>
            )
          },
          ol({ children, ...props }) {
            return (
              <ol {...props} className="my-2 space-y-1.5 pl-5 list-decimal marker:font-medium marker:text-[var(--text-muted)]">
                {children}
              </ol>
            )
          },
          li({ children, ...props }) {
            const task = extractTaskListParts(children)
            if (task) {
              const Icon = task.checked ? Check : Square
              return (
                <li {...props} className="flex items-start gap-2.5 my-1 list-none">
                  <Icon
                    size={16}
                    className="shrink-0 mt-0.5"
                    aria-hidden
                    style={{ color: task.checked ? 'var(--success)' : 'var(--text-muted)' }}
                    strokeWidth={task.checked ? 2.5 : 2}
                  />
                  <span className="min-w-0 flex-1" style={{ color: 'var(--text)' }}>
                    {task.content}
                  </span>
                </li>
              )
            }
            return (
              <li {...props} className="my-0.5 pl-0.5" style={{ color: 'var(--text)' }}>
                {children}
              </li>
            )
          },
          blockquote({ children }) {
            return (
              <blockquote
                className="my-3 border-l-[3px] pl-3 py-0.5 text-[13px] leading-relaxed rounded-r-lg"
                style={{
                  borderColor: 'var(--primary)',
                  color: 'var(--text-muted)',
                  background: 'color-mix(in srgb, var(--primary-pale) 45%, transparent)',
                }}
              >
                {children}
              </blockquote>
            )
          },
          hr() {
            return <hr className="my-4 border-0 border-t" style={{ borderColor: 'var(--border)' }} />
          },
          a({ href, children, ...props }) {
            const safe = typeof href === 'string' ? href.trim() : ''
            if (!safe) return <span {...props}>{children}</span>
            const isInternal = safe.startsWith('/') && !safe.startsWith('//')
            const className =
              'underline font-medium underline-offset-2 decoration-[color-mix(in_srgb,var(--primary)_70%,transparent)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-sm touch-manipulation'
            if (isInternal) {
              return (
                <Link href={safe} className={className} style={{ color: 'var(--primary)' }}>
                  {children}
                </Link>
              )
            }
            if (!safe.startsWith('http') && !safe.startsWith('mailto:')) {
              return <span {...props}>{children}</span>
            }
            return (
              <a
                href={href}
                {...props}
                rel="noopener noreferrer"
                target="_blank"
                className={className}
                style={{ color: 'var(--primary)' }}
              >
                {children}
              </a>
            )
          },
          code({ children, className, ...props }) {
            const isBlock = typeof className === 'string' && className.includes('language-')
            if (isBlock) {
              return (
                <code {...props} className="block text-xs leading-relaxed whitespace-pre-wrap">
                  {children}
                </code>
              )
            }
            return (
              <code
                {...props}
                className="rounded-md px-1.5 py-0.5 text-[13px] font-mono"
                style={{ background: 'color-mix(in srgb, var(--text-muted) 10%, var(--bg))', color: 'var(--text)' }}
              >
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
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full min-w-[16rem] text-left text-xs">{children}</table>
              </div>
            )
          },
          thead({ children }) {
            return <thead style={{ background: 'var(--primary-pale)' }}>{children}</thead>
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 font-semibold border-b" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                {children}
              </th>
            )
          },
          td({ children }) {
            return (
              <td className="px-3 py-2 border-b align-top" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                {children}
              </td>
            )
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
