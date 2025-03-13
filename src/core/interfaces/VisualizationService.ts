/**
 * Interface defining audio visualization operations.
 * Abstracts the underlying visualization implementation to ensure the domain layer
 * remains independent of specific visualization technologies.
 */
export interface VisualizationService {
    /**
     * Initializes the visualization service with an audio source
     * @param audioSource Source node for audio data
     */
    initialize(audioSource: any): void;

    /**
     * Connects to an audio element or source node
     * @param source Audio element or source node
     */
    connect(source: any): void;

    /**
     * Disconnects from the current audio source
     */
    disconnect(): void;

    /**
     * Loads audio data for waveform visualization
     * @param audioBuffer Audio buffer containing the data
     */
    loadAudioData(audioBuffer: ArrayBuffer): Promise<void>;

    /**
     * Starts real-time visualization
     */
    start(): void;

    /**
     * Stops real-time visualization
     */
    stop(): void;

    /**
     * Sets the visualization container element
     * @param container DOM element to render visualization in
     */
    setContainer(container: HTMLElement): void;

    /**
     * Gets frequency data for spectrum analysis
     * @returns Array of frequency data values
     */
    getFrequencyData(): Uint8Array;

    /**
     * Gets time domain data for waveform display
     * @returns Array of time domain data values
     */
    getTimeData(): Uint8Array;

    /**
     * Sets the visualization type
     * @param type Type of visualization to display
     */
    setVisualizationType(type: VisualizationType): void;

    /**
     * Gets the current visualization type
     * @returns Current visualization type
     */
    getVisualizationType(): VisualizationType;

    /**
     * Sets visualization options
     * @param options Visualization options
     */
    setOptions(options: VisualizationOptions): void;

    /**
     * Cleans up resources when the visualization is no longer needed
     */
    dispose(): void;
}

/**
 * Enum for visualization types
 */
export enum VisualizationType {
    WAVEFORM = 'waveform',
    SPECTRUM = 'spectrum',
    BARS = 'bars',
    CIRCULAR = 'circular',
}

/**
 * Interface for visualization options
 */
export interface VisualizationOptions {
    fftSize?: number;
    smoothingTimeConstant?: number;
    minDecibels?: number;
    maxDecibels?: number;
    colors?: {
        background?: string;
        foreground?: string;
        progress?: string;
    };
    responsive?: boolean;
    showAxis?: boolean;
    barWidth?: number;
    barSpacing?: number;
    cursorColor?: string;
    showCursor?: boolean;
    waveColor?: string;
    progressColor?: string;
}
