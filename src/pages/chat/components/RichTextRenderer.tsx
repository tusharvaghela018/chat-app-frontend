import React, { useMemo } from "react"

interface RichTextRendererProps {
    content: string
    isMine?: boolean
}

/**
 * Safely parse markdown-like and rich text formatting without dangerous dangerouslySetInnerHTML
 * Supports:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - <u>underline</u>
 * - ~~strikethrough~~
 * - `inline code`
 * - ```code block```
 * - > blockquotes
 * - • or - bullet lists
 * - # Headings
 * - Links
 */
export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, isMine = false }) => {
    const rendered = useMemo(() => {
        if (!content) return null

        // Handle full multi-line code blocks first
        if (content.startsWith("```") && content.endsWith("```") && content.length > 6) {
            const innerCode = content.slice(3, -3).replace(/^[\r\n]+/, "")
            return (
                <pre className={`p-3 my-1 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre ${
                    isMine ? "bg-black/25 text-white/95" : "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
                }`}>
                    <code>{innerCode}</code>
                </pre>
            )
        }

        const lines = content.split("\n")

        return lines.map((line, lineIdx) => {
            // Check for Blockquote
            if (line.startsWith("> ")) {
                return (
                    <blockquote
                        key={lineIdx}
                        className={`border-l-2 pl-2.5 my-1 italic text-xs ${
                            isMine ? "border-white/60 text-white/90" : "border-purple-500 text-slate-600 dark:text-slate-300"
                        }`}
                    >
                        {formatInline(line.slice(2), isMine)}
                    </blockquote>
                )
            }

            // Check for Heading 1/2/3
            if (line.startsWith("### ")) {
                return (
                    <h4 key={lineIdx} className="font-bold text-sm mt-1.5 mb-0.5">
                        {formatInline(line.slice(4), isMine)}
                    </h4>
                )
            }
            if (line.startsWith("## ")) {
                return (
                    <h3 key={lineIdx} className="font-extrabold text-base mt-2 mb-0.5">
                        {formatInline(line.slice(3), isMine)}
                    </h3>
                )
            }
            if (line.startsWith("# ")) {
                return (
                    <h2 key={lineIdx} className="font-black text-lg mt-2 mb-1">
                        {formatInline(line.slice(2), isMine)}
                    </h2>
                )
            }

            // Check for Bullet list (- or • or * )
            if (/^(\s*[-*•]\s+)/.test(line)) {
                const bulletText = line.replace(/^(\s*[-*•]\s+)/, "")
                return (
                    <div key={lineIdx} className="flex items-start gap-1.5 my-0.5">
                        <span className="select-none font-bold text-xs mt-0.5">•</span>
                        <span>{formatInline(bulletText, isMine)}</span>
                    </div>
                )
            }

            // Check for Numbered list (e.g. 1. )
            const numMatch = line.match(/^(\s*\d+\.\s+)/)
            if (numMatch) {
                const numText = line.slice(numMatch[0].length)
                return (
                    <div key={lineIdx} className="flex items-start gap-1.5 my-0.5">
                        <span className="select-none font-semibold text-xs tabular-nums mt-0.5">{numMatch[0].trim()}</span>
                        <span>{formatInline(numText, isMine)}</span>
                    </div>
                )
            }

            // Standard line
            return (
                <p key={lineIdx} className="leading-relaxed min-h-[1.15em] break-words">
                    {formatInline(line, isMine)}
                </p>
            )
        })
    }, [content, isMine])

    return <div className="space-y-0.5">{rendered}</div>
}

/**
 * Parses inline formatting:
 * **bold**, *italic*, <u>underline</u>, ~~strike~~, `code`, URLs
 */
function formatInline(text: string, isMine: boolean): React.ReactNode[] {
    if (!text) return [""]

    // Tokenizer regex matching bold, italic, underline, strikethrough, code, URL
    const tokenRegex = /(https?:\/\/[^\s]+)|(\*\*[^*]+?\*\*)|(__[^_]+?__)|(\*[^*]+?\*)|(_[^_]+?_)|(<u>[\s\S]*?<\/u>)|(~~[^~]+?~~)|(`[^`]+?`)/g

    const nodes: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = tokenRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.substring(lastIndex, match.index))
        }

        const fullToken = match[0]

        // URL
        if (match[1]) {
            nodes.push(
                <a
                    key={match.index}
                    href={fullToken}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline hover:opacity-80 transition-opacity break-all ${
                        isMine ? "text-white font-medium underline-offset-2" : "text-purple-600 dark:text-purple-400 font-medium underline-offset-2"
                    }`}
                >
                    {fullToken}
                </a>
            )
        }
        // Bold: **text** or __text__
        else if (match[2] || match[3]) {
            const inner = fullToken.slice(2, -2)
            nodes.push(
                <strong key={match.index} className="font-bold">
                    {formatInline(inner, isMine)}
                </strong>
            )
        }
        // Italic: *text* or _text_
        else if (match[4] || match[5]) {
            const inner = fullToken.slice(1, -1)
            nodes.push(
                <em key={match.index} className="italic">
                    {formatInline(inner, isMine)}
                </em>
            )
        }
        // Underline: <u>text</u>
        else if (match[6]) {
            const inner = fullToken.slice(3, -4)
            nodes.push(
                <span key={match.index} className="underline underline-offset-2">
                    {formatInline(inner, isMine)}
                </span>
            )
        }
        // Strikethrough: ~~text~~
        else if (match[7]) {
            const inner = fullToken.slice(2, -2)
            nodes.push(
                <del key={match.index} className="line-through opacity-80">
                    {formatInline(inner, isMine)}
                </del>
            )
        }
        // Inline code: `text`
        else if (match[8]) {
            const inner = fullToken.slice(1, -1)
            nodes.push(
                <code
                    key={match.index}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono select-all ${
                        isMine
                            ? "bg-black/20 text-white"
                            : "bg-slate-200/80 dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-medium"
                    }`}
                >
                    {inner}
                </code>
            )
        }

        lastIndex = match.index + fullToken.length
    }

    if (lastIndex < text.length) {
        nodes.push(text.substring(lastIndex))
    }

    return nodes.length > 0 ? nodes : [text]
}

export default RichTextRenderer
