export enum PlaybackState {
    IDLE = 'idle',
    LOADING = 'loading',
    PLAYING = 'playing',
    PAUSED = 'paused',
    STOPPED = 'stopped',
    ERROR = 'error',
}

export enum RepeatMode {
    NONE = 'none',
    ONE = 'one',
    ALL = 'all',
}

export enum ShuffleMode {
    OFF = 'off',
    ON = 'on',
}

export interface PlaybackSettings {
    volume: number;
    muted: boolean;
    playbackRate: number;
    repeatMode: RepeatMode;
    shuffleMode: ShuffleMode;
    equalizerSettings?: EqualizerSettings;
}

export interface EqualizerSettings {
    enabled: boolean;
    bands: EqualizerBand[];
    preset?: string;
}

export interface EqualizerBand {
    frequency: number;
    gain: number;
}

export interface Queue {
    tracks: string[]; // Track IDs
    currentIndex: number;
    originalOrder: string[]; // For returning from shuffle
}
