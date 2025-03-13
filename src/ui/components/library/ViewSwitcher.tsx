import React from 'react';
import { useUI } from '../../context/UIContext';
import FileExplorer from './FileExplorer';
import AlbumGrid from './AlbumGrid';
import ArtistList from './ArtistList';

// These are stub components that would need to be implemented
const AlbumDetails: React.FC<{ albumId: string | null }> = () => (
    <div>Album Details Coming Soon</div>
);
const ArtistDetails: React.FC<{ artistId: string | null }> = () => (
    <div>Artist Details Coming Soon</div>
);
const PlaylistDetails: React.FC<{ playlistId: string | null }> = () => (
    <div>Playlist Details Coming Soon</div>
);

const ViewSwitcher: React.FC = () => {
    const { currentView, selectedItemId } = useUI();

    // Render the appropriate view based on the current view state
    switch (currentView) {
        case 'songs':
            return <FileExplorer />;
        case 'albums':
            return <AlbumGrid />;
        case 'artists':
            return <ArtistList />;
        case 'album':
            return <AlbumDetails albumId={selectedItemId} />;
        case 'artist':
            return <ArtistDetails artistId={selectedItemId} />;
        case 'playlist':
            return <PlaylistDetails playlistId={selectedItemId} />;
        default:
            return <FileExplorer />;
    }
};

export default ViewSwitcher;
