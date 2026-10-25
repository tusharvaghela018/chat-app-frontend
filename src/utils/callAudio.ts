// Synthesized Call Audio Tones using Web Audio API (zero external asset dependencies)

class CallAudioManager {
    private ctx: AudioContext | null = null;
    private ringtoneInterval: any = null;
    private callingInterval: any = null;

    private getContext(): AudioContext | null {
        if (typeof window === "undefined") return null;
        if (!this.ctx || this.ctx.state === "closed") {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    /**
     * Incoming Call Ringtone: melodic pleasant chord repeating every 2.5s
     */
    public playRingtone() {
        this.stopAll();
        const playTone = () => {
            const ctx = this.getContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + idx * 0.12);

                gain.gain.setValueAtTime(0.001, now + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.12 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.5);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + idx * 0.12);
                osc.stop(now + idx * 0.12 + 0.55);
            });
        };

        playTone();
        this.ringtoneInterval = setInterval(playTone, 2400);
    }

    /**
     * Outgoing Call Dial Tone: dual-frequency beep repeating every 3s
     */
    public playCallingTone() {
        this.stopAll();
        const playBeep = () => {
            const ctx = this.getContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            [440, 480].forEach((freq) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0.001, now);
                gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 1.25);
            });
        };

        playBeep();
        this.callingInterval = setInterval(playBeep, 3000);
    }

    /**
     * Call Ended Tone: short descending double beep
     */
    public playEndTone() {
        this.stopAll();
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        [600, 400].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now + idx * 0.15);

            gain.gain.setValueAtTime(0.12, now + idx * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 0.14);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.15);
            osc.stop(now + idx * 0.15 + 0.15);
        });
    }

    public stopAll() {
        if (this.ringtoneInterval) {
            clearInterval(this.ringtoneInterval);
            this.ringtoneInterval = null;
        }
        if (this.callingInterval) {
            clearInterval(this.callingInterval);
            this.callingInterval = null;
        }
    }
}

export const callAudio = new CallAudioManager();
