import React, { useState } from 'react';
import { Metric, MetricTrigger, NarrativeBlock } from '../types/cyoa';
import { MetricRing } from './MetricRing';
import { Plus, Trash2, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

interface MetricManagerProps {
  metrics: Metric[];
  blocks: NarrativeBlock[];
  onChange: (updatedMetrics: Metric[]) => void;
}

const PRESET_COLOR_SWATCHES = [
  { label: 'Meat Brown (Hunger)', value: '#92400e' },
  { label: 'Azure Blue (Thirst)', value: '#0284c7' },
  { label: 'Crimson Red (Health)', value: '#e11d48' },
  { label: 'Emerald Green (Stamina)', value: '#059669' },
  { label: 'Violet Purple (Sanity/Mana)', value: '#7c3aed' },
  { label: 'Amber Gold (Warmth/Faith)', value: '#d97706' },
  { label: 'Slate Gray (Armor)', value: '#64748b' },
];

export const MetricManager: React.FC<MetricManagerProps> = ({
  metrics,
  blocks,
  onChange,
}) => {
  const [selectedMetricId, setSelectedMetricId] = useState<string>(metrics[0]?.id || '');
  const selectedMetric = metrics.find((m) => m.id === selectedMetricId);

  const handleCreateMetric = () => {
    const newMetric: Metric = {
      id: `metric-${Date.now()}`,
      name: `Vitality ${metrics.length + 1}`,
      color: '#059669',
      initialValue: 100,
      minValue: 0,
      maxValue: 100,
      triggers: [],
    };
    onChange([...metrics, newMetric]);
    setSelectedMetricId(newMetric.id);
  };

  const handleUpdateSelected = (updates: Partial<Metric>) => {
    if (!selectedMetric) return;
    const nextList = metrics.map((m) =>
      m.id === selectedMetric.id ? { ...m, ...updates } : m
    );
    onChange(nextList);
  };

  const handleDeleteMetric = (id: string) => {
    const nextList = metrics.filter((m) => m.id !== id);
    onChange(nextList);
    if (selectedMetricId === id) {
      setSelectedMetricId(nextList[0]?.id || '');
    }
  };

  const handleAddTrigger = () => {
    if (!selectedMetric) return;
    const newTrigger: MetricTrigger = {
      id: `trig-${Date.now()}`,
      condition: 'less_than_or_equal',
      threshold: 0,
      actionType: 'notice',
      noticeText: `Your ${selectedMetric.name} has completely depleted!`,
    };
    handleUpdateSelected({
      triggers: [...selectedMetric.triggers, newTrigger],
    });
  };

  const handleUpdateTrigger = (index: number, updates: Partial<MetricTrigger>) => {
    if (!selectedMetric) return;
    const nextTriggers = [...selectedMetric.triggers];
    nextTriggers[index] = { ...nextTriggers[index], ...updates };
    handleUpdateSelected({ triggers: nextTriggers });
  };

  const handleDeleteTrigger = (index: number) => {
    if (!selectedMetric) return;
    const nextTriggers = selectedMetric.triggers.filter((_, i) => i !== index);
    handleUpdateSelected({ triggers: nextTriggers });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Metric List Sidebar */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Metric Rings Configuration
            </h2>
            <p className="text-xs text-slate-400">
              Default: Hunger (Brown), Thirst (Blue), Health (Pinkish/Red)
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateMetric}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Metric
          </button>
        </div>

        <div className="space-y-3">
          {metrics.map((metric) => {
            const isSelected = metric.id === selectedMetricId;
            return (
              <div
                key={metric.id}
                onClick={() => setSelectedMetricId(metric.id)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-sky-500 shadow-sm ring-1 ring-sky-500/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: metric.color }}
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200">
                      {metric.name}
                    </span>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {metric.initialValue} / {metric.maxValue} max
                    </p>
                  </div>
                </div>

                <div className="scale-75 origin-right">
                  <MetricRing
                    name={metric.name}
                    current={metric.initialValue}
                    max={metric.maxValue}
                    color={metric.color}
                    size={64}
                    strokeWidth={6}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metric Detail & Trigger Editor */}
      <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        {selectedMetric ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase text-sky-400 tracking-wider">
                  Metric Editor
                </span>
                <h3 className="text-lg font-bold text-slate-100 font-display">
                  {selectedMetric.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteMetric(selectedMetric.id)}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2.5 py-1.5 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Metric
              </button>
            </div>

            {/* Live Ring Preview */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-around">
              <div className="text-xs text-slate-400">
                <p className="font-semibold text-slate-200 mb-1">Clockwise Ring Preview</p>
                <p className="text-[11px]">
                  Fills clockwise from top. Drains to black background track.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-[11px] text-slate-400">Test Value:</label>
                  <input
                    type="range"
                    min={selectedMetric.minValue}
                    max={selectedMetric.maxValue}
                    value={selectedMetric.initialValue}
                    onChange={(e) =>
                      handleUpdateSelected({ initialValue: Number(e.target.value) })
                    }
                    className="w-32 h-1.5 bg-slate-800 rounded appearance-none accent-sky-500 cursor-pointer"
                  />
                </div>
              </div>

              <MetricRing
                name={selectedMetric.name}
                current={selectedMetric.initialValue}
                max={selectedMetric.maxValue}
                color={selectedMetric.color}
                size={100}
                strokeWidth={9}
              />
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Metric Display Name
                </label>
                <input
                  type="text"
                  value={selectedMetric.name}
                  onChange={(e) => handleUpdateSelected({ name: e.target.value })}
                  placeholder="e.g. Hunger, Thirst, Health"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ring Color (Hex or Picker)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedMetric.color}
                    onChange={(e) => handleUpdateSelected({ color: e.target.value })}
                    className="w-9 h-9 rounded cursor-pointer border border-slate-700 bg-transparent"
                  />
                  <input
                    type="text"
                    value={selectedMetric.color}
                    onChange={(e) => handleUpdateSelected({ color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Starting Initial Value
                </label>
                <input
                  type="number"
                  min={selectedMetric.minValue}
                  max={selectedMetric.maxValue}
                  value={selectedMetric.initialValue}
                  onChange={(e) =>
                    handleUpdateSelected({ initialValue: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Maximum Capacity (Default: 100, can be set higher or lower)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={selectedMetric.maxValue}
                  onChange={(e) =>
                    handleUpdateSelected({ maxValue: Math.max(1, Number(e.target.value)) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Color Swatches */}
            <div>
              <span className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Quick Swatches:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.value}
                    type="button"
                    onClick={() => handleUpdateSelected({ color: swatch.value })}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded text-[11px] text-slate-300 transition-colors"
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: swatch.value }}
                    />
                    <span>{swatch.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Metric-Level Triggers & Functions */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-200 tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Metric Threshold Triggers & Auto-Functions
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Execute an action or send to an ending when {selectedMetric.name} reaches a threshold.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTrigger}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Trigger
                </button>
              </div>

              {selectedMetric.triggers.length === 0 ? (
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 text-xs text-slate-500 italic">
                  No automated triggers configured. (e.g., you can add a trigger: if {selectedMetric.name} &le; 0, trigger Game Over or a Warning).
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedMetric.triggers.map((trigger, idx) => (
                    <div
                      key={trigger.id || idx}
                      className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400">When {selectedMetric.name}</span>
                          <select
                            value={trigger.condition}
                            onChange={(e) =>
                              handleUpdateTrigger(idx, {
                                condition: e.target.value as MetricTrigger['condition'],
                              })
                            }
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                          >
                            <option value="less_than_or_equal">&le; (Drops to or below)</option>
                            <option value="greater_than_or_equal">&ge; (Reaches or above)</option>
                            <option value="equals">= (Exactly)</option>
                          </select>
                          <input
                            type="number"
                            value={trigger.threshold}
                            onChange={(e) =>
                              handleUpdateTrigger(idx, { threshold: Number(e.target.value) })
                            }
                            className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTrigger(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-400 mb-1">Action Type:</label>
                          <select
                            value={trigger.actionType}
                            onChange={(e) =>
                              handleUpdateTrigger(idx, {
                                actionType: e.target.value as MetricTrigger['actionType'],
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                          >
                            <option value="notice">Display Custom Text Warning Notice</option>
                            <option value="ending">Send to Ending Block (Victory / Defeat)</option>
                            <option value="goto_block">Send to Specific Narrative Block</option>
                          </select>
                        </div>

                        {trigger.actionType === 'notice' && (
                          <div>
                            <label className="block text-slate-400 mb-1">Warning Notice Text:</label>
                            <input
                              type="text"
                              value={trigger.noticeText || ''}
                              onChange={(e) =>
                                handleUpdateTrigger(idx, { noticeText: e.target.value })
                              }
                              placeholder="e.g. Starvation is setting in..."
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
                            />
                          </div>
                        )}

                        {(trigger.actionType === 'ending' || trigger.actionType === 'goto_block') && (
                          <div>
                            <label className="block text-slate-400 mb-1">Target Narrative Block:</label>
                            <select
                              value={trigger.targetBlockId || ''}
                              onChange={(e) =>
                                handleUpdateTrigger(idx, { targetBlockId: e.target.value })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
                            >
                              <option value="">-- Choose Target Block --</option>
                              {blocks.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.isEnding ? `[ENDING] ${b.title}` : b.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">No metrics configured. Add at least one metric to display.</p>
          </div>
        )}
      </div>
    </div>
  );
};
