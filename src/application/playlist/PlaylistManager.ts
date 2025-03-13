import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { StorageService } from '@core/interfaces';
import { Playlist, Library, Track } from '@core/models';

/**
 * PlaylistManager coordinates operations related to playlists.
 * It handles creating, updating, and managing playlists in the library.
 */
export class PlaylistManager extends EventEmitter {
    private playlists: Playlist[] = [];
    private systemPlaylists: Map<string, Playlist> = new Map();

    constructor(
        private storageService: StorageService,
        private library: Library
    ) {
        super();
    }

    /**
     * Initializes the playlist manager
     */
    async initialize(): Promise<void> {
        try {
            // Load playlists from storage
            const loadedPlaylists = await this.storageService.loadPlaylists();
            this.playlists = loadedPlaylists || [];

            // Create default system playlists if they don't exist
            await this.createSystemPlaylists();

            this.emit('playlists-loaded', this.getPlaylists());
        } catch (error) {
            console.error('Error initializing playlist manager:', error);
            throw error;
        }
    }

    /**
     * Creates default system playlists if they don't exist
     */
    private async createSystemPlaylists(): Promise<void> {
        const systemPlaylistsConfig = [
            {
                id: 'recently-added',
                name: 'Recently Added',
                description: 'Tracks added in the last 30 days',
                color: '#5D93E1',
                isSystem: true,
            },
            {
                id: 'recently-played',
                name: 'Recently Played',
                description: 'Your recently played tracks',
                color: '#9C69E2',
                isSystem: true,
            },
            {
                id: 'most-played',
                name: 'Most Played',
                description: 'Your most played tracks',
                color: '#F2994A',
                isSystem: true,
            },
            {
                id: 'favorites',
                name: 'Favorites',
                description: 'Your favorite tracks',
                color: '#E15241',
                isSystem: true,
            },
        ];

        let createdNewPlaylist = false;

        for (const config of systemPlaylistsConfig) {
            let playlist = this.getPlaylistById(config.id);

            if (!playlist) {
                // Create new system playlist
                playlist = new Playlist({
                    id: config.id,
                    name: config.name,
                    description: config.description,
                    color: config.color,
                    isSystem: true,
                });

                this.playlists.push(playlist);
                createdNewPlaylist = true;
            }

            // Store reference in the system playlists map
            this.systemPlaylists.set(config.id, playlist);
        }

        // Save if we created any new playlists
        if (createdNewPlaylist) {
            await this.savePlaylists();
        }

        // Update system playlists
        await this.updateSystemPlaylists();
    }

    /**
     * Updates the system playlists with current tracks
     */
    async updateSystemPlaylists(): Promise<void> {
        try {
            const allTracks = this.library.getAllTracks();

            // Recently Added (last 30 days)
            const recentlyAdded = this.systemPlaylists.get('recently-added');
            if (recentlyAdded) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const recentTracks = allTracks
                    .filter((track) => track.dateAdded >= thirtyDaysAgo)
                    .sort(
                        (a, b) => b.dateAdded.getTime() - a.dateAdded.getTime()
                    )
                    .slice(0, 100) // Limit to 100 tracks
                    .map((track) => track.id);

                recentlyAdded.trackIds = recentTracks;
                await this.storageService.savePlaylist(recentlyAdded);
            }

            // Recently Played
            const recentlyPlayed = this.systemPlaylists.get('recently-played');
            if (recentlyPlayed) {
                const recentlyPlayedTracks = allTracks
                    .filter((track) => track.lastPlayed !== undefined)
                    .sort((a, b) => {
                        // Safe sort with undefined values
                        if (!a.lastPlayed) return 1;
                        if (!b.lastPlayed) return -1;
                        return b.lastPlayed.getTime() - a.lastPlayed.getTime();
                    })
                    .slice(0, 100) // Limit to 100 tracks
                    .map((track) => track.id);

                recentlyPlayed.trackIds = recentlyPlayedTracks;
                await this.storageService.savePlaylist(recentlyPlayed);
            }

            // Most Played
            const mostPlayed = this.systemPlaylists.get('most-played');
            if (mostPlayed) {
                const mostPlayedTracks = allTracks
                    .filter((track) => track.playCount > 0)
                    .sort((a, b) => b.playCount - a.playCount)
                    .slice(0, 100) // Limit to 100 tracks
                    .map((track) => track.id);

                mostPlayed.trackIds = mostPlayedTracks;
                await this.storageService.savePlaylist(mostPlayed);
            }

            // Favorites (we don't auto-update this one, users manage it)

            // Notify listeners that playlists have been updated
            this.emit('system-playlists-updated');
        } catch (error) {
            console.error('Error updating system playlists:', error);
        }
    }

    /**
     * Creates a new user playlist
     * @param name Playlist name
     * @param description Optional playlist description
     * @param color Optional playlist color
     * @returns The newly created playlist
     */
    async createPlaylist(
        name: string,
        description?: string,
        color?: string
    ): Promise<Playlist> {
        // Create a new playlist with a unique ID
        const playlist = new Playlist({
            id: uuidv4(),
            name,
            description,
            color,
            isSystem: false,
        });

        // Add to playlists collection
        this.playlists.push(playlist);

        // Save to storage
        await this.storageService.savePlaylist(playlist);

        // Notify listeners
        this.emit('playlist-created', playlist);

        return playlist;
    }

    /**
     * Updates an existing playlist
     * @param id Playlist ID
     * @param updates Object with updates to apply
     * @returns The updated playlist
     */
    async updatePlaylist(
        id: string,
        updates: {
            name?: string;
            description?: string;
            color?: string;
        }
    ): Promise<Playlist> {
        const playlist = this.getPlaylistById(id);

        if (!playlist) {
            throw new Error(`Playlist not found: ${id}`);
        }

        // Don't allow modifying system playlists' core properties
        if (
            playlist.isSystem &&
            (updates.name !== undefined || updates.description !== undefined)
        ) {
            throw new Error(
                'Cannot modify name or description of system playlists'
            );
        }

        // Apply updates
        if (updates.name !== undefined) {
            playlist.rename(updates.name);
        }

        if (updates.description !== undefined) {
            playlist.setDescription(updates.description);
        }

        if (updates.color !== undefined) {
            playlist.setColor(updates.color);
        }

        // Save changes
        await this.storageService.savePlaylist(playlist);

        // Notify listeners
        this.emit('playlist-updated', playlist);

        return playlist;
    }

    /**
     * Deletes a playlist
     * @param id Playlist ID
     * @returns True if the playlist was deleted
     */
    async deletePlaylist(id: string): Promise<boolean> {
        const index = this.playlists.findIndex((p) => p.id === id);

        if (index === -1) {
            return false;
        }

        const playlist = this.playlists[index];

        // Don't allow deleting system playlists
        if (playlist.isSystem) {
            throw new Error('Cannot delete system playlists');
        }

        // Remove from collection
        this.playlists.splice(index, 1);

        // Delete from storage
        await this.storageService.deletePlaylist(id);

        // Notify listeners
        this.emit('playlist-deleted', id);

        return true;
    }

    /**
     * Adds tracks to a playlist
     * @param playlistId Playlist ID
     * @param trackIds Track IDs to add
     * @returns The updated playlist
     */
    async addTracksToPlaylist(
        playlistId: string,
        trackIds: string[]
    ): Promise<Playlist> {
        const playlist = this.getPlaylistById(playlistId);

        if (!playlist) {
            throw new Error(`Playlist not found: ${playlistId}`);
        }

        // Filter out any invalid track IDs
        const validTrackIds = trackIds.filter(
            (id) => this.library.getTrack(id) !== undefined
        );

        if (validTrackIds.length === 0) {
            return playlist; // No valid tracks to add
        }

        // Add tracks to playlist
        playlist.addTracks(validTrackIds);

        // Save changes
        await this.storageService.savePlaylist(playlist);

        // Notify listeners
        this.emit('playlist-tracks-added', {
            playlistId,
            trackIds: validTrackIds,
        });

        return playlist;
    }

    /**
     * Removes tracks from a playlist
     * @param playlistId Playlist ID
     * @param trackIds Track IDs to remove
     * @returns The updated playlist
     */
    async removeTracksFromPlaylist(
        playlistId: string,
        trackIds: string[]
    ): Promise<Playlist> {
        const playlist = this.getPlaylistById(playlistId);

        if (!playlist) {
            throw new Error(`Playlist not found: ${playlistId}`);
        }

        let tracksRemoved = false;

        // Remove each track
        for (const trackId of trackIds) {
            if (playlist.removeTrack(trackId)) {
                tracksRemoved = true;
            }
        }

        if (!tracksRemoved) {
            return playlist; // No tracks were removed
        }

        // Save changes
        await this.storageService.savePlaylist(playlist);

        // Notify listeners
        this.emit('playlist-tracks-removed', {
            playlistId,
            trackIds,
        });

        return playlist;
    }

    /**
     * Reorders a track within a playlist
     * @param playlistId Playlist ID
     * @param fromIndex Current position
     * @param toIndex New position
     * @returns The updated playlist
     */
    async reorderPlaylistTrack(
        playlistId: string,
        fromIndex: number,
        toIndex: number
    ): Promise<Playlist> {
        const playlist = this.getPlaylistById(playlistId);

        if (!playlist) {
            throw new Error(`Playlist not found: ${playlistId}`);
        }

        // Move the track
        const moved = playlist.moveTrack(fromIndex, toIndex);

        if (!moved) {
            return playlist; // Track wasn't moved
        }

        // Save changes
        await this.storageService.savePlaylist(playlist);

        // Notify listeners
        this.emit('playlist-reordered', {
            playlistId,
            fromIndex,
            toIndex,
        });

        return playlist;
    }

    /**
     * Gets all playlists
     * @param includeSystemPlaylists Whether to include system playlists (default: true)
     * @returns Array of playlists
     */
    getPlaylists(includeSystemPlaylists: boolean = true): Playlist[] {
        if (includeSystemPlaylists) {
            return [...this.playlists];
        } else {
            return this.playlists.filter((p) => !p.isSystem);
        }
    }

    /**
     * Gets a playlist by ID
     * @param id Playlist ID
     * @returns Playlist or undefined if not found
     */
    getPlaylistById(id: string): Playlist | undefined {
        return this.playlists.find((p) => p.id === id);
    }

    /**
     * Gets tracks for a specific playlist
     * @param playlistId Playlist ID
     * @returns Array of tracks or empty array if playlist not found
     */
    getPlaylistTracks(playlistId: string): Track[] {
        const playlist = this.getPlaylistById(playlistId);

        if (!playlist) {
            return [];
        }

        return this.library.getTracksByPlaylist(playlistId);
    }

    /**
     * Adds or removes a track from the favorites playlist
     * @param trackId Track ID to toggle
     * @returns True if track was added, false if it was removed
     */
    async toggleFavorite(trackId: string): Promise<boolean> {
        const favoritesPlaylist = this.systemPlaylists.get('favorites');

        if (!favoritesPlaylist) {
            throw new Error('Favorites playlist not found');
        }

        const isCurrentlyFavorite =
            favoritesPlaylist.trackIds.includes(trackId);

        if (isCurrentlyFavorite) {
            // Remove from favorites
            favoritesPlaylist.removeTrack(trackId);
        } else {
            // Add to favorites
            favoritesPlaylist.addTrack(trackId);
        }

        // Save changes
        await this.storageService.savePlaylist(favoritesPlaylist);

        // Notify listeners
        this.emit('favorite-toggled', {
            trackId,
            isFavorite: !isCurrentlyFavorite,
        });

        return !isCurrentlyFavorite;
    }

    /**
     * Checks if a track is in the favorites playlist
     * @param trackId Track ID to check
     * @returns True if the track is a favorite
     */
    isFavorite(trackId: string): boolean {
        const favoritesPlaylist = this.systemPlaylists.get('favorites');
        return favoritesPlaylist
            ? favoritesPlaylist.trackIds.includes(trackId)
            : false;
    }

    /**
     * Creates a new playlist with tracks from an album
     * @param albumId Album ID
     * @returns The newly created playlist
     */
    async createPlaylistFromAlbum(albumId: string): Promise<Playlist> {
        const album = this.library.getAlbum(albumId);

        if (!album) {
            throw new Error(`Album not found: ${albumId}`);
        }

        // Create a new playlist with the album name
        const playlist = await this.createPlaylist(
            `${album.title} - ${album.artist}`,
            `Playlist created from album ${album.title}`
        );

        // Get tracks from the album
        const tracks = this.library.getTracksByAlbum(albumId);
        const trackIds = tracks.map((track) => track.id);

        // Add tracks to the playlist
        if (trackIds.length > 0) {
            await this.addTracksToPlaylist(playlist.id, trackIds);
        }

        return playlist;
    }

    /**
     * Creates a new playlist with tracks from an artist
     * @param artistId Artist ID
     * @returns The newly created playlist
     */
    async createPlaylistFromArtist(artistId: string): Promise<Playlist> {
        const artist = this.library.getArtist(artistId);

        if (!artist) {
            throw new Error(`Artist not found: ${artistId}`);
        }

        // Create a new playlist with the artist name
        const playlist = await this.createPlaylist(
            artist.name,
            `Playlist created from artist ${artist.name}`
        );

        // Get tracks from the artist
        const tracks = this.library.getTracksByArtist(artistId);
        const trackIds = tracks.map((track) => track.id);

        // Add tracks to the playlist
        if (trackIds.length > 0) {
            await this.addTracksToPlaylist(playlist.id, trackIds);
        }

        return playlist;
    }

    /**
     * Saves all playlists to storage
     */
    private async savePlaylists(): Promise<void> {
        await this.storageService.savePlaylists(this.playlists);
    }

    /**
     * Cleans up resources when the manager is no longer needed
     */
    dispose(): void {
        this.removeAllListeners();
    }
}
