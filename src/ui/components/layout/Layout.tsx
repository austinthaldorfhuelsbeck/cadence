import React from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import PlaybackControls from '../playback/PlaybackControls';
import { useTheme } from '../../context/ThemeContext';

interface LayoutProps {
    children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="app-layout">
            <div className="app-main">
                <Sidebar />
                <MainContent>
                    <div className="theme-toggle">
                        <button onClick={toggleTheme}>
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                    </div>
                    {children}
                </MainContent>
            </div>
            <PlaybackControls />
        </div>
    );
};

export default Layout;
