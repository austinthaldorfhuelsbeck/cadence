import React from 'react';
import { useAppContext } from '../../App';

const FileExplorer: React.FC = () => {
    const { libraryManager, playbackManager } = useAppContext();
    const [isImporting, setIsImporting] = React.useState(false);
    const [tracks, setTracks] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (libraryManager) {
            // Get initial tracks
            const library = libraryManager.getLibrary();
            setTracks(library.getAllTracks());

            // Listen for library changes
            const handleLibraryUpdate = () => {
                const library = libraryManager.getLibrary();
                setTracks(library.getAllTracks());
                setIsImporting(false);
            };

            const handleScanStarted = () => {
                setIsImporting(true);
            };

            libraryManager.on('scan-completed', handleLibraryUpdate);
            libraryManager.on('scan-started', handleScanStarted);
            libraryManager.on('scan-error', () => setIsImporting(false));

            return () => {
                libraryManager.removeListener(
                    'scan-completed',
                    handleLibraryUpdate
                );
                libraryManager.removeListener(
                    'scan-started',
                    handleScanStarted
                );
                libraryManager.removeListener('scan-error', () =>
                    setIsImporting(false)
                );
            };
        }
    }, [libraryManager]);

    const handleImportClick = async () => {
        if (!libraryManager) return;

        try {
            // Open directory picker through the electron API
            const fileSystemService = (window as any).electron?.fs;
            if (fileSystemService && fileSystemService.showDirectoryPicker) {
                const directories = await fileSystemService.showDirectoryPicker(
                    {
                        title: 'Select Music Folders',
                        multiSelections: true,
                    }
                );

                if (directories && directories.length > 0) {
                    await libraryManager.importMusic(directories);
                }
            }
        } catch (error) {
            console.error('Error importing music:', error);
            setIsImporting(false);
        }
    };

    const handlePlayTrack = (trackId: string) => {
        if (playbackManager) {
            playbackManager.playTrack(trackId);
        }
    };

    return (
        <div className="file-explorer">
            <div className="toolbar">
                <button
                    onClick={handleImportClick}
                    disabled={isImporting}
                    className="import-button"
                >
                    {isImporting ? 'Importing...' : 'Import Music'}
                </button>
            </div>

            <div className="tracks-list">
                {tracks.length === 0 ? (
                    <div className="empty-state">
                        <p>No music found in your library.</p>
                        <p>Click "Import Music" to add songs.</p>
                    </div>
                ) : (
                    <table className="tracks-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Title</th>
                                <th>Artist</th>
                                <th>Album</th>
                                <th>Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tracks.map((track) => (
                                <tr
                                    key={track.id}
                                    onDoubleClick={() =>
                                        handlePlayTrack(track.id)
                                    }
                                >
                                    <td>
                                        <button
                                            className="play-button"
                                            onClick={() =>
                                                handlePlayTrack(track.id)
                                            }
                                        >
                                            ▶
                                        </button>
                                    </td>
                                    <td>{track.title}</td>
                                    <td>{track.artist}</td>
                                    <td>{track.album}</td>
                                    <td>{track.getDurationFormatted()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default FileExplorer;
