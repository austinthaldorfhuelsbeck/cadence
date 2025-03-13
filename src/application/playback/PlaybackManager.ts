import { EventEmitter } from 'events';
import {
    AudioPlayerService,
    VisualizationService,
    StorageService,
} from '@core/interfaces';
import { Track, Library } from '@core/models';
import {
    PlaybackState,
    RepeatMode,
    ShuffleMode,
    PlaybackSettings,
    Queue,
} from '@core/types/PlaybackTypes';

/**
 * PlaybackManager coordinates audio playback operations.
 * It manages the current queue, playback state, and audio visualization.
 */
export class PlaybackManager extends EventEmitter {
    private currentTrack: Track | null = null;
    private queue: Queue = {
        tracks: [],
        currentIndex: -1,
        originalOrder: [],
    };
    private playbackState: PlaybackState = PlaybackState.IDLE;
    private settings: PlaybackSettings = {
        volume: 1.0,
        muted: false,
        playbackRate: 1.0,
        repeatMode: RepeatMode.NONE,
        shuffleMode: ShuffleMode.OFF,
    };

    // Disposable timers and listeners
    private timeUpdateListener: ((position: number) => void) | null = null;
    private endedListener: (() => void) | null = null;
    private saveSettingsTimeout: NodeJS.Timeout | null = null;

    constructor(
        private audioPlayer: AudioPlayerService,
        private visualizer: VisualizationService,
        private storageService: StorageService,
        private library: Library
    ) {
        super();

        // Initialize with saved settings
        this.loadSettings();
    }

    /**
     * Initializes the playback manager
     */
    async initialize(): Promise<void> {
        try {
            // Load saved settings
            await this.loadSettings();

            // Setup audio player listeners
            this.setupEventListeners();

            // Apply initial settings to audio player
            this.applySettings();

            this.emit('playback-manager-ready');
        } catch (error) {
            console.error('Error initializing playback manager:', error);
            throw error;
        }
    }

    /**
     * Loads settings from storage
     */
    private async loadSettings(): Promise<void> {
        try {
            const settings = await this.storageService.loadSettings();

            if (settings && settings.playback) {
                this.settings = {
                    ...this.settings,
                    ...settings.playback,
                };

                // Apply loaded settings
                this.applySettings();
            }
        } catch (error) {
            console.error('Error loading playback settings:', error);
        }
    }

    /**
     * Saves current settings to storage
     */
    private saveSettings(): void {
        // Clear any pending save
        if (this.saveSettingsTimeout) {
            clearTimeout(this.saveSettingsTimeout);
        }

        // Debounce save operations to avoid excessive writes
        this.saveSettingsTimeout = setTimeout(async () => {
            try {
                const allSettings = await this.storageService.loadSettings();

                await this.storageService.saveSettings({
                    ...allSettings,
                    playback: this.settings,
                });
            } catch (error) {
                console.error('Error saving playback settings:', error);
            }
        }, 500);
    }

    /**
     * Sets up event listeners for the audio player
     */
    private setupEventListeners(): void {
        // Create a time update listener
        this.timeUpdateListener = (position: number) => {
            this.emit('time-update', {
                position,
                duration: this.audioPlayer.getDuration(),
                track: this.currentTrack,
            });
        };

        // Create an ended listener
        this.endedListener = () => {
            this.handleTrackEnded();
        };

        // Register listeners with audio player
        this.audioPlayer.onTimeUpdate(this.timeUpdateListener);
        this.audioPlayer.onEnded(this.endedListener);
    }

    /**
     * Handles what happens when a track finishes playing
     */
    private handleTrackEnded(): void {
        // Update play count for the current track
        this.updatePlayCount();

        // Determine next action based on repeat mode
        switch (this.settings.repeatMode) {
            case RepeatMode.ONE:
                // Repeat the current track
                this.play();
                break;

            case RepeatMode.ALL:
                // Play the next track or loop back to the first
                if (this.queue.currentIndex < this.queue.tracks.length - 1) {
                    this.next();
                } else {
                    // Back to the first track
                    this.playQueueIndex(0);
                }
                break;

            case RepeatMode.NONE:
            default:
                // Play the next track or stop at the end
                if (this.queue.currentIndex < this.queue.tracks.length - 1) {
                    this.next();
                } else {
                    this.stop();
                    this.emit('queue-ended');
                }
                break;
        }
    }

    /**
     * Updates the play count for the current track
     */
    private updatePlayCount(): void {
        if (this.currentTrack) {
            this.currentTrack.markAsPlayed();

            // Save the updated track
            this.storageService
                .saveTrack(this.currentTrack)
                .catch((err) =>
                    console.error('Error updating play count:', err)
                );
        }
    }

    /**
     * Applies current settings to the audio player
     */
    private applySettings(): void {
        this.audioPlayer.setVolume(this.settings.volume);
        this.audioPlayer.setMuted(this.settings.muted);
        this.audioPlayer.setPlaybackRate(this.settings.playbackRate);
    }

    /**
     * Plays or resumes the current track
     */
    async play(): Promise<void> {
        if (this.playbackState === PlaybackState.PAUSED) {
            // Resume playback
            this.audioPlayer.play();
            this.playbackState = PlaybackState.PLAYING;
            this.emit('playback-state-changed', PlaybackState.PLAYING);
            return;
        }

        if (!this.currentTrack && this.queue.tracks.length > 0) {
            // Start playing the first track in the queue
            await this.playQueueIndex(0);
            return;
        }

        if (this.currentTrack) {
            // Restart the current track
            await this.loadAndPlayTrack(this.currentTrack);
        }
    }

    /**
     * Pauses playback
     */
    pause(): void {
        if (this.playbackState === PlaybackState.PLAYING) {
            this.audioPlayer.pause();
            this.playbackState = PlaybackState.PAUSED;
            this.emit('playback-state-changed', PlaybackState.PAUSED);
        }
    }

    /**
     * Stops playback
     */
    stop(): void {
        this.audioPlayer.stop();
        this.playbackState = PlaybackState.STOPPED;
        this.emit('playback-state-changed', PlaybackState.STOPPED);
    }

    /**
     * Toggles between play and pause
     */
    togglePlayPause(): void {
        if (this.playbackState === PlaybackState.PLAYING) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Skips to the next track in the queue
     */
    next(): void {
        if (this.queue.tracks.length === 0) return;

        const nextIndex = this.queue.currentIndex + 1;
        if (nextIndex < this.queue.tracks.length) {
            this.playQueueIndex(nextIndex);
        } else if (this.settings.repeatMode === RepeatMode.ALL) {
            // Loop back to the beginning if repeat all is enabled
            this.playQueueIndex(0);
        }
    }

    /**
     * Returns to the previous track in the queue
     */
    previous(): void {
        if (this.queue.tracks.length === 0) return;

        // If we're more than 3 seconds into the track, restart it instead
        if (this.audioPlayer.getCurrentPosition() > 3) {
            this.audioPlayer.seek(0);
            return;
        }

        const prevIndex = this.queue.currentIndex - 1;
        if (prevIndex >= 0) {
            this.playQueueIndex(prevIndex);
        } else if (this.settings.repeatMode === RepeatMode.ALL) {
            // Wrap around to the end if repeat all is enabled
            this.playQueueIndex(this.queue.tracks.length - 1);
        }
    }

    /**
     * Seeks to a specific position in the current track
     * @param position Position in seconds
     */
    seek(position: number): void {
        this.audioPlayer.seek(position);
    }

    /**
     * Sets the volume level
     * @param level Volume level (0-1)
     */
    setVolume(level: number): void {
        this.settings.volume = Math.max(0, Math.min(1, level));
        this.audioPlayer.setVolume(this.settings.volume);
        this.emit('volume-changed', this.settings.volume);
        this.saveSettings();
    }

    /**
     * Sets mute state
     * @param muted True to mute, false to unmute
     */
    setMuted(muted: boolean): void {
        this.settings.muted = muted;
        this.audioPlayer.setMuted(muted);
        this.emit('mute-changed', muted);
        this.saveSettings();
    }

    /**
     * Toggles mute state
     */
    toggleMute(): void {
        this.setMuted(!this.settings.muted);
    }

    /**
     * Sets the playback rate
     * @param rate Playback rate (0.5-2.0)
     */
    setPlaybackRate(rate: number): void {
        // Clamp rate between 0.5 and 2.0
        this.settings.playbackRate = Math.max(0.5, Math.min(2.0, rate));
        this.audioPlayer.setPlaybackRate(this.settings.playbackRate);
        this.emit('playback-rate-changed', this.settings.playbackRate);
        this.saveSettings();
    }

    /**
     * Sets the repeat mode
     * @param mode Repeat mode
     */
    setRepeatMode(mode: RepeatMode): void {
        this.settings.repeatMode = mode;
        this.emit('repeat-mode-changed', mode);
        this.saveSettings();
    }

    /**
     * Cycles through repeat modes: NONE -> ALL -> ONE -> NONE
     */
    cycleRepeatMode(): void {
        switch (this.settings.repeatMode) {
            case RepeatMode.NONE:
                this.setRepeatMode(RepeatMode.ALL);
                break;
            case RepeatMode.ALL:
                this.setRepeatMode(RepeatMode.ONE);
                break;
            case RepeatMode.ONE:
                this.setRepeatMode(RepeatMode.NONE);
                break;
        }
    }

    /**
     * Sets the shuffle mode
     * @param mode Shuffle mode
     */
    setShuffleMode(mode: ShuffleMode): void {
        if (this.settings.shuffleMode === mode) return;

        this.settings.shuffleMode = mode;

        if (mode === ShuffleMode.ON) {
            // Save the original order before shuffling
            this.queue.originalOrder = [...this.queue.tracks];

            // Get the current track ID
            const currentTrackId = this.queue.tracks[this.queue.currentIndex];

            // Shuffle the queue
            this.shuffleArray(this.queue.tracks);

            // Make sure the current track stays in place
            if (currentTrackId) {
                const newIndex = this.queue.tracks.indexOf(currentTrackId);
                if (newIndex !== -1 && newIndex !== this.queue.currentIndex) {
                    // Swap the current track with the one at the current index
                    [
                        this.queue.tracks[newIndex],
                        this.queue.tracks[this.queue.currentIndex],
                    ] = [
                        this.queue.tracks[this.queue.currentIndex],
                        this.queue.tracks[newIndex],
                    ];
                }
            }
        } else {
            // Restore the original order
            if (this.queue.originalOrder.length > 0) {
                // Get the current track ID
                const currentTrackId =
                    this.queue.tracks[this.queue.currentIndex];

                // Restore original order
                this.queue.tracks = [...this.queue.originalOrder];

                // Update the current index to match the current track in the original order
                if (currentTrackId) {
                    this.queue.currentIndex =
                        this.queue.tracks.indexOf(currentTrackId);
                }

                this.queue.originalOrder = [];
            }
        }

        this.emit('shuffle-mode-changed', mode);
        this.emit('queue-updated', this.getQueue());
        this.saveSettings();
    }

    /**
     * Toggles shuffle mode
     */
    toggleShuffle(): void {
        this.setShuffleMode(
            this.settings.shuffleMode === ShuffleMode.OFF
                ? ShuffleMode.ON
                : ShuffleMode.OFF
        );
    }

    /**
     * Fisher-Yates shuffle algorithm
     * @param array Array to shuffle
     */
    private shuffleArray<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Sets the play queue
     * @param trackIds Array of track IDs to play
     * @param startIndex Index to start playing (default: 0)
     */
    setQueue(trackIds: string[], startIndex: number = 0): void {
        // Clear current queue
        this.queue = {
            tracks: [...trackIds],
            currentIndex: -1,
            originalOrder: [],
        };

        if (this.settings.shuffleMode === ShuffleMode.ON) {
            // Save the original order
            this.queue.originalOrder = [...trackIds];

            // Shuffle the queue, keeping the first track in place if provided
            if (startIndex === 0 && trackIds.length > 0) {
                const firstTrack = trackIds[0];
                const rest = trackIds.slice(1);
                this.shuffleArray(rest);
                this.queue.tracks = [firstTrack, ...rest];
            } else {
                this.shuffleArray(this.queue.tracks);
            }
        }

        this.emit('queue-updated', this.getQueue());

        // Start playing if requested
        if (startIndex >= 0 && trackIds.length > 0) {
            this.playQueueIndex(startIndex);
        }
    }

    /**
     * Plays a track by its ID, creating a queue with just this track
     * @param trackId Track ID to play
     */
    async playTrack(trackId: string): Promise<void> {
        const track = this.library.getTrack(trackId);
        if (!track) {
            throw new Error(`Track not found: ${trackId}`);
        }

        // Create a queue with just this track
        this.setQueue([trackId], 0);
    }

    /**
     * Plays a specific index in the current queue
     * @param index Queue index to play
     */
    async playQueueIndex(index: number): Promise<void> {
        if (index < 0 || index >= this.queue.tracks.length) {
            throw new Error(`Invalid queue index: ${index}`);
        }

        const trackId = this.queue.tracks[index];
        const track = this.library.getTrack(trackId);

        if (!track) {
            console.error(`Track not found in library: ${trackId}`);

            // Remove the missing track from the queue
            this.queue.tracks.splice(index, 1);
            this.emit('queue-updated', this.getQueue());

            // Try to play the next track if available
            if (this.queue.tracks.length > index) {
                return this.playQueueIndex(index);
            }

            return;
        }

        // Update queue index
        this.queue.currentIndex = index;

        // Load and play the track
        await this.loadAndPlayTrack(track);

        // Emit queue updated event
        this.emit('queue-updated', this.getQueue());
    }

    /**
     * Loads and plays a specific track
     * @param track Track to play
     */
    private async loadAndPlayTrack(track: Track): Promise<void> {
        try {
            this.playbackState = PlaybackState.LOADING;
            this.emit('playback-state-changed', PlaybackState.LOADING);
            this.emit('current-track-changed', track);

            // Load the audio file
            await this.audioPlayer.load(track.filePath);

            // Update current track
            this.currentTrack = track;

            // Set up visualization if we have access to the Howler implementation
            // This is an implementation detail specific to HowlerAudioPlayerService
            try {
                if (
                    typeof (this.audioPlayer as any).getAudioNode === 'function'
                ) {
                    const audioNode = (this.audioPlayer as any).getAudioNode();
                    if (audioNode) {
                        this.visualizer.initialize(audioNode);
                    }
                }
            } catch (error) {
                console.warn('Could not set up audio visualization: ', error);
            }

            // Apply current settings
            this.applySettings();

            // Start playback
            this.audioPlayer.play();
            this.playbackState = PlaybackState.PLAYING;
            this.emit('playback-state-changed', PlaybackState.PLAYING);
        } catch (error) {
            console.error(`Error playing track ${track.id}:`, error);
            this.playbackState = PlaybackState.ERROR;
            this.emit('playback-state-changed', PlaybackState.ERROR);
            this.emit('playback-error', { track, error });

            // Try to play the next track if available
            if (this.queue.currentIndex < this.queue.tracks.length - 1) {
                this.next();
            }
        }
    }

    /**
     * Adds tracks to the end of the queue
     * @param trackIds Track IDs to add
     */
    addToQueue(trackIds: string[]): void {
        // Filter out tracks that don't exist in the library
        const validTrackIds = trackIds.filter((id) =>
            this.library.getTrack(id)
        );

        if (validTrackIds.length === 0) return;

        if (this.settings.shuffleMode === ShuffleMode.ON) {
            // Add to original order
            this.queue.originalOrder.push(...validTrackIds);

            // Shuffle the new tracks before adding
            this.shuffleArray(validTrackIds);
        }

        // Add to the queue
        this.queue.tracks.push(...validTrackIds);

        this.emit('queue-updated', this.getQueue());
    }

    /**
     * Removes a track from the queue
     * @param index Index of the track to remove
     */
    removeFromQueue(index: number): void {
        if (index < 0 || index >= this.queue.tracks.length) return;

        // Get the track ID before removing
        const trackId = this.queue.tracks[index];

        // Remove from the queue
        this.queue.tracks.splice(index, 1);

        // Also remove from original order if in shuffle mode
        if (this.settings.shuffleMode === ShuffleMode.ON) {
            const originalIndex = this.queue.originalOrder.indexOf(trackId);
            if (originalIndex !== -1) {
                this.queue.originalOrder.splice(originalIndex, 1);
            }
        }

        // Adjust current index if necessary
        if (index < this.queue.currentIndex) {
            this.queue.currentIndex--;
        } else if (index === this.queue.currentIndex) {
            // We removed the current track
            if (
                this.playbackState === PlaybackState.PLAYING ||
                this.playbackState === PlaybackState.PAUSED
            ) {
                // Play the next track (which is now at the same index)
                if (index < this.queue.tracks.length) {
                    this.playQueueIndex(index);
                } else if (this.queue.tracks.length > 0) {
                    // Play the last track
                    this.playQueueIndex(this.queue.tracks.length - 1);
                } else {
                    // No more tracks
                    this.stop();
                    this.currentTrack = null;
                    this.queue.currentIndex = -1;
                }
            } else {
                this.queue.currentIndex = -1;
            }
        }

        this.emit('queue-updated', this.getQueue());
    }

    /**
     * Clears the play queue
     */
    clearQueue(): void {
        this.stop();
        this.currentTrack = null;
        this.queue = {
            tracks: [],
            currentIndex: -1,
            originalOrder: [],
        };
        this.emit('queue-updated', this.getQueue());
    }

    /**
     * Gets a copy of the current queue
     */
    getQueue(): Queue {
        return {
            tracks: [...this.queue.tracks],
            currentIndex: this.queue.currentIndex,
            originalOrder: [...this.queue.originalOrder],
        };
    }

    /**
     * Gets the current track
     */
    getCurrentTrack(): Track | null {
        return this.currentTrack;
    }

    /**
     * Gets the current playback state
     */
    getPlaybackState(): PlaybackState {
        return this.playbackState;
    }

    /**
     * Gets the current playback position
     */
    getCurrentPosition(): number {
        return this.audioPlayer.getCurrentPosition();
    }

    /**
     * Gets the duration of the current track
     */
    getDuration(): number {
        return this.audioPlayer.getDuration();
    }

    /**
     * Gets the current playback settings
     */
    getSettings(): PlaybackSettings {
        return { ...this.settings };
    }

    /**
     * Jumps forward in the current track
     * @param seconds Number of seconds to jump forward
     */
    jumpForward(seconds: number = 10): void {
        const currentPosition = this.audioPlayer.getCurrentPosition();
        const duration = this.audioPlayer.getDuration();
        const newPosition = Math.min(currentPosition + seconds, duration);
        this.audioPlayer.seek(newPosition);
    }

    /**
     * Jumps backward in the current track
     * @param seconds Number of seconds to jump backward
     */
    jumpBackward(seconds: number = 10): void {
        const currentPosition = this.audioPlayer.getCurrentPosition();
        const newPosition = Math.max(currentPosition - seconds, 0);
        this.audioPlayer.seek(newPosition);
    }

    /**
     * Cleans up resources when the manager is no longer needed
     */
    dispose(): void {
        this.stop();

        // Clean up listeners
        if (this.timeUpdateListener) {
            // No direct way to remove a specific listener in Howler,
            // but our service should handle this internally
            this.timeUpdateListener = null;
        }

        if (this.endedListener) {
            this.endedListener = null;
        }

        // Clear any pending timeouts
        if (this.saveSettingsTimeout) {
            clearTimeout(this.saveSettingsTimeout);
            this.saveSettingsTimeout = null;
        }

        // Clean up visualization
        this.visualizer.dispose();

        // Clean up audio player
        this.audioPlayer.dispose();

        // Remove all event listeners
        this.removeAllListeners();
    }
}
