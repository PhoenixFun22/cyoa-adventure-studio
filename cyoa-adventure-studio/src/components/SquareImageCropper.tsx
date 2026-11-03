import React, { useRef, useState, useCallback } from 'react';
import { ItemCrop } from '../types/cyoa';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface SquareImageCropperProps {
  imageUrl: string;
  crop: ItemCrop;
  onChange: (newCrop: ItemCrop) => void;
}

export const SquareImageCropper: React.FC<SquareImageCropperProps> = ({
  imageUrl,
  crop,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setDragStart({ x: e.clientX, y: e.clientY });

      // Sensitivity factor
      const factor = 0.5;
      const nextX = Math.max(-100, Math.min(100, crop.offsetX + dx * factor));
      const nextY = Math.max(-100, Math.min(100, crop.offsetY + dy * factor));
      onChange({
        ...crop,
        offsetX: Math.round(nextX),
        offsetY: Math.round(nextY),
      });
    },
    [isDragging, dragStart, crop, onChange]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    onChange({ scale: 100, offsetX: 0, offsetY: 0 });
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-slate-900/90 rounded-lg border border-slate-800">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-sky-400" />
          Square Crop & Position Adjuster
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px] transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Crop
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* The 1:1 Square Viewport */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative w-40 h-40 bg-black rounded border-2 border-dashed border-sky-500/60 overflow-hidden cursor-grab active:cursor-grabbing shadow-inner shrink-0 group select-none"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Item Preview"
              referrerPolicy="no-referrer"
              className="absolute max-w-none transition-transform pointer-events-none"
              style={{
                width: `${crop.scale}%`,
                height: `${crop.scale}%`,
                objectFit: 'cover',
                left: `calc(50% + ${crop.offsetX}px)`,
                top: `calc(50% + ${crop.offsetY}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs italic">
              No Image
            </div>
          )}

          {/* Grid overlay lines to assist alignment */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-white" />
            <div className="border-r border-white" />
            <div />
          </div>

          <div className="absolute bottom-1 right-1 bg-black/70 text-[9px] font-mono text-slate-300 px-1 rounded pointer-events-none">
            1:1 Square
          </div>
        </div>

        {/* Sliders for scale and panning */}
        <div className="flex-1 w-full space-y-3 text-xs">
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span className="flex items-center gap-1">
                <ZoomIn className="w-3 h-3 text-slate-400" />
                Zoom / Size Kept ({crop.scale}%)
              </span>
            </div>
            <input
              type="range"
              min={70}
              max={250}
              step={5}
              value={crop.scale}
              onChange={(e) => onChange({ ...crop, scale: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Horizontal Offset ({crop.offsetX}px)</span>
            </div>
            <input
              type="range"
              min={-80}
              max={80}
              step={2}
              value={crop.offsetX}
              onChange={(e) => onChange({ ...crop, offsetX: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Vertical Offset ({crop.offsetY}px)</span>
            </div>
            <input
              type="range"
              min={-80}
              max={80}
              step={2}
              value={crop.offsetY}
              onChange={(e) => onChange({ ...crop, offsetY: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Drag the square box directly or use sliders to keep the exact portion of the image.
          </p>
        </div>
      </div>
    </div>
  );
};
