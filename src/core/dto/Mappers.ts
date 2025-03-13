import { Track, Album, Artist, Playlist, Library } from '@core/models';
import {
    TrackDTO,
    AlbumDTO,
    ArtistDTO,
    PlaylistDTO,
    LibraryStatsDTO,
} from '@core/dto/LibraryDTOs';

export class DTOMappers {
    static toTrackDTO(track: Track): TrackDTO {
        return {
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album,
            duration: track.duration,
            artworkUrl: track.hasArtwork
                ? `artwork://track/${track.id}`
                : undefined,
            format: track.format,
        };
    }

    static toAlbumDTO(album: Album, trackCount: number): AlbumDTO {
        return {
            id: album.id,
            title: album.title,
            artist: album.artist,
            year: album.year,
            artworkUrl: album.hasArtwork
                ? `artwork://album/${album.id}`
                : undefined,
            trackCount,
        };
    }

    static toArtistDTO(
        artist: Artist,
        albumCount: number,
        trackCount: number
    ): ArtistDTO {
        return {
            id: artist.id,
            name: artist.name,
            albumCount,
            trackCount,
            imageUrl: artist.imagePath
                ? `artwork://artist/${artist.id}`
                : undefined,
        };
    }

    static toPlaylistDTO(playlist: Playlist, trackCount: number): PlaylistDTO {
        return {
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            trackCount,
            artworkUrl: playlist.artworkPath
                ? `artwork://playlist/${playlist.id}`
                : undefined,
            color: playlist.color,
            isSystem: playlist.isSystem,
        };
    }

    static toLibraryStatsDTO(library: Library): LibraryStatsDTO {
        return library.getStatistics();
    }
}
