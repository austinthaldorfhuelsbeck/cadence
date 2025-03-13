import React, { useEffect, useState } from 'react';
import { ApplicationContainer } from '@application/ApplicationContainer';
import { LibraryManager } from '@application/library/LibraryManager';
import { PlaybackManager } from '@application/playback/PlaybackManager';
import { PlaylistManager } from '@application/playlist/PlaylistManager';

// Create application context to provide managers throughout the app
interface ApplicationContext {
    libraryManager: LibraryManager | null;
    playbackManager: PlaybackManager | null;
    playlistManager: PlaylistManager | null;
    isInitialized: boolean;
    error: Error | null;
}

const AppContext = React.createContext<ApplicationContext>({
    libraryManager: null,
    playbackManager: null,
    playlistManager: null,
    isInitialized: false,
    error: null,
});

export const useAppContext = () => React.useContext(AppContext);

// Main application component
const App: React.FC = () => {
    const [appState, setAppState] = useState<ApplicationContext>({
        libraryManager: null,
        playbackManager: null,
        playlistManager: null,
        isInitialized: false,
        error: null,
    });

    useEffect(() => {
        // Initialize the application on component mount
        const initializeApp = async () => {
            try {
                const appContainer = ApplicationContainer.getInstance();
                await appContainer.initialize();

                setAppState({
                    libraryManager: appContainer.getLibraryManager(),
                    playbackManager: appContainer.getPlaybackManager(),
                    playlistManager: appContainer.getPlaylistManager(),
                    isInitialized: true,
                    error: null,
                });
            } catch (error) {
                console.error('Failed to initialize application:', error);
                setAppState((prev) => ({
                    ...prev,
                    error:
                        error instanceof Error
                            ? error
                            : new Error('Unknown error initializing app'),
                }));
            }
        };

        initializeApp();

        // Cleanup on unmount
        return () => {
            try {
                const appContainer = ApplicationContainer.getInstance();
                appContainer.dispose();
            } catch (error) {
                console.error('Error during application cleanup:', error);
            }
        };
    }, []);

    // Handle electron events from main process
    useEffect(() => {
        const handleImportDirectories = async (directories: string[]) => {
            if (appState.libraryManager && directories.length > 0) {
                try {
                    await appState.libraryManager.importMusic(directories);
                } catch (error) {
                    console.error('Error importing music:', error);
                }
            }
        };

        // Set up electron event listeners
        window.electron.app.on('import-directories', handleImportDirectories);

        return () => {
            window.electron.app.removeAllListeners('import-directories');
        };
    }, [appState.libraryManager]);

    // Loading screen
    if (!appState.isInitialized) {
        return (
            <div className="loading-screen">
                <h1>Cadence</h1>
                <p>Initializing application...</p>
                {appState.error && (
                    <div className="error-message">
                        <h3>Error Initializing Application</h3>
                        <p>{appState.error.message}</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <AppContext.Provider value={appState}>
            <div className="app-container">
                {/* Main app UI components would go here */}
                <header className="app-header">
                    <h1>Cadence</h1>
                    {/* Header controls */}
                </header>

                <div className="app-content">
                    {/* Main content area with router/navigation */}
                    {/* This would contain the Library, Playlists, and other views */}
                </div>

                <footer className="playback-controls">
                    {/* Playback controls and now playing info */}
                </footer>
            </div>
        </AppContext.Provider>
    );
};

export default App;
