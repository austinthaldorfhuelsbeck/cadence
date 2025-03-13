import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../App';
import { useUI } from '../../context/UIContext';
import { Album } from '@core/models';

const AlbumGrid: React.FC = () => {
    const { libraryManager, playbackManager } = useAppContext();
    const { setView, setSelectedItemId } = useUI();
    const [albums, setAlbums] = useState<Album[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (libraryManager) {
            setIsLoading(true);
            // Get initial albums
            const library = libraryManager.getLibrary();
            setAlbums(library.getAllAlbums());
            setIsLoading(false);

            // Listen for library changes
            const handleLibraryUpdate = () => {
                const library = libraryManager.getLibrary();
                setAlbums(library.getAllAlbums());
            };

            libraryManager.on('scan-completed', handleLibraryUpdate);

            return () => {
                libraryManager.removeListener(
                    'scan-completed',
                    handleLibraryUpdate
                );
            };
        }
    }, [libraryManager]);

    const handleAlbumClick = (albumId: string) => {
        setSelectedItemId(albumId);
        setView('album');
    };

    const handlePlayAlbum = (albumId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (libraryManager && playbackManager) {
            const tracks = libraryManager
                .getLibrary()
                .getTracksByAlbum(albumId);
            if (tracks.length > 0) {
                const trackIds = tracks.map((track) => track.id);
                playbackManager.setQueue(trackIds, 0);
            }
        }
    };

    if (isLoading) {
        return <div className="loading">Loading albums...</div>;
    }

    return (
        <div className="album-grid">
            {albums.length === 0 ? (
                <div className="empty-state">
                    <p>No albums found in your library.</p>
                    <p>Import music to see albums here.</p>
                </div>
            ) : (
                <div className="albums-container">
                    {albums.map((album) => (
                        <div
                            key={album.id}
                            className="album-card"
                            onClick={() => handleAlbumClick(album.id)}
                        >
                            <div className="album-artwork">
                                {album.hasArtwork ? (
                                    <img
                                        src={`artwork://album/${album.id}`}
                                        alt={album.title}
                                    />
                                ) : (
                                    <div className="default-artwork">
                                        <span>{album.title[0]}</span>
                                    </div>
                                )}
                                <div className="album-play-overlay">
                                    <button
                                        className="album-play-button"
                                        onClick={(e) =>
                                            handlePlayAlbum(album.id, e)
                                        }
                                    >
                                        ▶
                                    </button>
                                </div>
                            </div>
                            <div className="album-info">
                                <div className="album-title">{album.title}</div>
                                <div className="album-artist">
                                    {album.artist}
                                </div>
                                {album.year && (
                                    <div className="album-year">
                                        {album.year}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AlbumGrid;
