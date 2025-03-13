import React, { createContext, useState, useContext } from 'react';

type View =
    | 'songs'
    | 'albums'
    | 'artists'
    | 'playlists'
    | 'playlist'
    | 'album'
    | 'artist';

interface UIContextType {
    currentView: View;
    setView: (view: View) => void;
    selectedItemId: string | null;
    setSelectedItemId: (id: string | null) => void;
    isDrawerOpen: boolean;
    toggleDrawer: () => void;
}

const UIContext = createContext<UIContextType>({
    currentView: 'songs',
    setView: () => {},
    selectedItemId: null,
    setSelectedItemId: () => {},
    isDrawerOpen: false,
    toggleDrawer: () => {},
});

export const useUI = () => useContext(UIContext);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [currentView, setCurrentView] = useState<View>('songs');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const setView = (view: View) => {
        setCurrentView(view);
        // Reset selected item when changing views
        setSelectedItemId(null);
    };

    const toggleDrawer = () => {
        setIsDrawerOpen((prev) => !prev);
    };

    return (
        <UIContext.Provider
            value={{
                currentView,
                setView,
                selectedItemId,
                setSelectedItemId,
                isDrawerOpen,
                toggleDrawer,
            }}
        >
            {children}
        </UIContext.Provider>
    );
};
