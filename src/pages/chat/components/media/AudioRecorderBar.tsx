import React, { useState, useEffect, useRef } from "react"
import { Trash2, Send, Square, Play, Pause, RotateCcw, Loader2 } from "lucide-react"
import { formatDuration } from "./AudioPlayerBubble"

interface AudioRecorderBarProps {
    onSendAudio: (blob: Blob, duration: number) => Promise<void> | void
    onCancel: () => void
    isUploading?: boolean
}

// Visual waveform pattern for preview scrub bar
const PREVIEW_BAR_HEIGHTS = [
    30, 45, 70, 90, 40, 65, 95, 60, 45, 80, 100, 75, 50, 85, 90, 60, 40, 75, 90, 55, 35, 65, 45, 30
]

const getSupportedMimeType = (): string => {
    const types = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/aac",
    ]
    for (const t of types) {
        if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
            return t
        }
    }
    return ""
}

export const AudioRecorderBar: React.FC<AudioRecorderBarProps> = ({
    onSendAudio,
    onCancel,
    isUploading = false,
}) => {
    // Modes: "recording" (live mic) | "preview" (listen & review before sending)
    const [mode, setMode] = useState<"recording" | "preview">("recording")
    const [recordedDuration, setRecordedDuration] = useState(0)
    const [seconds, setSeconds] = useState(0)

    // Preview playback state
    const [isPlaying, setIsPlaying] = useState(false)
    const [playbackTime, setPlaybackTime] = useState(0)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const startTimeRef = useRef<number>(0)
    const recordedBlobRef = useRef<Blob | null>(null)
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
    const previewUrlRef = useRef<string | null>(null)

    // Keep stable callback references to prevent parent re-renders from killing active recordings
    const onCancelRef = useRef(onCancel)
    onCancelRef.current = onCancel
    const onSendAudioRef = useRef(onSendAudio)
    onSendAudioRef.current = onSendAudio

    // Start recording function
    const startRecording = async () => {
        try {
            // Clean up existing preview if re-recording
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current)
                previewUrlRef.current = null
                setPreviewUrl(null)
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            })

            streamRef.current = stream
            const mimeType = getSupportedMimeType()
            const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
            const mediaRecorder = new MediaRecorder(stream, options)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            // Start with 100ms chunks to continuously collect audio slices
            mediaRecorder.start(100)
            startTimeRef.current = Date.now()
            setSeconds(0)
            setMode("recording")

            // Real-time counter from timestamp for precise duration
            if (timerRef.current) clearInterval(timerRef.current)
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
                setSeconds(elapsed)
            }, 250)
        } catch (err) {
            console.error("Microphone access error:", err)
            alert("Could not access microphone. Please grant permission.")
            onCancelRef.current()
        }
    }

    // Initialize recording once on mount
    useEffect(() => {
        startRecording()

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                try {
                    mediaRecorderRef.current.stop()
                } catch {
                    // Ignore already stopped
                }
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop())
                streamRef.current = null
            }
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current)
                previewUrlRef.current = null
            }
        }
    }, [])

    // Flushes all buffers and stops recorder safely
    const stopAudioCapture = (): Promise<{ blob: Blob; duration: number }> => {
        return new Promise((resolve) => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }

            const recorder = mediaRecorderRef.current
            const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))

            if (!recorder || recorder.state === "inactive") {
                const mimeType = recorder?.mimeType || getSupportedMimeType() || "audio/webm"
                const blob = new Blob(audioChunksRef.current, { type: mimeType })
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop())
                    streamRef.current = null
                }
                resolve({ blob, duration })
                return
            }

            recorder.onstop = () => {
                const mimeType = recorder.mimeType || getSupportedMimeType() || "audio/webm"
                const blob = new Blob(audioChunksRef.current, { type: mimeType })
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop())
                    streamRef.current = null
                }
                resolve({ blob, duration })
            }

            // Request any remaining buffered data before stopping to avoid missing audio chunks
            try {
                if (recorder.state === "recording") {
                    recorder.requestData()
                }
            } catch (e) {
                console.warn("requestData error:", e)
            }

            recorder.stop()
        })
    }

    // Stop recording and transition to PREVIEW mode so user can listen
    const handleStopAndListen = async () => {
        const { blob, duration } = await stopAudioCapture()
        recordedBlobRef.current = blob
        setRecordedDuration(duration)

        const url = URL.createObjectURL(blob)
        previewUrlRef.current = url
        setPreviewUrl(url)
        setMode("preview")
        setPlaybackTime(0)
        setIsPlaying(false)
    }

    // Direct send without preview
    const handleDirectSend = async () => {
        if (isUploading) return
        const { blob, duration } = await stopAudioCapture()
        onSendAudioRef.current(blob, duration)
    }

    // Send approved audio from preview mode
    const handleSendFromPreview = () => {
        if (!recordedBlobRef.current || isUploading) return
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause()
            setIsPlaying(false)
        }
        onSendAudioRef.current(recordedBlobRef.current, recordedDuration)
    }

    // Cancel and discard
    const handleDiscard = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause()
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            try {
                mediaRecorderRef.current.stop()
            } catch {
                // Ignore
            }
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current)
            previewUrlRef.current = null
        }
        onCancelRef.current()
    }

    // Re-record
    const handleReRecord = () => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause()
        }
        startRecording()
    }

    // Preview playback controls
    const togglePlayback = (e: React.MouseEvent) => {
        e.stopPropagation()
        const player = audioPlayerRef.current
        if (!player) return

        if (isPlaying) {
            player.pause()
            setIsPlaying(false)
        } else {
            player.play().then(() => {
                setIsPlaying(true)
            }).catch((err) => {
                console.error("Preview playback failed:", err)
            })
        }
    }

    const handleSeekPreview = (index: number) => {
        const player = audioPlayerRef.current
        if (!player || !recordedDuration) return
        const percent = index / PREVIEW_BAR_HEIGHTS.length
        const targetTime = percent * recordedDuration
        player.currentTime = targetTime
        setPlaybackTime(targetTime)
    }

    const playbackProgress = recordedDuration > 0 ? playbackTime / recordedDuration : 0

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: PREVIEW MODE (Listen, Review, Seek, Discard, Send)
    // ─────────────────────────────────────────────────────────────────────────────
    if (mode === "preview" && previewUrl) {
        return (
            <div className="flex-1 flex items-center justify-between gap-3 bg-purple-50/90 dark:bg-[#1a2035] border border-purple-200/90 dark:border-purple-800/60 rounded-full px-3.5 h-11 animate-in fade-in zoom-in-95 duration-200 shadow-xs">
                {/* Hidden audio player for local playback preview */}
                <audio
                    ref={audioPlayerRef}
                    src={previewUrl}
                    preload="auto"
                    onTimeUpdate={() => {
                        if (audioPlayerRef.current) {
                            setPlaybackTime(audioPlayerRef.current.currentTime)
                        }
                    }}
                    onEnded={() => {
                        setIsPlaying(false)
                        setPlaybackTime(0)
                    }}
                />

                {/* Left: Play/Pause button + Timing */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={togglePlayback}
                        className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title={isPlaying ? "Pause preview" : "Listen to recording"}
                    >
                        {isPlaying ? (
                            <Pause size={14} className="fill-current stroke-none" />
                        ) : (
                            <Play size={14} className="fill-current stroke-none ml-0.5" />
                        )}
                    </button>

                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        <span>{formatDuration(playbackTime)}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500 dark:text-slate-400">{formatDuration(recordedDuration)}</span>
                    </div>
                </div>

                {/* Center: Interactive Waveform Scrubber */}
                <div className="flex-1 flex items-center gap-[2.5px] h-7 px-1 cursor-pointer select-none">
                    {PREVIEW_BAR_HEIGHTS.map((height, idx) => {
                        const barPercent = idx / PREVIEW_BAR_HEIGHTS.length
                        const isPlayed = barPercent <= playbackProgress

                        return (
                            <div
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleSeekPreview(idx)
                                }}
                                className={`flex-1 rounded-full transition-all duration-75 ${
                                    isPlayed
                                        ? "bg-purple-600 dark:bg-purple-400"
                                        : "bg-purple-200/80 dark:bg-purple-900/60 hover:bg-purple-400/70"
                                }`}
                                style={{
                                    height: `${Math.max(14, height * 0.24)}px`,
                                }}
                            />
                        )
                    })}
                </div>

                {/* Right Actions: Re-record, Discard, Send */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={handleReRecord}
                        disabled={isUploading}
                        className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer rounded-full hover:bg-white dark:hover:bg-slate-800"
                        title="Re-record audio"
                    >
                        <RotateCcw size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={handleDiscard}
                        disabled={isUploading}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer rounded-full hover:bg-white dark:hover:bg-slate-800"
                        title="Discard recording"
                    >
                        <Trash2 size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={handleSendFromPreview}
                        disabled={isUploading}
                        className="h-8 px-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center gap-1.5 text-xs font-bold shadow-md shadow-purple-600/30 transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                        title="Send voice note"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <span>Send</span>
                                <Send size={13} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: RECORDING MODE (Live capture, pulsing indicator, Stop & Listen)
    // ─────────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex-1 flex items-center justify-between gap-3 bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-full px-4 h-11 animate-in fade-in zoom-in-95 duration-200">
            {/* Pulsing record indicator & live timer */}
            <div className="flex items-center gap-2.5 shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
                    </span>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                        REC
                    </span>
                </div>

                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {formatDuration(seconds)}
                </span>
            </div>

            {/* Waveform animation bars */}
            <div className="flex items-center gap-1 h-4 select-none flex-1 justify-center max-w-[200px]">
                {[40, 80, 50, 90, 60, 100, 70, 40, 85, 60, 95, 50].map((h, i) => (
                    <div
                        key={i}
                        className="w-1 bg-rose-500 rounded-full animate-pulse"
                        style={{
                            height: `${h}%`,
                            animationDelay: `${(i % 5) * 0.15}s`,
                            animationDuration: "0.8s",
                        }}
                    />
                ))}
            </div>

            {/* Actions: Cancel, Stop & Listen (Review), Send */}
            <div className="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={handleDiscard}
                    disabled={isUploading}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer rounded-full hover:bg-white dark:hover:bg-slate-800"
                    title="Cancel recording"
                >
                    <Trash2 size={17} />
                </button>

                {/* Stop & Listen button to review before sending */}
                <button
                    type="button"
                    onClick={handleStopAndListen}
                    disabled={isUploading}
                    className="h-8 px-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300/60 dark:border-rose-800/60 flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                    title="Stop and listen before sending"
                >
                    <Square size={11} className="fill-rose-600 dark:fill-rose-400 stroke-none" />
                    <span>Listen</span>
                </button>

                {/* Direct Send button */}
                <button
                    type="button"
                    onClick={handleDirectSend}
                    disabled={isUploading || seconds < 1}
                    className="h-8 px-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center gap-1.5 text-xs font-bold shadow-md shadow-purple-600/30 transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                    title="Send audio note"
                >
                    {isUploading ? (
                        <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Sending...</span>
                        </>
                    ) : (
                        <>
                            <span>Send</span>
                            <Send size={13} />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

export default AudioRecorderBar

