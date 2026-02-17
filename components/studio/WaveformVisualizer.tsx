"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Music } from "lucide-react";

type WaveformVisualizerProps = {
  waveformData: number[];
  title?: string;
  duration?: number;
  className?: string;
};

export function WaveformVisualizer({
  waveformData,
  title,
  duration,
  className = "",
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const barWidth = Math.max(2, (w / waveformData.length) * 0.7);
    const gap = (w - barWidth * waveformData.length) / waveformData.length;

    ctx.clearRect(0, 0, w, h);

    waveformData.forEach((amplitude, i) => {
      const x = i * (barWidth + gap);
      const barHeight = Math.max(2, amplitude * h * 0.8);
      const y = (h - barHeight) / 2;

      const progressRatio = progress / 100;
      const isActive = i / waveformData.length < progressRatio;

      if (isActive) {
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, "#8b5cf6");
        gradient.addColorStop(1, "#06b6d4");
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = "rgba(245, 245, 220, 0.15)";
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1);
      ctx.fill();
    });
  }, [waveformData, progress]);

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(animRef.current);
      return;
    }

    const durationMs = (duration || 30) * 1000;
    const startTime = Date.now() - (progress / 100) * durationMs;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);

      if (pct >= 100) {
        setIsPlaying(false);
        setProgress(0);
        return;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, duration, progress]);

  if (!waveformData || waveformData.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed border-[#f5f5dc]/10 bg-[#0a1229]/30 p-12 ${className}`}>
        <div className="text-center">
          <Music className="mx-auto mb-2 h-8 w-8 text-purple-400/20" />
          <p className="text-xs text-[#f5f5dc]/30">No waveform data</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const currentTime = duration ? (progress / 100) * duration : 0;

  return (
    <div className={`rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-5 ${className}`}>
      {title && (
        <h4 className="mb-1 text-xs font-semibold text-[#f5f5dc]/50">{title}</h4>
      )}
      <p className="mb-3 text-[10px] text-[#f5f5dc]/30 italic">
        AI-generated composition preview. Real audio rendering coming soon.
      </p>

      {/* Waveform */}
      <div className="mb-4 overflow-hidden rounded-lg bg-[#0a1229]/60 p-3">
        <canvas
          ref={canvasRef}
          className="h-20 w-full"
          style={{ display: "block" }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 transition-all hover:bg-purple-500/30"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </button>

        {/* Progress bar */}
        <div className="flex flex-1 items-center gap-3">
          <span className="text-[10px] font-mono text-[#f5f5dc]/40">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 h-1 rounded-full bg-[#f5f5dc]/10">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-[#f5f5dc]/40">
            {duration ? formatTime(duration) : "0:00"}
          </span>
        </div>
      </div>
    </div>
  );
}
