/**
 * Interface defining audio playback operations.
 * Abstracts the underlying audio engine to ensure the domain layer
 * remains independent of specific audio libraries.
 */
export interface AudioPlayerService {
    /**
     * Loads an audio file into the player
     * @param filePath Path to the audio file
     * @returns Promise that resolves when the audio is loaded
     */
    load(filePath: string): Promise<void>;

    /**
     * Starts playback of the currently loaded audio
     */
    play(): void;

    /**
     * Pauses playback of the currently loaded audio
     */
    pause(): void;

    /**
     * Stops playback and resets position to the beginning
     */
    stop(): void;

    /**
     * Sets the playback position
     * @param position Position in seconds
     */
    seek(position: number): void;

    /**
     * Sets the volume level
     * @param level Volume level between 0 (mute) and 1 (max)
     */
    setVolume(level: number): void;

    /**
     * Sets the playback rate
     * @param rate Playback rate between 0.5 and 2.0
     */
    setPlaybackRate(rate: number): void;

    /**
     * Gets the current playback position
     * @returns Current position in seconds
     */
    getCurrentPosition(): number;

    /**
     * Gets the total duration of the current audio
     * @returns Duration in seconds
     */
    getDuration(): number;

    /**
     * Registers a callback for regular time updates during playback
     * @param callback Function to call with the current position
     */
    onTimeUpdate(callback: (position: number) => void): void;

    /**
     * Registers a callback for when playback reaches the end
     * @param callback Function to call when playback ends
     */
    onEnded(callback: () => void): void;

    /**
     * Checks if audio is currently playing
     * @returns True if audio is playing, false otherwise
     */
    isPlaying(): boolean;

    /**
     * Toggles mute state
     * @param muted True to mute, false to unmute
     */
    setMuted(muted: boolean): void;

    /**
     * Cleans up resources when the player is no longer needed
     */
    dispose(): void;
}
