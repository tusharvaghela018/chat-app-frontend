import React, { useState, useRef, useEffect, useCallback } from "react"
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    Code,
    Heading,
    Image as ImageIcon,
    FileText,
    Smile,
    Mic,
    Send,
    Loader2,
    Plus,
    Type,
} from "lucide-react"
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react"
import { formatBytes } from "@/pages/chat/components/media/DocumentCard"

export interface UploadingFileInfo {
    name: string
    size?: number
    type?: string
}

interface RichMessageInputProps {
    placeholder?: string
    value: string
    onChange: (val: string) => void
    onSend: () => void
    onSendPhoto: (file: File) => void
    onSendPdf: (file: File) => void
    onStartVoiceRecording: () => void
    isUploading?: boolean
    uploadingFile?: UploadingFileInfo | null
    disabled?: boolean
    disabledReason?: string
}

/**
 * Converts a contentEditable DOM tree to clean Markdown/HTML string
 * for secure message transmission and rendering in chat bubbles.
 */
function domToMarkdown(element: HTMLElement): string {
    function traverse(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || ""
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return ""
        }

        const el = node as HTMLElement
        const tag = el.tagName.toLowerCase()

        let childrenText = ""
        for (let i = 0; i < el.childNodes.length; i++) {
            childrenText += traverse(el.childNodes[i])
        }

        switch (tag) {
            case "strong":
            case "b":
                return childrenText ? `**${childrenText}**` : ""
            case "em":
            case "i":
                return childrenText ? `*${childrenText}*` : ""
            case "u":
                return childrenText ? `<u>${childrenText}</u>` : ""
            case "s":
            case "strike":
            case "del":
                return childrenText ? `~~${childrenText}~~` : ""
            case "code":
                return childrenText ? `\`${childrenText}\`` : ""
            case "pre":
                return childrenText ? `\`\`\`\n${childrenText}\n\`\`\`` : ""
            case "h1":
                return childrenText ? `# ${childrenText}\n` : ""
            case "h2":
                return childrenText ? `## ${childrenText}\n` : ""
            case "h3":
            case "h4":
                return childrenText ? `### ${childrenText}\n` : ""
            case "ul":
                return childrenText ? `${childrenText}\n` : ""
            case "ol":
                return childrenText ? `${childrenText}\n` : ""
            case "li":
                return childrenText ? `- ${childrenText.trim()}\n` : ""
            case "blockquote":
                return childrenText ? `> ${childrenText}\n` : ""
            case "br":
                return "\n"
            case "div":
            case "p":
                if (!childrenText || childrenText === "\n") return "\n"
                return `${childrenText}\n`
            default: {
                let styled = childrenText
                const fw = el.style.fontWeight
                if (fw === "bold" || parseInt(fw) >= 600) {
                    styled = `**${styled}**`
                }
                if (el.style.fontStyle === "italic") {
                    styled = `*${styled}*`
                }
                const td = el.style.textDecoration || ""
                if (td.includes("underline")) {
                    styled = `<u>${styled}</u>`
                }
                if (td.includes("line-through")) {
                    styled = `~~${styled}~~`
                }
                return styled
            }
        }
    }

    return traverse(element).replace(/\u200B/g, "").replace(/\n{3,}/g, "\n\n").trim()
}

export const RichMessageInput: React.FC<RichMessageInputProps> = ({
    placeholder = "Type a message...",
    value,
    onChange,
    onSend,
    onSendPhoto,
    onSendPdf,
    onStartVoiceRecording,
    isUploading = false,
    uploadingFile = null,
    disabled = false,
    disabledReason,
}) => {
    const [showToolbar, setShowToolbar] = useState(true)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showAttachMenu, setShowAttachMenu] = useState(false)

    // Active format states for Slack-style active buttons
    const [isBold, setIsBold] = useState(false)
    const [isItalic, setIsItalic] = useState(false)
    const [isUnderline, setIsUnderline] = useState(false)
    const [isStrike, setIsStrike] = useState(false)
    const [isList, setIsList] = useState(false)
    const [isHeading, setIsHeading] = useState(false)
    const [isCode, setIsCode] = useState(false)

    const editorRef = useRef<HTMLDivElement | null>(null)
    const photoInputRef = useRef<HTMLInputElement | null>(null)
    const pdfInputRef = useRef<HTMLInputElement | null>(null)
    const attachMenuRef = useRef<HTMLDivElement | null>(null)

    // Sync contentEditable to parent `onChange`
    const syncValue = useCallback(() => {
        if (!editorRef.current) return
        const markdown = domToMarkdown(editorRef.current)
        onChange(markdown)
    }, [onChange])

    // Query active formatting under caret (Slack-style highlights)
    const updateActiveFormats = useCallback(() => {
        try {
            setIsBold(document.queryCommandState("bold"))
            setIsItalic(document.queryCommandState("italic"))
            setIsUnderline(document.queryCommandState("underline"))
            setIsStrike(document.queryCommandState("strikeThrough"))
            setIsList(document.queryCommandState("insertUnorderedList"))

            const selection = window.getSelection()
            if (selection && selection.anchorNode) {
                const anchor = selection.anchorNode
                const el = anchor.nodeType === Node.ELEMENT_NODE ? (anchor as HTMLElement) : anchor.parentElement
                setIsHeading(!!el?.closest("h1, h2, h3, h4"))
                setIsCode(!!el?.closest("code"))
            } else {
                setIsCode(false)
            }
        } catch {
            // Ignore queryCommandState errors if editor not focused
        }
    }, [])

    // Synchronize when value is cleared from outside (e.g., after onSend)
    useEffect(() => {
        if (!value && editorRef.current) {
            if (editorRef.current.innerHTML !== "") {
                editorRef.current.innerHTML = ""
                updateActiveFormats()
            }
        }
    }, [value, updateActiveFormats])

    // Close popups on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest(".rich-input-popover") && !target.closest(".attach-menu-btn")) {
                setShowEmojiPicker(false)
                setShowAttachMenu(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Apply native document.execCommand without showing ANY raw markup tags
    const executeFormat = (command: string, arg: string | undefined = undefined) => {
        if (!editorRef.current || disabled || isUploading) return
        editorRef.current.focus()
        document.execCommand(command, false, arg)
        updateActiveFormats()
        syncValue()
    }

    // Toggle Heading (Slack Style)
    const toggleHeading = () => {
        if (!editorRef.current || disabled || isUploading) return
        editorRef.current.focus()
        const selection = window.getSelection()
        const anchor = selection?.anchorNode
        const el = anchor?.nodeType === Node.ELEMENT_NODE ? (anchor as HTMLElement) : anchor?.parentElement
        const inHeading = el?.closest("h3")

        if (inHeading) {
            document.execCommand("formatBlock", false, "<p>")
        } else {
            document.execCommand("formatBlock", false, "<h3>")
        }
        updateActiveFormats()
        syncValue()
    }

    // Toggle Inline Code (Slack Style without pre-written words)
    const toggleCode = () => {
        if (!editorRef.current || disabled || isUploading) return
        editorRef.current.focus()
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return

        const range = selection.getRangeAt(0)
        const anchor = selection.anchorNode
        const el = anchor?.nodeType === Node.ELEMENT_NODE ? (anchor as HTMLElement) : anchor?.parentElement
        const existingCode = el?.closest("code")

        // If cursor is already inside code, unwrap it (exit code mode)
        if (existingCode) {
            const parent = existingCode.parentNode
            while (existingCode.firstChild) {
                parent?.insertBefore(existingCode.firstChild, existingCode)
            }
            parent?.removeChild(existingCode)
            updateActiveFormats()
            syncValue()
            return
        }

        const selectedText = range.toString()
        const codeEl = document.createElement("code")
        codeEl.className = "bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-mono text-xs"

        if (selectedText) {
            codeEl.textContent = selectedText
            range.deleteContents()
            range.insertNode(codeEl)
            range.setStartAfter(codeEl)
            range.setEndAfter(codeEl)
            selection.removeAllRanges()
            selection.addRange(range)
        } else {
            // Empty code element with zero-width space so caret is placed inside with NO pre-written words!
            const textNode = document.createTextNode("\u200B")
            codeEl.appendChild(textNode)
            range.insertNode(codeEl)

            const newRange = document.createRange()
            newRange.setStart(textNode, 1)
            newRange.collapse(true)
            selection.removeAllRanges()
            selection.addRange(newRange)
        }
        updateActiveFormats()
        syncValue()
    }

    // Clean plain text pasting (avoids messy foreign styles from copy-pasting)
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault()
        const text = e.clipboardData.getData("text/plain")
        document.execCommand("insertText", false, text)
        syncValue()
    }

    // Keyboard navigation & shortcuts (Slack standard)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        // Keyboard Shortcuts: Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Shift+X
        if (e.ctrlKey || e.metaKey) {
            const key = e.key.toLowerCase()
            if (key === "b") {
                e.preventDefault()
                executeFormat("bold")
                return
            }
            if (key === "i") {
                e.preventDefault()
                executeFormat("italic")
                return
            }
            if (key === "u") {
                e.preventDefault()
                executeFormat("underline")
                return
            }
            if (key === "x" && e.shiftKey) {
                e.preventDefault()
                executeFormat("strikeThrough")
                return
            }
        }

        // Enter key handling (Slack style)
        if (e.key === "Enter") {
            if (e.shiftKey) {
                // Shift+Enter creates a clean visual newline
                return
            }

            // If in a list item:
            const selection = window.getSelection()
            const anchor = selection?.anchorNode
            const el = anchor?.nodeType === Node.ELEMENT_NODE ? (anchor as HTMLElement) : anchor?.parentElement
            const li = el?.closest("li")

            if (li) {
                if (!li.textContent?.trim()) {
                    // Empty bullet item -> exit list
                    e.preventDefault()
                    document.execCommand("insertUnorderedList")
                    updateActiveFormats()
                    syncValue()
                    return
                }
                // Non-empty bullet item -> create next bullet item
                setTimeout(() => {
                    updateActiveFormats()
                    syncValue()
                }, 0)
                return
            }

            // Regular Enter -> Send message
            e.preventDefault()
            const text = editorRef.current ? domToMarkdown(editorRef.current) : ""
            if (text.trim() && !disabled && !isUploading) {
                setShowEmojiPicker(false)
                setShowAttachMenu(false)
                onSend()
            }
        }
    }

    // Insert Emoji at caret position
    const handleEmojiClick = (emojiData: EmojiClickData) => {
        if (!editorRef.current) return
        editorRef.current.focus()
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            range.deleteContents()
            const textNode = document.createTextNode(emojiData.emoji)
            range.insertNode(textNode)
            range.setStartAfter(textNode)
            range.setEndAfter(textNode)
            selection.removeAllRanges()
            selection.addRange(range)
        } else {
            editorRef.current.appendChild(document.createTextNode(emojiData.emoji))
        }
        syncValue()
    }

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setShowAttachMenu(false)
            onSendPhoto(file)
        }
        e.target.value = ""
    }

    const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setShowAttachMenu(false)
            onSendPdf(file)
        }
        e.target.value = ""
    }

    if (disabled) {
        return (
            <div className="w-full p-3.5 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-center text-center">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {disabledReason || "You cannot send messages in this chat"}
                </p>
            </div>
        )
    }

    return (
        <div className="relative w-full">
            {/* Hidden Photo Input */}
            <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                onChange={handlePhotoChange}
                className="hidden"
            />

            {/* Hidden Document Input */}
            <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                onChange={handlePdfChange}
                className="hidden"
            />

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
                <div className="absolute bottom-full mb-3 right-0 sm:right-16 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 rich-input-popover animate-in fade-in zoom-in-95 duration-150">
                    <EmojiPicker
                        theme={document.documentElement.classList.contains("dark") ? Theme.DARK : Theme.LIGHT}
                        onEmojiClick={handleEmojiClick}
                        lazyLoadEmojis={true}
                        searchPlaceHolder="Search emoji..."
                        width={320}
                        height={380}
                    />
                </div>
            )}

            {/* WhatsApp-Style Attachment Menu Popover */}
            {showAttachMenu && (
                <div
                    ref={attachMenuRef}
                    className="absolute bottom-full mb-3 left-0 sm:left-2 z-50 shadow-2xl rounded-3xl bg-white/95 dark:bg-[#182234]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 p-2.5 min-w-[240px] rich-input-popover animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1 ring-1 ring-black/5"
                >
                    {/* Option 1: Photos & Media */}
                    <button
                        type="button"
                        onClick={() => {
                            setShowAttachMenu(false)
                            photoInputRef.current?.click()
                        }}
                        className="flex items-center gap-3.5 px-3 py-2.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-all cursor-pointer text-left group"
                    >
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                            <ImageIcon size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm leading-tight text-slate-900 dark:text-white">Photos & Media</p>
                            <span className="text-[11px] text-slate-400 font-normal">WhatsApp preview (JPG, PNG, GIF)</span>
                        </div>
                    </button>

                    {/* Option 2: Documents & PDFs */}
                    <button
                        type="button"
                        onClick={() => {
                            setShowAttachMenu(false)
                            pdfInputRef.current?.click()
                        }}
                        className="flex items-center gap-3.5 px-3 py-2.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-all cursor-pointer text-left group"
                    >
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm leading-tight text-slate-900 dark:text-white">Document / PDF</p>
                            <span className="text-[11px] text-slate-400 font-normal">Inline preview & download</span>
                        </div>
                    </button>

                    {/* Option 3: Voice Note */}
                    <button
                        type="button"
                        onClick={() => {
                            setShowAttachMenu(false)
                            onStartVoiceRecording()
                        }}
                        className="flex items-center gap-3.5 px-3 py-2.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-all cursor-pointer text-left group"
                    >
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform">
                            <Mic size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm leading-tight text-slate-900 dark:text-white">Voice Note</p>
                            <span className="text-[11px] text-slate-400 font-normal">Record voice message</span>
                        </div>
                    </button>

                    {/* Option 4: Formatting Toolbar Toggle */}
                    <button
                        type="button"
                        onClick={() => {
                            setShowAttachMenu(false)
                            setShowToolbar((prev) => !prev)
                        }}
                        className="flex items-center gap-3.5 px-3 py-2.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-all cursor-pointer text-left group"
                    >
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            <Type size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm leading-tight text-slate-900 dark:text-white">Text Formatting</p>
                            <span className="text-[11px] text-slate-400 font-normal">WYSIWYG bold, underline, lists</span>
                        </div>
                    </button>
                </div>
            )}

            {/* Rich Text Editor Card */}
            <div className="w-full bg-white dark:bg-[#162032] border border-slate-200/90 dark:border-slate-700/70 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-purple-500/40 focus-within:border-purple-500 transition-all flex flex-col overflow-hidden">
                
                {/* ── Slack-Style Rich Formatting Toolbar ── */}
                {showToolbar && (
                    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/90 bg-slate-50/80 dark:bg-[#111827]/80 text-slate-500 dark:text-slate-400 overflow-x-auto select-none scrollbar-none animate-in fade-in duration-150">
                        {/* Bold Button */}
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault()
                                executeFormat("bold")
                            }}
                            className={`p-1.5 rounded-md transition-all cursor-pointer ${
                                isBold
                                    ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold shadow-xs"
                                    : "hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                            }`}
                            title="Bold (Ctrl+B)"
                        >
                            <Bold size={15} />
                        </button>

                        {/* Italic Button */}
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault()
                                executeFormat("italic")
                            }}
                            className={`p-1.5 rounded-md transition-all cursor-pointer ${
                                isItalic
                                    ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shadow-xs"
                                    : "hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                            }`}
                            title="Italic (Ctrl+I)"
                        >
                            <Italic size={15} />
                        </button>

                        {/* Underline Button */}
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault()
                                executeFormat("underline")
                            }}
                            className={`p-1.5 rounded-md transition-all cursor-pointer ${
                                isUnderline
                                    ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shadow-xs"
                                    : "hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                            }`}
                            title="Underline (Ctrl+U)"
                        >
                            <UnderlineIcon size={15} />
                        </button>

                        {/* Strikethrough Button */}
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault()
                                executeFormat("strikeThrough")
                            }}
                            className={`p-1.5 rounded-md transition-all cursor-pointer ${
                                isStrike
                                    ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shadow-xs"
                                    : "hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                            }`}
                            title="Strikethrough (Ctrl+Shift+X)"
                        >
                            <Strikethrough size={15} />
                        </button>

                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700/80 mx-1" />

                        {/* Heading Button */}
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault()
                                toggleHeading()
                            }}
                            className={`p-1.5 rounded-md transition-all cursor-pointer ${
                                isHeading
                                    ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shadow-xs"
                                    : "hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                            }`}
                            title="Heading (H3)"
                        >
                            <Heading size={15} />
                        </button>

                        {/* Bullet List Button */}
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault()
                                executeFormat("insertUnorderedList")
                            }}
                            className={`p-1.5 rounded-md transition-all cursor-pointer ${
                                isList
                                    ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shadow-xs"
                                    : "hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                            }`}
                            title="Bulleted List"
                        >
                            <List size={15} />
                        </button>

                        {/* Inline Code Button */}
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault()
                                toggleCode()
                            }}
                            className={`p-1.5 rounded-md transition-all cursor-pointer ${
                                isCode
                                    ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shadow-xs"
                                    : "hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                            }`}
                            title="Inline Code"
                        >
                            <Code size={15} />
                        </button>

                        <div className="flex-1" />

                        {/* Photo & Doc quick actions in toolbar */}
                        <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                            title="Upload Photo (WhatsApp preview)"
                        >
                            <ImageIcon size={13} />
                            <span className="hidden sm:inline">Photo</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => pdfInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                            title="Upload Document / PDF (Inline preview & download)"
                        >
                            <FileText size={13} />
                            <span className="hidden sm:inline">Doc</span>
                        </button>
                    </div>
                )}

                {/* Live Uploading Status Card */}
                {isUploading && (
                    <div className="mx-3 mt-2.5 p-2.5 rounded-xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 animate-in fade-in slide-in-from-top-1 duration-200 flex flex-col gap-2 shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-purple-600/30">
                                    <Loader2 size={18} className="animate-spin text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                        {uploadingFile?.name || "Uploading attachment..."}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                                        <span>Verifying signatures & uploading...</span>
                                        {uploadingFile?.size ? (
                                            <span className="text-slate-400 font-normal">({formatBytes(uploadingFile.size)})</span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200/60 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 animate-pulse shrink-0">
                                Uploading
                            </span>
                        </div>
                        {/* Animated progress bar */}
                        <div className="w-full h-1.5 rounded-full bg-purple-200/50 dark:bg-purple-900/40 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 rounded-full animate-pulse w-full" />
                        </div>
                    </div>
                )}

                {/* ── Slack-Grade WYSIWYG ContentEditable Area ── */}
                <div className="relative px-3 pt-2 pb-1.5 min-h-[44px]">
                    <div
                        ref={editorRef}
                        contentEditable={!disabled && !isUploading}
                        onInput={() => {
                            syncValue()
                            updateActiveFormats()
                        }}
                        onKeyUp={updateActiveFormats}
                        onMouseUp={updateActiveFormats}
                        onPaste={handlePaste}
                        onKeyDown={handleKeyDown}
                        data-placeholder={isUploading ? "Uploading attachment, please wait..." : placeholder}
                        className="w-full text-sm text-slate-900 dark:text-white focus:outline-none resize-none leading-relaxed min-h-[40px] max-h-[160px] overflow-y-auto select-text break-words whitespace-pre-wrap scrollbar-thin empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 dark:empty:before:text-slate-500 empty:before:pointer-events-none empty:before:select-none [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_u]:underline-offset-2 [&_strike]:line-through [&_s]:line-through [&_del]:line-through [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_li]:my-0.5 [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:text-purple-600 dark:[&_code]:text-purple-400 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_h3]:text-base [&_h3]:font-bold [&_h3]:my-1"
                    />
                </div>

                {/* ── Bottom Controls Bar ── */}
                <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#162032] border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-1">
                        {/* WhatsApp Attachment Button with 45-degree rotation on open */}
                        <button
                            type="button"
                            onClick={() => setShowAttachMenu((prev) => !prev)}
                            disabled={isUploading}
                            className={`p-2 rounded-xl attach-menu-btn transition-all cursor-pointer ${
                                showAttachMenu
                                    ? "bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rotate-45 scale-105"
                                    : "text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            } disabled:opacity-40`}
                            title="Attach media or document (WhatsApp menu)"
                        >
                            <Plus size={20} className="transition-transform duration-200" />
                        </button>

                        {/* Photo Quick Button */}
                        <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            disabled={isUploading}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                            title="Add Photo"
                        >
                            <ImageIcon size={18} />
                        </button>

                        {/* PDF / Document Quick Button */}
                        <button
                            type="button"
                            onClick={() => pdfInputRef.current?.click()}
                            disabled={isUploading}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                            title="Add Document / PDF"
                        >
                            <FileText size={18} />
                        </button>

                        {/* Toggle Rich Toolbar (Aa) */}
                        <button
                            type="button"
                            onClick={() => setShowToolbar((prev) => !prev)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                showToolbar
                                    ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40"
                                    : "text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                            title="Toggle Rich Text Toolbar"
                        >
                            <Type size={18} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Emoji picker button */}
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer rich-input-popover ${
                                showEmojiPicker
                                    ? "text-purple-600 dark:text-purple-400"
                                    : "text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
                            }`}
                            title="Add Emoji"
                        >
                            <Smile size={19} />
                        </button>

                        {/* Voice message button */}
                        <button
                            type="button"
                            onClick={onStartVoiceRecording}
                            disabled={isUploading}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                            title="Record Voice Note"
                        >
                            <Mic size={19} />
                        </button>

                        {/* Send button with gradient */}
                        <button
                            type="button"
                            onClick={() => {
                                setShowEmojiPicker(false)
                                setShowAttachMenu(false)
                                onSend()
                            }}
                            disabled={!value.trim() || isUploading}
                            className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-35 text-white flex items-center justify-center shadow-md shadow-purple-600/25 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                            title="Send message (Enter)"
                        >
                            {isUploading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Send size={15} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RichMessageInput
