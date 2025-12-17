import React, { useRef, useEffect, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Icon } from "@iconify/react";
import { getPath } from "../../config-parser/getPath";

export default function AudioElement({
  src,
  autoplay,
  className,
  action,
  onAction,
  waveColor = "rgba(0, 107, 255, 0.3)",
  progressColor = "rgba(0, 179, 255, 0.9)",
  cursorColor = "#00b3ff",
  height = 150,
  barWidth = 3
}) {
  const containerRef = useRef(null);
  const waveSurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
  
    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
    }
  
    waveSurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      cursorColor,
      height,
      barWidth,
      responsive: true,
      normalize: true,
    });
  
    const ws = waveSurferRef.current;
    const soundsrc = src.includes("http") ? src : getPath(src);
  
    ws.load(soundsrc);
  
    ws.on("ready", () => {
      ws.isReady = true;
  
      if (autoplay) {
        ws.play();
        setIsPlaying(true);
      }
    });
  
    ws.on("pause", () => {
      setIsPlaying(false);
    });
  
    ws.on("finish", () => {
      setIsPlaying(false);
      if (action && onAction) onAction({ type: action });
      onAction?.({ type: "audio_finished" });
    });
  
    return () => ws.destroy();
  }, [src]);
  
  const togglePlay = () => {
    const ws = waveSurferRef.current;
    if (!ws || !ws.isReady) return;
  
    ws.playPause();
    setIsPlaying(ws.isPlaying());
  };  

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <button
        onClick={togglePlay}
        className="button-audio"
      >
        <Icon
          icon={isPlaying ? "mdi:pause" : "mdi:play"}
          width="28"
          height="28"
        />
      </button>

      <div
        ref={containerRef}
        className="flex-1 rounded-lg overflow-hidden bg-transparent"
      />
    </div>
  );
}
