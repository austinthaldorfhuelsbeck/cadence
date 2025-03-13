import { Howl } from 'howler';
import { AudioPlayerService } from '@core/interfaces';

export class HowlerAudioPlayerService implements AudioPlayerService {
    private howl: Howl | null = null;
    private timeUpdateInterval: number | null = null;
    private timeUpdateCallbacks: ((position: number) => void)[] = [];
    private endedCallbacks: (() => void)[] = [];
    private volume: number = 1.0;
    private muted: boolean = false;
    private playbackRate: number = 1.0;

    async load(filePath: string): Promise<void> {
        // Cleanup previous instance if it exists
        this.dispose();

        return new Promise((resolve, reject) => {
            this.howl = new Howl({
                src: [filePath],
                html5: true, // Better streaming performance
                preload: true,
                volume: this.muted ? 0 : this.volume,
                rate: this.playbackRate,
                onload: () => {
                    resolve();
                },
                onloaderror: (_, error) => {
                    console.error('Error loading audio:', error);
                    reject(error || new Error('Failed to load audio'));
                },
                onend: () => {
                    this.endedCallbacks.forEach((callback) => callback());
                },
            });
        });
    }

    play(): void {
        if (this.howl) {
            this.howl.play();
            this.startTimeUpdateInterval();
        }
    }

    pause(): void {
        if (this.howl) {
            this.howl.pause();
            this.stopTimeUpdateInterval();
        }
    }

    stop(): void {
        if (this.howl) {
            this.howl.stop();
            this.stopTimeUpdateInterval();
        }
    }

    seek(position: number): void {
        if (this.howl) {
            this.howl.seek(position);

            // Trigger time update manually for immediate UI update
            this.timeUpdateCallbacks.forEach((callback) => {
                callback(this.getCurrentPosition());
            });
        }
    }

    setVolume(level: number): void {
        this.volume = Math.max(0, Math.min(1, level));

        if (this.howl && !this.muted) {
            this.howl.volume(this.volume);
        }
    }

    setPlaybackRate(rate: number): void {
        this.playbackRate = Math.max(0.5, Math.min(2.0, rate));

        if (this.howl) {
            this.howl.rate(this.playbackRate);
        }
    }

    getCurrentPosition(): number {
        if (this.howl) {
            return this.howl.seek() as number;
        }
        return 0;
    }

    getDuration(): number {
        if (this.howl) {
            return this.howl.duration();
        }
        return 0;
    }

    onTimeUpdate(callback: (position: number) => void): void {
        this.timeUpdateCallbacks.push(callback);

        // Start interval if it's not already running and we're playing
        if (this.isPlaying()) {
            this.startTimeUpdateInterval();
        }
    }

    onEnded(callback: () => void): void {
        this.endedCallbacks.push(callback);
    }

    isPlaying(): boolean {
        return this.howl ? this.howl.playing() : false;
    }

    setMuted(muted: boolean): void {
        this.muted = muted;

        if (this.howl) {
            this.howl.volume(muted ? 0 : this.volume);
        }
    }

    dispose(): void {
        this.stopTimeUpdateInterval();

        if (this.howl) {
            this.howl.unload();
            this.howl = null;
        }

        // Clear callbacks
        this.timeUpdateCallbacks = [];
        this.endedCallbacks = [];
    }

    private startTimeUpdateInterval(): void {
        // Clean up existing interval if it exists
        this.stopTimeUpdateInterval();

        if (this.timeUpdateCallbacks.length > 0) {
            // Update approximately 10 times per second
            this.timeUpdateInterval = window.setInterval(() => {
                if (this.isPlaying()) {
                    const position = this.getCurrentPosition();
                    this.timeUpdateCallbacks.forEach((callback) =>
                        callback(position)
                    );
                }
            }, 100);
        }
    }

    private stopTimeUpdateInterval(): void {
        if (this.timeUpdateInterval !== null) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }
    }

    // Additional methods specific to Howler implementation

    /**
     * Gets the Howler instance
     * @returns The current Howl instance or null
     */
    getHowlInstance(): Howl | null {
        return this.howl;
    }

    /**
     * Gets the audio node for connecting to Web Audio API
     * @returns The audio node or null
     */
    getAudioNode(): GainNode | null {
        if (this.howl) {
            // Access the internal node - note this is using Howler internal API
            return (this.howl as any)._sounds?.[0]?._node || null;
        }
        return null;
    }

    /**
     * Creates an audio analyzer that can be used for visualizations
     * @returns An AnalyserNode connected to the current audio or null
     */
    createAnalyzer(): AnalyserNode | null {
        if (!this.howl) return null;

        try {
            // Create an analyzer node
            const audioContext = Howler.ctx as AudioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;

            // Connect the audio node to the analyzer
            const node = this.getAudioNode();
            if (node) {
                node.connect(analyser);
                return analyser;
            }
            return null;
        } catch (error) {
            console.error('Error creating analyzer:', error);
            return null;
        }
    }
}

// Don't forget to add Howler to your package.json dependencies:
// npm install howler @types/howler
