import React from 'react';
import { useAppContext } from '../../App';
import { useUI } from '../../context/UIContext';

const Sidebar: React.FC = () => {
    const { playlistManager } = useAppContext();
    const { setView, currentView, selectedItemId, setSelectedItemId } = useUI();
    const [playlists, setPlaylists] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (playlistManager) {
            // Get playlists and set state
            setPlaylists(playlistManager.getPlaylists());

            // Listen for changes to playlists
            const handlePlaylistsUpdated = () => {
                setPlaylists(playlistManager.getPlaylists());
            };

            playlistManager.on('playlist-created', handlePlaylistsUpdated);
            playlistManager.on('playlist-deleted', handlePlaylistsUpdated);
            playlistManager.on(
                'system-playlists-updated',
                handlePlaylistsUpdated
            );

            return () => {
                playlistManager.removeListener(
                    'playlist-created',
                    handlePlaylistsUpdated
                );
                playlistManager.removeListener(
                    'playlist-deleted',
                    handlePlaylistsUpdated
                );
                playlistManager.removeListener(
                    'system-playlists-updated',
                    handlePlaylistsUpdated
                );
            };
        }
    }, [playlistManager]);

    return (
        <div className="sidebar">
            <div className="logo">
                <h2>Cadence</h2>
            </div>

            <nav className="nav-section">
                <h3>Library</h3>
                <ul>
                    <li
                        className={currentView === 'songs' ? 'active' : ''}
                        onClick={() => setView('songs')}
                    >
                        Songs
                    </li>
                    <li
                        className={currentView === 'albums' ? 'active' : ''}
                        onClick={() => setView('albums')}
                    >
                        Albums
                    </li>
                    <li
                        className={currentView === 'artists' ? 'active' : ''}
                        onClick={() => setView('artists')}
                    >
                        Artists
                    </li>
                </ul>
            </nav>

            <nav className="nav-section">
                <div className="section-header">
                    <h3>Playlists</h3>
                    <button className="small-button">+</button>
                </div>
                <ul>
                    {playlists.map((playlist) => (
                        <li
                            key={playlist.id}
                            className={
                                currentView === 'playlist' &&
                                selectedItemId === playlist.id
                                    ? 'active'
                                    : ''
                            }
                            onClick={() => {
                                setSelectedItemId(playlist.id);
                                setView('playlist');
                            }}
                        >
                            {playlist.name}
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="volume-control">
                {/* Volume slider will go here */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    className="volume-slider"
                />
            </div>
        </div>
    );
};

export default Sidebar;
