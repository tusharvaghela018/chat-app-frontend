import React, { useState, useRef, useEffect } from "react"
import { Play, Pause, Check, CheckCheck, Star } from "lucide-react"

export const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
}

// Pseudo-random but deterministic waveform bar heights for natural audio look
const WAVEFORM_HEIGHTS = [
    30, 45, 65, 85, 40, 70, 95, 60, 45, 80, 100, 75, 50, 90, 85, 60, 40, 70, 90, 55, 35, 60, 45, 25
]

interface AudioPlayerBubbleProps {
    url: string
    duration?: number
    isMine: boolean
    createdAt: string
    isSeen?: boolean
    isPending?: boolean
    isStarred?: boolean
}

export const AudioPlayerBubble: React.FC<AudioPlayerBubbleProps> = ({
    url,
    duration = 0,
    isMine,
    createdAt,
    isSeen,
    isPending,
    isStarred = false,
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [totalDuration, setTotalDuration] = useState(duration || 0)

    useEffect(() => {
        if (duration && duration > 0) {
            setTotalDuration(duration)
        }
    }, [duration])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const onLoadedMetadata = () => {
            if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity && audio.duration > 0) {
                setTotalDuration(audio.duration)
            }
        }

        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime)
            if (audio.currentTime > totalDuration) {
                setTotalDuration(Math.ceil(audio.currentTime))
            }
        }

        const onEnded = () => {
            setIsPlaying(false)
            setCurrentTime(0)
        }

        audio.addEventListener("loadedmetadata", onLoadedMetadata)
        audio.addEventListener("timeupdate", onTimeUpdate)
        audio.addEventListener("ended", onEnded)

        return () => {
            audio.removeEventListener("loadedmetadata", onLoadedMetadata)
            audio.removeEventListener("timeupdate", onTimeUpdate)
            audio.removeEventListener("ended", onEnded)
        }
    }, [totalDuration])

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation()
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
            setIsPlaying(false)
        } else {
            audio.play().then(() => {
                setIsPlaying(true)
            }).catch((err) => {
                console.error("Playback failed:", err)
            })
        }
    }

    const handleSeek = (index: number) => {
        const audio = audioRef.current
        if (!audio || !totalDuration) return
        const targetPercent = index / WAVEFORM_HEIGHTS.length
        const targetTime = targetPercent * totalDuration
        audio.currentTime = targetTime
        setCurrentTime(targetTime)
    }

    const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) : 0

    return (
        <div
            className={`w-64 sm:w-72 p-3 rounded-2xl shadow-xs transition-all ${
                isMine
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs shadow-purple-600/15"
                    : "bg-white dark:bg-[#1a233a] text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 rounded-tl-xs"
            }`}
        >
            <audio ref={audioRef} src={url} preload="metadata" />

            <div className="flex items-center gap-2.5">
                {/* Play / Pause circular button */}
                <button
                    type="button"
                    onClick={togglePlay}
                    className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-sm cursor-pointer ${
                        isMine
                            ? "bg-white text-purple-600 hover:bg-purple-50"
                            : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-95"
                    }`}
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <Pause size={15} className="fill-current stroke-none" />
                    ) : (
                        <Play size={15} className="fill-current stroke-none ml-0.5" />
                    )}
                </button>

                {/* Waveform graphic */}
                <div className="flex-1 flex items-center gap-[2.5px] h-8 px-1 cursor-pointer select-none">
                    {WAVEFORM_HEIGHTS.map((height, idx) => {
                        const barPercent = idx / WAVEFORM_HEIGHTS.length
                        const isPlayed = barPercent <= progressPercent

                        return (
                            <div
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleSeek(idx)
                                }}
                                className={`flex-1 rounded-full transition-all duration-100 ${
                                    isMine
                                        ? isPlayed
                                            ? "bg-white"
                                            : "bg-purple-300/40 hover:bg-white/60"
                                        : isPlayed
                                        ? "bg-purple-600 dark:bg-purple-400"
                                        : "bg-slate-200 dark:bg-slate-700 hover:bg-purple-300 dark:hover:bg-purple-600"
                                }`}
                                style={{
                                    height: `${Math.max(18, height * 0.28)}px`,
                                }}
                            />
                        )
                    })}
                </div>

                {/* Duration text */}
                <span
                    className={`text-xs font-semibold tabular-nums shrink-0 ${
                        isMine ? "text-purple-100" : "text-slate-500 dark:text-slate-400"
                    }`}
                >
                    {isPlaying ? formatDuration(currentTime) : formatDuration(totalDuration)}
                </span>
            </div>

            {/* Bottom timestamp + checkmark status */}
            <div
                className={`flex items-center justify-end gap-1 mt-1 text-[10px] tabular-nums ${
                    isMine ? "text-purple-200/90" : "text-slate-400 dark:text-slate-500"
                }`}
            >
                <span>
                    {new Date(createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </span>
                {isStarred && (
                    <Star size={10} className="fill-amber-400 text-amber-400 inline shrink-0" />
                )}
                {isMine && (
                    <span className="ml-0.5">
                        {isPending ? (
                            <span className="inline-block animate-pulse text-[9px]">●</span>
                        ) : isSeen ? (
                            <CheckCheck size={13} className="inline text-purple-200" />
                        ) : (
                            <Check size={13} className="inline text-purple-200" />
                        )}
                    </span>
                )}
            </div>
        </div>
    )
}

export default AudioPlayerBubble
