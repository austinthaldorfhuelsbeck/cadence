# Cadence

A modern, elegant music player for macOS that combines powerful music library management with beautiful visualizations.

## Project Overview

Cadence is a desktop music player application designed specifically for macOS users who appreciate both visual aesthetics and powerful organization tools. Built using Electron with React and TypeScript, the application features a clean, intuitive interface that provides a seamless way to rediscover and enjoy your music collection.

## Key Features

### Core Features
- **Music Library Management**: Load and organize your local music files with automatic metadata extraction
- **Playlist Management**: Create, edit, and customize playlists with drag-and-drop functionality
- **Playback Controls**: Enjoy enhanced playback options including speed adjustment, precision seeking, and advanced shuffle/repeat modes
- **Audio Visualization**: Experience your music visually with waveform displays and real-time spectrum analysis

### Additional Features (Coming Soon)
- Advanced search and filtering across your entire library
- Enhanced UI elements including customizable layouts and dark/light mode support
- Comprehensive keyboard shortcut system
- Metadata management for editing and batch updating
- Automatic album artwork discovery
- AirPlay integration

## Technology Stack

- **Framework**: Electron
- **Frontend**: React with TypeScript
- **Audio Processing**:
  - Howler.js (audio playback)
  - Web Audio API (advanced audio manipulation)
  - Wavesurfer.js (waveform visualization)
  - music-metadata-browser (metadata extraction)
- **State Management**: Redux
- **Data Storage**: IndexedDB

## Architecture

Cadence implements a hexagonal (ports and adapters) architecture to ensure maintainability and facilitate potential future migration to Swift. This architecture provides clear separation between:

- **Core Domain Layer**: Platform-independent models and business logic
- **Interface Layer**: Service abstractions defining interactions with external systems
- **Implementation Layer**: Framework-specific implementations of the interfaces
- **Application Coordinator Layer**: Components that connect domain models with services
- **UI Layer**: React components that interact with the application layer

This approach maximizes testability, maintainability, and creates a clear migration path should we transition to native development in the future.

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- macOS 10.15 (Catalina) or later recommended

### Installation for Development

1. Clone the repository:
   ```
   git clone https://github.com/yourorganization/cadence.git
   cd cadence
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   or
   ```
   yarn dev
   ```

### Building for Production

To create a production build:
```
npm run build
```
or
```
yarn build
```

This will create a distributable application in the `dist` folder.

## Project Structure

```
src/
├── core/                     # Core domain models and logic
│   ├── models/               # Domain entities
│   └── interfaces/           # Core interfaces
├── infrastructure/           # Service implementations
│   ├── electron/             # Electron-specific implementations
│   ├── audio/                # Audio playback implementations
│   └── storage/              # Storage implementations
├── application/              # Application coordinators
│   ├── library/              # Library management
│   ├── playback/             # Playback control
│   └── playlist/             # Playlist management
├── ui/                       # React components
│   ├── components/           # Reusable UI components
│   ├── pages/                # Main application pages
│   └── state/                # UI state management (Redux)
└── utils/                    # Utility functions and helpers
```

## Development Guidelines

### Code Style

This project follows strict TypeScript practices and uses ESLint with Prettier for code formatting. To ensure consistency:

- Run linting: `npm run lint`
- Format code: `npm run format`

### Git Workflow

- Create feature branches from `develop` using the format: `feature/feature-name`
- Submit pull requests to `develop` branch
- Use meaningful commit messages following conventional commits format

### Testing

- Write unit tests for core domain logic
- Create integration tests for service implementations
- Run tests: `npm run test`

## License

[MIT License](LICENSE)