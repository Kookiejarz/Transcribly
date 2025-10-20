"use client"

import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"

type MarkdownRendererProps = {
  content: string
  className?: string
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="leading-relaxed text-foreground">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground">{children}</em>,
  ul: ({ children }) => (
    <ul className="ml-5 list-disc space-y-2 text-foreground marker:text-muted-foreground">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="ml-5 list-decimal space-y-2 text-foreground marker:text-muted-foreground">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ inline, children }) =>
    inline ? (
      <code className="rounded bg-muted px-1 py-0.5 text-sm font-mono text-foreground">{children}</code>
    ) : (
      <pre className="overflow-x-auto rounded bg-muted p-3 text-sm leading-relaxed text-foreground">
        <code className="font-mono">{children}</code>
      </pre>
    ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground">{children}</blockquote>
  ),
  h1: ({ children }) => <h1 className="text-xl font-semibold text-foreground">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-semibold text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold text-foreground">{children}</h3>,
  hr: () => <hr className="my-4 border-border/60" />,
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border border-border/40 text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/60 text-foreground">{children}</thead>,
  tbody: ({ children }) => <tbody className="text-foreground">{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border/40 last:border-b-0">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 align-top">{children}</td>,
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const trimmed = content?.trim()
  if (!trimmed) {
    return <p className="text-sm text-muted-foreground">No summary available.</p>
  }

  return (
    <article className={className ?? "space-y-3 text-sm"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {trimmed}
      </ReactMarkdown>
    </article>
  )
}
