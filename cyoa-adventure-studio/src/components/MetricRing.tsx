import React from 'react';

interface MetricRingProps {
  name: string;
  current: number;
  max: number;
  color: string;
  size?: number; // size in px, default 92
  strokeWidth?: number; // default 8
}

export const MetricRing: React.FC<MetricRingProps> = ({
  name,
  current,
  max,
  color,
  size = 92,
  strokeWidth = 8,
}) => {
  const safeMax = Math.max(1, max);
  const clampedCurrent = Math.max(0, Math.min(safeMax, current));
  const ratio = clampedCurrent / safeMax;

  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  // Clockwise fill from top: dashoffset decreases as ratio increases
  const strokeDashoffset = circumference - ratio * circumference;

  return (
    <div className="flex flex-col items-center select-none group">
      {/* Name of the metric right above the ring */}
      <span
        className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1 text-center truncate max-w-[84px]"
        title={name}
      >
        {name}
      </span>

      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 block drop-shadow-md"
        >
          {/* Black/dark unfilled track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="#050811"
            stroke="#111827"
            strokeWidth={strokeWidth}
          />
          {/* Active colored ring progress bar */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Value text inside the ring: current | max */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-1">
          <span className="font-mono-numbers text-[10px] md:text-[11px] font-bold text-slate-100 tracking-tight text-center leading-none">
            {Math.round(clampedCurrent)} <span className="text-slate-500 font-normal">|</span> {Math.round(safeMax)}
          </span>
          <span
            className="text-[8px] font-medium mt-0.5 text-slate-400 capitalize"
            style={{ color: ratio < 0.2 ? '#f87171' : undefined }}
          >
            {Math.round(ratio * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
