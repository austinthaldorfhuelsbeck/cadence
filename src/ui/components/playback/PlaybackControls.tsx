import React from 'react';
import { useAppContext } from '../../App';
import {
    PlaybackState,
    RepeatMode,
    ShuffleMode,
} from '@core/types/PlaybackTypes';

const PlaybackControls: React.FC = () => {
    const { playbackManager } = useAppContext();
    const [currentTrack, setCurrentTrack] = React.useState<any>(null);
    const [playbackState, setPlaybackState] = React.useState<PlaybackState>(
        PlaybackState.IDLE
    );
    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);
    const [repeatMode, setRepeatMode] = React.useState<RepeatMode>(
        RepeatMode.NONE
    );
    const [shuffleMode, setShuffleMode] = React.useState<ShuffleMode>(
        ShuffleMode.OFF
    );

    React.useEffect(() => {
        if (!playbackManager) return;

        // Initial state
        setCurrentTrack(playbackManager.getCurrentTrack());
        setPlaybackState(playbackManager.getPlaybackState());
        setCurrentTime(playbackManager.getCurrentPosition());
        setDuration(playbackManager.getDuration());

        const settings = playbackManager.getSettings();
        setRepeatMode(settings.repeatMode);
        setShuffleMode(settings.shuffleMode);

        // Set up event listeners
        const handleTrackChange = (track: any) => setCurrentTrack(track);
        const handlePlaybackStateChange = (state: PlaybackState) =>
            setPlaybackState(state);
        const handleTimeUpdate = (data: {
            position: number;
            duration: number;
        }) => {
            setCurrentTime(data.position);
            setDuration(data.duration);
        };
        const handleRepeatModeChange = (mode: RepeatMode) =>
            setRepeatMode(mode);
        const handleShuffleModeChange = (mode: ShuffleMode) =>
            setShuffleMode(mode);

        playbackManager.on('current-track-changed', handleTrackChange);
        playbackManager.on('playback-state-changed', handlePlaybackStateChange);
        playbackManager.on('time-update', handleTimeUpdate);
        playbackManager.on('repeat-mode-changed', handleRepeatModeChange);
        playbackManager.on('shuffle-mode-changed', handleShuffleModeChange);

        return () => {
            playbackManager.removeListener(
                'current-track-changed',
                handleTrackChange
            );
            playbackManager.removeListener(
                'playback-state-changed',
                handlePlaybackStateChange
            );
            playbackManager.removeListener('time-update', handleTimeUpdate);
            playbackManager.removeListener(
                'repeat-mode-changed',
                handleRepeatModeChange
            );
            playbackManager.removeListener(
                'shuffle-mode-changed',
                handleShuffleModeChange
            );
        };
    }, [playbackManager]);

    const handlePlayPause = () => {
        if (playbackManager) {
            playbackManager.togglePlayPause();
        }
    };

    const handlePrevious = () => {
        if (playbackManager) {
            playbackManager.previous();
        }
    };

    const handleNext = () => {
        if (playbackManager) {
            playbackManager.next();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (playbackManager) {
            playbackManager.seek(parseFloat(e.target.value));
        }
    };

    const handleRepeatClick = () => {
        if (playbackManager) {
            playbackManager.cycleRepeatMode();
        }
    };

    const handleShuffleClick = () => {
        if (playbackManager) {
            playbackManager.toggleShuffle();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="playback-controls">
            <div className="now-playing">
                {currentTrack ? (
                    <>
                        <div className="track-artwork">
                            {/* If we had artwork, it would go here */}
                        </div>
                        <div className="track-info">
                            <div className="track-title">
                                {currentTrack.title}
                            </div>
                            <div className="track-artist">
                                {currentTrack.artist}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="no-track">No track playing</div>
                )}
            </div>

            <div className="controls-center">
                <div className="playback-buttons">
                    <button
                        className={`shuffle-button ${
                            shuffleMode === ShuffleMode.ON ? 'active' : ''
                        }`}
                        onClick={handleShuffleClick}
                        title="Shuffle"
                    >
                        🔀
                    </button>
                    <button
                        className="previous-button"
                        onClick={handlePrevious}
                        title="Previous"
                    >
                        ⏮
                    </button>
                    <button
                        className="play-pause-button"
                        onClick={handlePlayPause}
                        title={
                            playbackState === PlaybackState.PLAYING
                                ? 'Pause'
                                : 'Play'
                        }
                    >
                        {playbackState === PlaybackState.PLAYING ? '⏸' : '▶'}
                    </button>
                    <button
                        className="next-button"
                        onClick={handleNext}
                        title="Next"
                    >
                        ⏭
                    </button>
                    <button
                        className={`repeat-button ${
                            repeatMode !== RepeatMode.NONE ? 'active' : ''
                        }`}
                        onClick={handleRepeatClick}
                        title={
                            repeatMode === RepeatMode.ONE
                                ? 'Repeat One'
                                : repeatMode === RepeatMode.ALL
                                ? 'Repeat All'
                                : 'Repeat'
                        }
                    >
                        {repeatMode === RepeatMode.ONE ? '🔂' : '🔁'}
                    </button>
                </div>

                <div className="timeline">
                    <span className="current-time">
                        {formatTime(currentTime)}
                    </span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 1}
                        value={currentTime}
                        onChange={handleSeek}
                        className="seek-slider"
                    />
                    <span className="duration">{formatTime(duration)}</span>
                </div>
            </div>

            <div className="controls-right">
                {/* Additional controls like volume, etc */}
            </div>
        </div>
    );
};

export default PlaybackControls;
