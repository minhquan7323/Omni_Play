import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    audioElement: HTMLAudioElement | null;
    className?: string;
    barColor?: string;
    barCount?: number;
}

export default function AudioVisualizer({
    audioElement,
    className = "",
    barColor = "#22c55e",
    barCount = 256,
}: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!audioElement || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const audio = audioElement as any;
        let animationId: number;
        let analyserNode: AnalyserNode | null = null;

        // ── Setup Web Audio API ──────────────────────────────────────────────────
        const setupAnalyser = () => {
            if (analyserNode) return;

            if (audio._audioContext && audio._analyser) {
                analyserNode = audio._analyser as AnalyserNode;
                return;
            }

            try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioCtx) return;

                const ctx = new AudioCtx();
                const analyser = ctx.createAnalyser();
                let fftSize = 64;
                while (fftSize < barCount * 2) fftSize *= 2;
                analyser.fftSize = fftSize;

                if (!audio._mediaSource) {
                    audio._mediaSource = ctx.createMediaElementSource(audio);
                }
                audio._mediaSource.connect(analyser);
                analyser.connect(ctx.destination);

                audio._audioContext = ctx;
                audio._analyser = analyser;
                analyserNode = analyser;

                if (ctx.state === 'suspended') ctx.resume().catch(() => { });
            } catch {
                // Silently fail (cross-origin audio, etc.)
            }
        };

        const draw = () => {
            animationId = requestAnimationFrame(draw);

            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            if (w === 0 || h === 0) return;

            if (canvas.width !== w) canvas.width = w;
            if (canvas.height !== h) canvas.height = h;

            ctx.clearRect(0, 0, w, h);

            if (!analyserNode) return;

            const count = Math.min(barCount, analyserNode.frequencyBinCount);
            const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
            analyserNode.getByteFrequencyData(dataArray);

            const gap = 2;
            const barW = Math.max(1, (w - gap * (count - 1)) / count);

            for (let i = 0; i < count; i++) {
                const barH = (dataArray[i] / 255) * h;
                ctx.fillStyle = barColor;
                ctx.fillRect(i * (barW + gap), h - barH, barW, barH);
            }
        };

        if (!audio.paused) {
            setupAnalyser();
        }
        audio.addEventListener('play', setupAnalyser);

        draw();

        return () => {
            cancelAnimationFrame(animationId);
            audio.removeEventListener('play', setupAnalyser);
        };
    }, [audioElement, barColor, barCount]);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-full block ${className}`}
        />
    );
}