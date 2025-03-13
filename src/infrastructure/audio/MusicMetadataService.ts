import { MetadataService, AudioMetadata } from '@core/interfaces';
import * as musicMetadata from 'music-metadata-browser';

export class MusicMetadataService implements MetadataService {
    // Supported audio file extensions
    private supportedExtensions = [
        'mp3',
        'flac',
        'wav',
        'ogg',
        'm4a',
        'aac',
        'opus',
        'wma',
    ];

    async extractMetadata(filePath: string): Promise<AudioMetadata> {
        try {
            // Read the file using the FileSystemService through electron's APIs
            const buffer = await window.electron.fs.readFile(filePath);

            // Get the file extension
            const fileType = this.getFileExtension(filePath);

            return this.extractMetadataFromBuffer(buffer, fileType);
        } catch (error) {
            console.error(`Error extracting metadata from ${filePath}:`, error);
            throw error;
        }
    }

    async extractMetadataFromBuffer(
        buffer: ArrayBuffer,
        fileType: string
    ): Promise<AudioMetadata> {
        try {
            // Convert ArrayBuffer to Uint8Array as required by music-metadata
            const uint8Array = new Uint8Array(buffer);

            // Use music-metadata library to parse the buffer
            const metadata = await musicMetadata.parseBuffer(uint8Array, {
                mimeType: this.getMimeType(fileType),
            });

            // Convert to our domain model format
            const result: AudioMetadata = {
                title: metadata.common.title,
                artist: metadata.common.artist,
                albumArtist: metadata.common.albumartist,
                album: metadata.common.album,
                year: metadata.common.year,
                track: {
                    no: metadata.common.track.no!,
                    of: metadata.common.track.of!,
                },
                disk: {
                    no: metadata.common.disk.no!,
                    of: metadata.common.disk.of!,
                },
                genre: metadata.common.genre,
                composer: metadata.common.composer,
                duration: metadata.format.duration,
                bitrate: metadata.format.bitrate
                    ? Math.round(metadata.format.bitrate / 1000)
                    : undefined,
                sampleRate: metadata.format.sampleRate,
                format: fileType,
                codec: metadata.format.codec,
                fileSize: buffer.byteLength,
                hasArtwork:
                    metadata.common.picture &&
                    metadata.common.picture.length > 0,
            };

            return result;
        } catch (error) {
            console.error(`Error parsing metadata from buffer:`, error);
            // Return minimal metadata rather than failing completely
            return {
                format: fileType,
                fileSize: buffer.byteLength,
            };
        }
    }

    async extractArtwork(filePath: string): Promise<ArrayBuffer | null> {
        try {
            const buffer = await window.electron.fs.readFile(filePath);
            const fileType = this.getFileExtension(filePath);

            // Convert ArrayBuffer to Uint8Array
            const uint8Array = new Uint8Array(buffer);

            const metadata = await musicMetadata.parseBuffer(uint8Array, {
                mimeType: this.getMimeType(fileType),
            });

            // Return the first picture if available
            if (metadata.common.picture && metadata.common.picture.length > 0) {
                // Ensure we return an ArrayBuffer, not a SharedArrayBuffer
                const pictureData = metadata.common.picture[0].data;
                // Create a new ArrayBuffer copy if needed
                return pictureData.buffer.constructor === ArrayBuffer
                    ? pictureData.buffer
                    : pictureData.slice().buffer;
            }

            return null;
        } catch (error) {
            console.error(`Error extracting artwork from ${filePath}:`, error);
            return null;
        }
    }

    getSupportedFileExtensions(): string[] {
        return [...this.supportedExtensions];
    }

    isSupportedAudioFile(filePath: string): boolean {
        const extension = this.getFileExtension(filePath);
        return this.supportedExtensions.includes(extension);
    }

    private getFileExtension(filePath: string): string {
        return filePath.split('.').pop()?.toLowerCase() || '';
    }

    private getMimeType(extension: string): string {
        const mimeTypes: Record<string, string> = {
            mp3: 'audio/mpeg',
            flac: 'audio/flac',
            wav: 'audio/wav',
            ogg: 'audio/ogg',
            m4a: 'audio/mp4',
            aac: 'audio/aac',
            opus: 'audio/opus',
            wma: 'audio/x-ms-wma',
        };

        return mimeTypes[extension] || 'audio/mpeg';
    }
}
