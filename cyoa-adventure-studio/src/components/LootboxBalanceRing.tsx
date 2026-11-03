import React, { useRef, useState, useCallback, useEffect } from 'react';
import { LootboxItemEntry, Item } from '../types/cyoa';
import { Sliders, RefreshCw, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface LootboxBalanceRingProps {
  entries: LootboxItemEntry[];
  items: Item[];
  onChange: (updatedEntries: LootboxItemEntry[]) => void;
}

const SECTOR_COLORS = [
  '#0284c7', // Sky Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
];

export const LootboxBalanceRing: React.FC<LootboxBalanceRingProps> = ({
  entries,
  items,
  onChange,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeHandleIndex, setActiveHandleIndex] = useState<number | null>(null);

  const totalWeight = entries.reduce((acc, e) => acc + (Number(e.weight) || 0), 0);
  const isBalanced = totalWeight === 100;

  // Auto-balance entries to exactly 100%
  const handleBalanceTo100 = () => {
    if (entries.length === 0) return;
    if (entries.length === 1) {
      onChange([{ ...entries[0], weight: 100 }]);
      return;
    }

    if (totalWeight <= 0) {
      // Distribute evenly
      const base = Math.floor(100 / entries.length);
      const rem = 100 - base * entries.length;
      const updated = entries.map((e, idx) => ({
        ...e,
        weight: base + (idx < rem ? 1 : 0),
      }));
      onChange(updated);
      return;
    }

    // Proportional redistribution summing to 100
    let running = 0;
    const updated = entries.map((e, idx) => {
      if (idx === entries.length - 1) {
        return { ...e, weight: Math.max(1, 100 - running) };
      }
      const proportional = Math.max(1, Math.round((e.weight / totalWeight) * 100));
      running += proportional;
      return { ...e, weight: proportional };
    });

    onChange(updated);
  };

  const handleDistributeEvenly = () => {
    if (entries.length === 0) return;
    const base = Math.floor(100 / entries.length);
    const rem = 100 - base * entries.length;
    const updated = entries.map((e, idx) => ({
      ...e,
      weight: base + (idx < rem ? 1 : 0),
    }));
    onChange(updated);
  };

  // Handle direct weight modification with optional auto-balance
  const handleUpdateWeight = (index: number, newWeight: number) => {
    const clampedWeight = Math.max(1, Math.min(99, newWeight));
    const next = [...entries];
    next[index] = { ...next[index], weight: clampedWeight };

    // If there are exactly 2 entries, auto-balance the other
    if (next.length === 2) {
      const otherIdx = index === 0 ? 1 : 0;
      next[otherIdx] = { ...next[otherIdx], weight: Math.max(1, 100 - clampedWeight) };
    }

    onChange(next);
  };

  // Geometric math for SVG donut sectors
  const size = 180;
  const strokeWidth = 22;
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 6;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative angle fractions (0 to 1) for divider lines
  let cumulativeFraction = 0;
  const sectors = entries.map((entry, idx) => {
    const weight = Number(entry.weight) || 0;
    const fraction = totalWeight > 0 ? weight / totalWeight : 1 / (entries.length || 1);
    const startFraction = cumulativeFraction;
    cumulativeFraction += fraction;
    const endFraction = cumulativeFraction;

    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -startFraction * circumference;
    const angleRad = (endFraction * 360 - 90) * (Math.PI / 180);
    const lineX1 = center + (radius - strokeWidth / 2 - 2) * Math.cos(angleRad);
    const lineY1 = center + (radius - strokeWidth / 2 - 2) * Math.sin(angleRad);
    const lineX2 = center + (radius + strokeWidth / 2 + 3) * Math.cos(angleRad);
    const lineY2 = center + (radius + strokeWidth / 2 + 3) * Math.sin(angleRad);

    const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];
    return {
      entry,
      idx,
      fraction,
      strokeDasharray,
      strokeDashoffset,
      lineX1,
      lineY1,
      lineX2,
      lineY2,
      color,
    };
  });

  return (
    <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Lootbox 100% Probability Balance Ring
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDistributeEvenly}
            className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            Distribute Evenly
          </button>
          <button
            type="button"
            onClick={handleBalanceTo100}
            className={`text-[10px] flex items-center gap-1 px-2.5 py-0.5 rounded font-semibold transition-colors ${
              isBalanced
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                : 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            <span>{isBalanced ? 'Balanced to 100%' : 'Balance to 100%'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* The 100% Circular Balance Ring */}
        <div className="relative shrink-0 flex items-center justify-center select-none">
          <svg
            ref={svgRef}
            width={size}
            height={size}
            className="transform -rotate-90 block drop-shadow-lg"
          >
            {/* Background track circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#0f172a"
              strokeWidth={strokeWidth}
            />

            {/* Colored arc sectors for each item */}
            {sectors.map((sec) => (
              <circle
                key={sec.idx}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={sec.color}
                strokeWidth={strokeWidth}
                strokeDasharray={sec.strokeDasharray}
                strokeDashoffset={sec.strokeDashoffset}
                className="transition-all duration-200 ease-out"
              />
            ))}

            {/* Distinct Little Divider Lines / Notches separating the sectors */}
            {sectors.map((sec) => (
              <line
                key={`line-${sec.idx}`}
                x1={sec.lineX1}
                y1={sec.lineY1}
                x2={sec.lineX2}
                y2={sec.lineY2}
                stroke="#020617"
                strokeWidth={3}
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Center Info in the Ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
            <span
              className={`font-mono font-bold text-sm leading-none ${
                isBalanced ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {totalWeight}%
            </span>
            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
              {isBalanced ? '100% Balanced' : `${100 - totalWeight > 0 ? `+${100 - totalWeight}` : 100 - totalWeight}% Left`}
            </span>
            <span className="text-[8px] text-slate-500 font-mono">
              {entries.length} Slices
            </span>
          </div>
        </div>

        {/* Item Slices & Percentages Sliders */}
        <div className="flex-1 w-full space-y-2 text-xs">
          {entries.map((entry, idx) => {
            const itemDef = items.find((i) => i.id === entry.itemId);
            const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];
            return (
              <div
                key={idx}
                className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold text-slate-200 truncate">
                      {itemDef?.name || `Item ${idx + 1}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-mono shrink-0">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={entry.weight}
                      onChange={(e) => handleUpdateWeight(idx, Number(e.target.value))}
                      className="w-12 px-1 py-0.5 bg-slate-950 border border-slate-700 rounded text-right text-xs text-slate-100 font-mono"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>

                {/* Individual Slice Line Slider */}
                <input
                  type="range"
                  min={1}
                  max={99}
                  value={entry.weight}
                  onChange={(e) => handleUpdateWeight(idx, Number(e.target.value))}
                  style={{ accentColor: color }}
                  className="w-full h-1.5 bg-slate-950 rounded appearance-none cursor-pointer"
                />
              </div>
            );
          })}

          {!isBalanced && (
            <p className="text-[10px] text-amber-400/90 italic flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              Total is currently {totalWeight}%. Click &quot;Balance to 100%&quot; to ensure an exact 100% probability so rolls never fail.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
