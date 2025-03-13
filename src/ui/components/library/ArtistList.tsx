import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../App';
import { useUI } from '../../context/UIContext';
import { Artist } from '@core/models';

const ArtistList: React.FC = () => {
    const { libraryManager, playbackManager } = useAppContext();
    const { setView, setSelectedItemId } = useUI();
    const [artists, setArtists] = useState<Artist[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (libraryManager) {
            setIsLoading(true);
            // Get initial artists
            const library = libraryManager.getLibrary();
            setArtists(library.getAllArtists());
            setIsLoading(false);

            // Listen for library changes
            const handleLibraryUpdate = () => {
                const library = libraryManager.getLibrary();
                setArtists(library.getAllArtists());
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

    const handleArtistClick = (artistId: string) => {
        setSelectedItemId(artistId);
        setView('artist');
    };

    const handlePlayArtist = (artistId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (libraryManager && playbackManager) {
            const tracks = libraryManager
                .getLibrary()
                .getTracksByArtist(artistId);
            if (tracks.length > 0) {
                const trackIds = tracks.map((track) => track.id);
                playbackManager.setQueue(trackIds, 0);
            }
        }
    };

    if (isLoading) {
        return <div className="loading">Loading artists...</div>;
    }

    return (
        <div className="artist-list">
            {artists.length === 0 ? (
                <div className="empty-state">
                    <p>No artists found in your library.</p>
                    <p>Import music to see artists here.</p>
                </div>
            ) : (
                <div className="artists-container">
                    {artists.map((artist) => (
                        <div
                            key={artist.id}
                            className="artist-card"
                            onClick={() => handleArtistClick(artist.id)}
                        >
                            <div className="artist-image">
                                {artist.imagePath ? (
                                    <img
                                        src={`artwork://artist/${artist.id}`}
                                        alt={artist.name}
                                    />
                                ) : (
                                    <div className="default-artist-image">
                                        <span>{artist.name[0]}</span>
                                    </div>
                                )}
                            </div>
                            <div className="artist-info">
                                <div className="artist-name">{artist.name}</div>
                                <div className="artist-counts">
                                    {artist.getAlbumCount()}{' '}
                                    {artist.getAlbumCount() === 1
                                        ? 'Album'
                                        : 'Albums'}{' '}
                                    • {artist.getTrackCount()}{' '}
                                    {artist.getTrackCount() === 1
                                        ? 'Song'
                                        : 'Songs'}
                                </div>
                            </div>
                            <button
                                className="artist-play-button"
                                onClick={(e) => handlePlayArtist(artist.id, e)}
                                title="Play all"
                            >
                                ▶
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ArtistList;
