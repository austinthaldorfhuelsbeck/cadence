import {
    VisualizationService,
    VisualizationType,
    VisualizationOptions,
} from '@core/interfaces';
import WaveSurfer from 'wavesurfer.js';

export class WebAudioVisualizationService implements VisualizationService {
    private wavesurfer: WaveSurfer | null = null;
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private sourceNode: AudioNode | null = null;
    private container: HTMLElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private canvasContext: CanvasRenderingContext2D | null = null;
    private animationFrame: number | null = null;
    private visualizationType: VisualizationType = VisualizationType.WAVEFORM;
    private options: VisualizationOptions = {
        fftSize: 2048,
        smoothingTimeConstant: 0.8,
        minDecibels: -100,
        maxDecibels: -30,
        colors: {
            background: 'transparent',
            foreground: '#1e88e5',
            progress: '#7e57c2',
        },
        responsive: true,
        showAxis: false,
        barWidth: 2,
        barSpacing: 1,
        waveColor: '#1e88e5',
        progressColor: '#7e57c2',
    };

    initialize(audioSource: AudioNode): void {
        this.disconnect(); // Clean up previous resources

        // Create Audio Context if none exists
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext ||
                (window as any).webkitAudioContext)();
        }

        this.analyser = this.audioContext.createAnalyser();
        this.configureAnalyser();

        // Connect audio source to analyzer
        this.connect(audioSource);
    }

    connect(source: AudioNode): void {
        // Disconnect any previous source
        if (this.sourceNode) {
            this.sourceNode.disconnect();
        }

        this.sourceNode = source;

        if (this.analyser) {
            source.connect(this.analyser);
        }
    }

    disconnect(): void {
        this.stop();

        if (this.sourceNode && this.analyser) {
            this.sourceNode.disconnect(this.analyser);
            this.sourceNode = null;
        }

        if (this.wavesurfer) {
            this.wavesurfer.destroy();
            this.wavesurfer = null;
        }
    }

    async loadAudioData(audioBuffer: ArrayBuffer): Promise<void> {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext ||
                (window as any).webkitAudioContext)();
        }

        try {
            // Decode the audio data
            const decodedData = await this.audioContext.decodeAudioData(
                audioBuffer
            );

            // If we have a container and we're in waveform mode, initialize wavesurfer
            if (
                this.container &&
                this.visualizationType === VisualizationType.WAVEFORM
            ) {
                this.initWavesurfer();

                if (this.wavesurfer) {
                    // Since loadDecodedBuffer doesn't exist in v7, we need to convert AudioBuffer to peaks
                    const channelData = Array.from(
                        { length: decodedData.numberOfChannels },
                        (_, i) => decodedData.getChannelData(i)
                    );

                    // Set the peaks and duration for WaveSurfer
                    this.wavesurfer.load('', channelData, decodedData.duration);
                }
            }
        } catch (error) {
            console.error('Error decoding audio data:', error);
            throw error;
        }
    }

    start(): void {
        if (this.visualizationType === VisualizationType.WAVEFORM) {
            // Wavesurfer handles its own rendering
            return;
        }

        // Stop any existing animation
        this.stop();

        // Start animation based on visualization type
        if (this.analyser && this.canvasContext) {
            switch (this.visualizationType) {
                case VisualizationType.SPECTRUM:
                    this.drawSpectrumVisualizer();
                    break;
                case VisualizationType.BARS:
                    this.drawBarsVisualizer();
                    break;
                case VisualizationType.CIRCULAR:
                    this.drawCircularVisualizer();
                    break;
            }
        }
    }

    stop(): void {
        if (this.animationFrame !== null) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    setContainer(container: HTMLElement): void {
        this.container = container;

        // Clear previous contents
        container.innerHTML = '';

        if (this.visualizationType === VisualizationType.WAVEFORM) {
            this.initWavesurfer();
        } else {
            // For other visualization types, create a canvas
            this.canvas = document.createElement('canvas');
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            container.appendChild(this.canvas);

            this.canvasContext = this.canvas.getContext('2d');

            // Setup resize observer for responsive canvas
            if (this.options.responsive) {
                const resizeObserver = new ResizeObserver(() => {
                    if (this.canvas && this.container) {
                        this.canvas.width = this.container.clientWidth;
                        this.canvas.height = this.container.clientHeight;
                    }
                });

                resizeObserver.observe(container);
            }
        }
    }

    getFrequencyData(): Uint8Array {
        if (!this.analyser) {
            return new Uint8Array();
        }

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        return dataArray;
    }

    getTimeData(): Uint8Array {
        if (!this.analyser) {
            return new Uint8Array();
        }

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);

        return dataArray;
    }

    setVisualizationType(type: VisualizationType): void {
        if (this.visualizationType === type) {
            return; // Already set to this type
        }

        this.stop();
        this.visualizationType = type;

        // Reset container if we have one
        if (this.container) {
            this.setContainer(this.container);
        }

        // Start visualization if we switched to a non-waveform type
        if (type !== VisualizationType.WAVEFORM && this.analyser) {
            this.start();
        }
    }

    getVisualizationType(): VisualizationType {
        return this.visualizationType;
    }

    setOptions(options: VisualizationOptions): void {
        this.options = { ...this.options, ...options };

        // Apply options to analyzer
        this.configureAnalyser();

        // Apply options to wavesurfer if active
        if (
            this.wavesurfer &&
            this.visualizationType === VisualizationType.WAVEFORM
        ) {
            if (options.waveColor) {
                this.wavesurfer.setOptions({ waveColor: options.waveColor });
            }
            if (options.progressColor) {
                this.wavesurfer.setOptions({
                    progressColor: options.progressColor,
                });
            }
        }

        // Restart visualization if active
        if (this.animationFrame !== null) {
            this.start();
        }
    }

    dispose(): void {
        this.disconnect();

        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }

        if (this.audioContext) {
            this.audioContext
                .close()
                .catch((err) =>
                    console.error('Error closing AudioContext:', err)
                );
            this.audioContext = null;
        }

        this.container = null;
        this.canvas = null;
        this.canvasContext = null;
    }

    // Private helper methods
    private configureAnalyser(): void {
        if (!this.analyser) return;

        this.analyser.fftSize = this.options.fftSize || 2048;
        this.analyser.smoothingTimeConstant =
            this.options.smoothingTimeConstant || 0.8;
        this.analyser.minDecibels = this.options.minDecibels || -100;
        this.analyser.maxDecibels = this.options.maxDecibels || -30;
    }

    private initWavesurfer(): void {
        if (!this.container) return;

        this.wavesurfer = WaveSurfer.create({
            container: this.container,
            waveColor: this.options.waveColor || '#1e88e5',
            progressColor: this.options.progressColor || '#7e57c2',
            fillParent: this.options.responsive !== false, // Use fillParent instead of responsive
            cursorColor: this.options.cursorColor,
            cursorWidth: this.options.showCursor ? 1 : 0,
            height: this.container.clientHeight,
        });
    }

    // Visualization methods remain the same
    private drawSpectrumVisualizer(): void {
        // Implementation unchanged
        if (!this.analyser || !this.canvasContext || !this.canvas) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const ctx = this.canvasContext;
        const width = this.canvas.width;
        const height = this.canvas.height;

        const draw = () => {
            this.animationFrame = requestAnimationFrame(draw);

            this.analyser!.getByteFrequencyData(dataArray);

            ctx.fillStyle = this.options.colors?.background || 'transparent';
            ctx.fillRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * height;

                ctx.fillStyle = this.options.colors?.foreground || '#1e88e5';
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    }

    private drawBarsVisualizer(): void {
        // Implementation unchanged
        if (!this.analyser || !this.canvasContext || !this.canvas) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const ctx = this.canvasContext;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Use fewer bars for better visual
        const barCount = Math.min(
            bufferLength,
            Math.floor(width / (this.options.barWidth || 2))
        );
        const barWidth = this.options.barWidth || 2;
        const barSpacing = this.options.barSpacing || 1;

        const draw = () => {
            this.animationFrame = requestAnimationFrame(draw);

            this.analyser!.getByteFrequencyData(dataArray);

            ctx.fillStyle = this.options.colors?.background || 'transparent';
            ctx.fillRect(0, 0, width, height);

            // Draw bars
            const totalBarWidth = barWidth + barSpacing;
            const startX = (width - barCount * totalBarWidth) / 2;

            for (let i = 0; i < barCount; i++) {
                // Use a logarithmic scale to emphasize lower frequencies
                const index = Math.floor(i * (bufferLength / barCount));
                const barHeight = (dataArray[index] / 255) * height;

                // Gradient color based on frequency
                const hue = (i / barCount) * 220; // Blue to red spectrum
                ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;

                ctx.fillRect(
                    startX + i * totalBarWidth,
                    height - barHeight,
                    barWidth,
                    barHeight
                );
            }
        };

        draw();
    }

    private drawCircularVisualizer(): void {
        // Implementation unchanged
        if (!this.analyser || !this.canvasContext || !this.canvas) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const ctx = this.canvasContext;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;

        const draw = () => {
            this.animationFrame = requestAnimationFrame(draw);

            this.analyser!.getByteFrequencyData(dataArray);

            ctx.fillStyle = this.options.colors?.background || 'transparent';
            ctx.fillRect(0, 0, width, height);

            // Draw circular visualizer
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius / 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#222';
            ctx.fill();

            const barCount = 180; // Number of bars in the circle
            const angleStep = (2 * Math.PI) / barCount;

            for (let i = 0; i < barCount; i++) {
                const angle = i * angleStep;

                // Use a subset of frequency data for better visual
                const index = Math.floor((i / barCount) * (bufferLength / 2));
                let barHeight = (dataArray[index] / 255) * (radius * 0.7);

                // Ensure minimum bar height for better visuals
                barHeight = Math.max(barHeight, radius / 4 + 2);

                const startX = centerX + Math.cos(angle) * (radius / 4);
                const startY = centerY + Math.sin(angle) * (radius / 4);
                const endX = centerX + Math.cos(angle) * barHeight;
                const endY = centerY + Math.sin(angle) * barHeight;

                // Gradient color based on frequency
                const hue = (i / barCount) * 360;
                const color = `hsl(${hue}, 80%, 50%)`;

                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        };

        draw();
    }
}
