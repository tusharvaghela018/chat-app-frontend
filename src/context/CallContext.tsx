import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/hooks/socket";
import { CALL_EVENTS } from "@/pages/chat/constants";
import { callAudio } from "@/utils/callAudio";

export type CallStatus = "idle" | "outgoing" | "incoming" | "connected" | "ended";
export type CallType = "audio" | "video";

export interface RemoteCaller {
    id: number;
    name: string;
    avatar?: string;
    username?: string;
}

interface CallContextType {
    callStatus: CallStatus;
    callType: CallType;
    remoteUser: RemoteCaller | null;
    conversationId: number | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isMuted: boolean;
    isVideoOff: boolean;
    isRemoteMuted: boolean;
    isRemoteVideoOff: boolean;
    duration: number;
    isMinimized: boolean;
    errorMessage: string | null;
    facingMode: "user" | "environment";
    isSwitchingCamera: boolean;
    startCall: (user: RemoteCaller, isVideo: boolean, conversationId?: number) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: (reason?: string) => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleVideo: () => void;
    toggleMinimize: () => void;
    switchCamera: () => Promise<void>;
}

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
        // Public open-relay TURN servers so peers behind symmetric NATs or firewalls can connect
        {
            urls: [
                "turn:openrelay.metered.ca:80",
                "turn:openrelay.metered.ca:443",
                "turn:openrelay.metered.ca:443?transport=tcp",
            ],
            username: "openrelay",
            credential: "openrelay",
        },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
};

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
};

const CallContext = createContext<CallContextType | null>(null);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const socket = useSocket();

    const [callStatus, setCallStatus] = useState<CallStatus>("idle");
    const [callType, setCallType] = useState<CallType>("audio");
    const [remoteUser, setRemoteUser] = useState<RemoteCaller | null>(null);
    const [conversationId, setConversationId] = useState<number | null>(null);

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isRemoteMuted, setIsRemoteMuted] = useState(false);
    const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);

    const [duration, setDuration] = useState(0);
    const [isMinimized, setIsMinimized] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
    const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const durationIntervalRef = useRef<any>(null);
    const persistentAudioRef = useRef<HTMLAudioElement | null>(null);

    // Persistent audio player across entire session (works even when CallModal is minimized)
    useEffect(() => {
        if (!persistentAudioRef.current) {
            const el = new Audio();
            el.autoplay = true;
            (el as any).playsInline = true;
            persistentAudioRef.current = el;
        }

        const el = persistentAudioRef.current;
        if (remoteStream && callStatus === "connected") {
            el.srcObject = remoteStream;
            el.play().catch((err) => {
                console.warn("Remote audio autoplay blocked by browser policy:", err);
            });
        } else if (el) {
            el.srcObject = null;
        }

        return () => {
            if (el) el.srcObject = null;
        };
    }, [remoteStream, callStatus]);

    // Stop and cleanup streams and peer connection
    const cleanupCall = useCallback(() => {
        callAudio.stopAll();

        if (persistentAudioRef.current) {
            persistentAudioRef.current.srcObject = null;
            persistentAudioRef.current.pause();
        }

        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }

        if (pcRef.current) {
            pcRef.current.ontrack = null;
            pcRef.current.onicecandidate = null;
            pcRef.current.oniceconnectionstatechange = null;
            pcRef.current.onconnectionstatechange = null;
            pcRef.current.close();
            pcRef.current = null;
        }

        pendingCandidatesRef.current = [];
        setLocalStream(null);
        setRemoteStream(null);
        setIsMuted(false);
        setIsVideoOff(false);
        setIsRemoteMuted(false);
        setIsRemoteVideoOff(false);
        setDuration(0);
        setIsMinimized(false);
        setFacingMode("user");
        setIsSwitchingCamera(false);
    }, []);

    // Helper to finish call and reset to idle after brief notice
    const finishCallWithNotice = useCallback(
        (notice: string, isError = false) => {
            callAudio.playEndTone();
            if (isError) {
                setErrorMessage(notice);
            }
            setCallStatus("ended");
            setTimeout(() => {
                cleanupCall();
                setCallStatus("idle");
                setRemoteUser(null);
                setConversationId(null);
                setErrorMessage(null);
            }, 2000);
        },
        [cleanupCall]
    );

    // Call Duration Timer
    useEffect(() => {
        if (callStatus === "connected") {
            setDuration(0);
            durationIntervalRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } else {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }
        }
        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, [callStatus]);

    // Create RTCPeerConnection instance
    const createPeerConnection = useCallback(
        (targetUserId: number) => {
            if (pcRef.current) {
                pcRef.current.close();
            }

            const pc = new RTCPeerConnection(ICE_SERVERS);
            pcRef.current = pc;

            pc.onicecandidate = (event) => {
                if (event.candidate && socket) {
                    const candidatePayload = event.candidate.toJSON
                        ? event.candidate.toJSON()
                        : {
                              candidate: event.candidate.candidate,
                              sdpMid: event.candidate.sdpMid,
                              sdpMLineIndex: event.candidate.sdpMLineIndex,
                              usernameFragment: event.candidate.usernameFragment,
                          };
                    socket.emit(CALL_EVENTS.ICE_CANDIDATE, {
                        targetUserId,
                        candidate: candidatePayload,
                    });
                }
            };

            pc.oniceconnectionstatechange = () => {
                console.log("WebRTC ICE Connection State:", pc.iceConnectionState);
                if (pc.iceConnectionState === "failed") {
                    console.warn("ICE connection failed, attempting restart...");
                    try {
                        pc.restartIce();
                    } catch (e) {
                        console.error("restartIce error:", e);
                    }
                }
            };

            pc.onconnectionstatechange = () => {
                console.log("WebRTC Connection State:", pc.connectionState);
            };

            pc.ontrack = (event) => {
                console.log("WebRTC ontrack received:", event.track.kind, event.streams);

                let stream: MediaStream;
                if (event.streams && event.streams[0]) {
                    stream = event.streams[0];
                } else {
                    stream = new MediaStream([event.track]);
                }

                // Force a new MediaStream instance so React state updates and video/audio elements trigger
                setRemoteStream(new MediaStream(stream.getTracks()));

                // When track un-mutes (first RTP packet arrives), re-trigger stream binding
                event.track.onunmute = () => {
                    console.log("WebRTC remote track un-muted:", event.track.kind);
                    setRemoteStream(new MediaStream(stream.getTracks()));
                };

                stream.onaddtrack = () => {
                    setRemoteStream(new MediaStream(stream.getTracks()));
                };

                stream.onremovetrack = () => {
                    setRemoteStream(new MediaStream(stream.getTracks()));
                };
            };

            // Add local tracks to peer connection
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => {
                    pc.addTrack(track, localStreamRef.current!);
                });
            }

            return pc;
        },
        [socket]
    );

    // ── 1. Initiate Outgoing Call ──────────────────────────────────────────
    const startCall = useCallback(
        async (targetUser: RemoteCaller, isVideo: boolean, convId?: number) => {
            if (!socket) return;
            try {
                cleanupCall();
                setErrorMessage(null);
                setRemoteUser(targetUser);
                setConversationId(convId || null);
                setCallType(isVideo ? "video" : "audio");
                setCallStatus("outgoing");
                setIsVideoOff(!isVideo);

                // Acquire camera/microphone with hardware echo cancellation & noise suppression
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: AUDIO_CONSTRAINTS,
                    video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
                });

                localStreamRef.current = stream;
                setLocalStream(stream);

                callAudio.playCallingTone();

                socket.emit(CALL_EVENTS.INITIATE, {
                    recipientId: targetUser.id,
                    isVideo,
                    conversationId: convId,
                });
            } catch (err: any) {
                console.error("Media permission or capture error:", err);
                finishCallWithNotice("Camera or Microphone access was denied.", true);
            }
        },
        [socket, cleanupCall, finishCallWithNotice]
    );

    // ── 2. Accept Incoming Call ────────────────────────────────────────────
    const acceptCall = useCallback(async () => {
        if (!socket || !remoteUser) return;
        try {
            callAudio.stopAll();
            const isVideo = callType === "video";

            // Acquire camera/microphone with hardware echo cancellation & noise suppression
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: AUDIO_CONSTRAINTS,
                video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
            });

            localStreamRef.current = stream;
            setLocalStream(stream);

            createPeerConnection(remoteUser.id);

            setCallStatus("connected");
            socket.emit(CALL_EVENTS.ACCEPT, { callerId: remoteUser.id });
        } catch (err: any) {
            console.error("Failed to accept call:", err);
            finishCallWithNotice("Could not access camera/mic.", true);
        }
    }, [socket, remoteUser, callType, createPeerConnection, finishCallWithNotice]);

    // ── 3. Reject Incoming Call ────────────────────────────────────────────
    const rejectCall = useCallback(
        (reason = "declined") => {
            if (socket && remoteUser) {
                socket.emit(CALL_EVENTS.REJECT, { callerId: remoteUser.id, reason });
            }
            callAudio.stopAll();
            cleanupCall();
            setCallStatus("idle");
            setRemoteUser(null);
            setConversationId(null);
        },
        [socket, remoteUser, cleanupCall]
    );

    // ── 4. End Active Call ─────────────────────────────────────────────────
    const endCall = useCallback(() => {
        if (socket && remoteUser) {
            socket.emit(CALL_EVENTS.END, { targetUserId: remoteUser.id, reason: "ended" });
        }
        finishCallWithNotice("Call ended");
    }, [socket, remoteUser, finishCallWithNotice]);

    // ── 5. Media Toggles ───────────────────────────────────────────────────
    const toggleMute = useCallback(() => {
        if (!localStreamRef.current) return;
        const audioTracks = localStreamRef.current.getAudioTracks();
        if (audioTracks.length > 0) {
            const nextMuted = !isMuted;
            audioTracks.forEach((track) => (track.enabled = !nextMuted));
            setIsMuted(nextMuted);

            if (socket && remoteUser) {
                socket.emit(CALL_EVENTS.TOGGLE_MEDIA, {
                    targetUserId: remoteUser.id,
                    isMuted: nextMuted,
                    isVideoOff,
                });
            }
        }
    }, [isMuted, isVideoOff, socket, remoteUser]);

    const toggleVideo = useCallback(() => {
        if (!localStreamRef.current) return;
        const videoTracks = localStreamRef.current.getVideoTracks();
        if (videoTracks.length > 0) {
            const nextVideoOff = !isVideoOff;
            videoTracks.forEach((track) => (track.enabled = !nextVideoOff));
            setIsVideoOff(nextVideoOff);

            if (socket && remoteUser) {
                socket.emit(CALL_EVENTS.TOGGLE_MEDIA, {
                    targetUserId: remoteUser.id,
                    isMuted,
                    isVideoOff: nextVideoOff,
                });
            }
        }
    }, [isMuted, isVideoOff, socket, remoteUser]);

    const toggleMinimize = useCallback(() => {
        setIsMinimized((prev) => !prev);
    }, []);

    // ── 5b. Switch Camera (Front / Rear) ───────────────────────────────────
    const switchCamera = useCallback(async () => {
        if (!localStreamRef.current || callType !== "video" || isSwitchingCamera) return;

        try {
            setIsSwitchingCamera(true);
            const nextFacingMode = facingMode === "user" ? "environment" : "user";

            // Query available video devices
            const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
            const videoDevices = devices.filter((d) => d.kind === "videoinput");

            let newStream: MediaStream | null = null;

            // If more than 1 camera device is available, cycle to next camera
            if (videoDevices.length > 1) {
                const currentTrack = localStreamRef.current.getVideoTracks()[0];
                const currentDeviceId = currentTrack?.getSettings()?.deviceId;
                const currentIndex = videoDevices.findIndex((d) => d.deviceId === currentDeviceId);
                const nextDevice = videoDevices[(currentIndex + 1) % videoDevices.length];

                try {
                    newStream = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            deviceId: { exact: nextDevice.deviceId },
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                        },
                    });
                } catch {
                    // Fall back to facingMode constraint below
                }
            }

            if (!newStream) {
                newStream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        facingMode: { ideal: nextFacingMode },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                });
            }

            const newVideoTrack = newStream.getVideoTracks()[0];
            if (!newVideoTrack) return;

            // Preserve current video on/off state
            newVideoTrack.enabled = !isVideoOff;

            // Seamlessly replace the track on the active WebRTC PeerConnection
            if (pcRef.current) {
                const senders = pcRef.current.getSenders();
                const videoSender = senders.find((s) => s.track && s.track.kind === "video");
                if (videoSender) {
                    await videoSender.replaceTrack(newVideoTrack);
                }
            }

            // Stop and release previous video track
            const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
            if (oldVideoTrack) {
                oldVideoTrack.stop();
                localStreamRef.current.removeTrack(oldVideoTrack);
            }

            // Attach new track and update stream instance
            localStreamRef.current.addTrack(newVideoTrack);
            const updatedStream = new MediaStream(localStreamRef.current.getTracks());
            localStreamRef.current = updatedStream;
            setLocalStream(updatedStream);
            setFacingMode(nextFacingMode);
        } catch (err: any) {
            console.warn("Failed to switch camera:", err);
        } finally {
            setIsSwitchingCamera(false);
        }
    }, [callType, facingMode, isSwitchingCamera, isVideoOff]);

    // ── 6. Socket Listeners for Call Events ────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        // Incoming call received
        const handleIncoming = (data: { callerId: number; isVideo: boolean; conversationId?: number; callerInfo: RemoteCaller }) => {
            if (callStatus !== "idle") {
                // Busy: auto-reject
                socket.emit(CALL_EVENTS.REJECT, { callerId: data.callerId, reason: "busy" });
                return;
            }

            setRemoteUser(data.callerInfo || { id: data.callerId, name: `User ${data.callerId}` });
            setConversationId(data.conversationId || null);
            setCallType(data.isVideo ? "video" : "audio");
            setCallStatus("incoming");
            setIsVideoOff(!data.isVideo);

            callAudio.playRingtone();
        };

        // Recipient accepted our call: create Offer
        const handleAccepted = async (_data: { recipientId: number }) => {
            callAudio.stopAll();
            setCallStatus("connected");

            const targetId = _data?.recipientId || remoteUser?.id;
            if (!targetId) return;
            const pc = createPeerConnection(targetId);

            try {
                const offer = await pc.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: callType === "video",
                });
                await pc.setLocalDescription(offer);

                socket.emit(CALL_EVENTS.OFFER, {
                    targetUserId: targetId,
                    sdp: pc.localDescription,
                });
            } catch (err) {
                console.error("Error creating WebRTC offer:", err);
                finishCallWithNotice("Connection failed.", true);
            }
        };

        // Recipient rejected
        const handleRejected = (data: { reason?: string }) => {
            const msg = data.reason === "busy" ? "User is busy in another call." : "Call declined.";
            finishCallWithNotice(msg);
        };

        // Recipient offline or blocked
        const handleUnavailable = (data: { reason?: string }) => {
            let msg = "User is currently unavailable.";
            if (data.reason === "offline") msg = "User is offline.";
            if (data.reason === "busy") msg = "User is busy in another call.";
            if (data.reason === "blocked") msg = "Cannot call this user.";
            finishCallWithNotice(msg, true);
        };

        // WebRTC Offer received (by recipient)
        const handleOffer = async (data: { callerId: number; sdp: RTCSessionDescriptionInit }) => {
            let pc = pcRef.current;
            if (!pc) {
                pc = createPeerConnection(data.callerId);
            }

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

                // Process any ICE candidates that arrived before the offer
                while (pendingCandidatesRef.current.length > 0) {
                    const cand = pendingCandidatesRef.current.shift();
                    if (cand) {
                        await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.error);
                    }
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit(CALL_EVENTS.ANSWER, {
                    targetUserId: data.callerId,
                    sdp: pc.localDescription,
                });
            } catch (err) {
                console.error("Error handling offer and creating answer:", err);
            }
        };

        // WebRTC Answer received (by caller)
        const handleAnswer = async (data: { responderId: number; sdp: RTCSessionDescriptionInit }) => {
            const pc = pcRef.current;
            if (!pc) return;

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

                while (pendingCandidatesRef.current.length > 0) {
                    const cand = pendingCandidatesRef.current.shift();
                    if (cand) {
                        await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.error);
                    }
                }
            } catch (err) {
                console.error("Error setting remote description on answer:", err);
            }
        };

        // ICE candidate received
        const handleIceCandidate = async (data: { senderId: number; candidate: RTCIceCandidateInit }) => {
            if (!data?.candidate) return;
            const pc = pcRef.current;
            if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (err) {
                    console.error("Error adding received ICE candidate:", err);
                }
            } else {
                pendingCandidatesRef.current.push(data.candidate);
            }
        };

        // Remote peer toggled audio/video
        const handleMediaToggled = (data: { isMuted?: boolean; isVideoOff?: boolean }) => {
            if (data.isMuted !== undefined) setIsRemoteMuted(data.isMuted);
            if (data.isVideoOff !== undefined) setIsRemoteVideoOff(data.isVideoOff);
        };

        // Call ended by peer
        const handleEnded = (data: { reason?: string }) => {
            const msg = data.reason === "disconnected" ? "User disconnected." : "Call ended.";
            finishCallWithNotice(msg);
        };

        socket.on(CALL_EVENTS.INCOMING, handleIncoming);
        socket.on(CALL_EVENTS.ACCEPTED, handleAccepted);
        socket.on(CALL_EVENTS.REJECTED, handleRejected);
        socket.on(CALL_EVENTS.UNAVAILABLE, handleUnavailable);
        socket.on(CALL_EVENTS.OFFER, handleOffer);
        socket.on(CALL_EVENTS.ANSWER, handleAnswer);
        socket.on(CALL_EVENTS.ICE_CANDIDATE, handleIceCandidate);
        socket.on(CALL_EVENTS.MEDIA_TOGGLED, handleMediaToggled);
        socket.on(CALL_EVENTS.ENDED, handleEnded);

        return () => {
            socket.off(CALL_EVENTS.INCOMING, handleIncoming);
            socket.off(CALL_EVENTS.ACCEPTED, handleAccepted);
            socket.off(CALL_EVENTS.REJECTED, handleRejected);
            socket.off(CALL_EVENTS.UNAVAILABLE, handleUnavailable);
            socket.off(CALL_EVENTS.OFFER, handleOffer);
            socket.off(CALL_EVENTS.ANSWER, handleAnswer);
            socket.off(CALL_EVENTS.ICE_CANDIDATE, handleIceCandidate);
            socket.off(CALL_EVENTS.MEDIA_TOGGLED, handleMediaToggled);
            socket.off(CALL_EVENTS.ENDED, handleEnded);
        };
    }, [socket, callStatus, remoteUser, callType, createPeerConnection, finishCallWithNotice]);

    return (
        <CallContext.Provider
            value={{
                callStatus,
                callType,
                remoteUser,
                conversationId,
                localStream,
                remoteStream,
                isMuted,
                isVideoOff,
                isRemoteMuted,
                isRemoteVideoOff,
                duration,
                isMinimized,
                errorMessage,
                startCall,
                acceptCall,
                rejectCall,
                endCall,
                toggleMute,
                toggleVideo,
                toggleMinimize,
                facingMode,
                isSwitchingCamera,
                switchCamera,
            }}
        >
            {children}
        </CallContext.Provider>
    );
};

export const useCall = (): CallContextType => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error("useCall must be used within a CallProvider");
    }
    return context;
};
