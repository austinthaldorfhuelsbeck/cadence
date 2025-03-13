import React from 'react';

interface MainContentProps {
    children?: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
    return (
        <main className="main-content">
            <div className="content-header">
                <div className="search-bar">
                    <input type="text" placeholder="Search..." />
                </div>
                <div className="view-controls">
                    {/* View toggles will go here */}
                </div>
            </div>
            <div className="content-body">{children}</div>
        </main>
    );
};

export default MainContent;
