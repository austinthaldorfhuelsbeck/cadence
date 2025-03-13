export interface TrackDTO {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration: number;
    artworkUrl?: string;
    format: string;
}

export interface AlbumDTO {
    id: string;
    title: string;
    artist: string;
    year?: number;
    artworkUrl?: string;
    trackCount: number;
}

export interface ArtistDTO {
    id: string;
    name: string;
    albumCount: number;
    trackCount: number;
    imageUrl?: string;
}

export interface PlaylistDTO {
    id: string;
    name: string;
    description?: string;
    trackCount: number;
    artworkUrl?: string;
    color?: string;
    isSystem: boolean;
}

export interface LibraryStatsDTO {
    trackCount: number;
    albumCount: number;
    artistCount: number;
    playlistCount: number;
    totalDuration: number;
    totalSize: number;
    lastUpdated: Date;
}
