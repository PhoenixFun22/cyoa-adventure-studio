import React, { useState } from 'react';
import { PresetFunction, ActionItem, Item, Metric, NarrativeBlock } from '../types/cyoa';
import { Plus, Trash2, Zap, Package, Heart, RefreshCw } from 'lucide-react';

interface PresetManagerProps {
  presets: PresetFunction[];
  items: Item[];
  metrics: Metric[];
  blocks: NarrativeBlock[];
  onChange: (updatedPresets: PresetFunction[]) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  items,
  metrics,
  blocks,
  onChange,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(presets[0]?.id || '');
  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  const handleCreatePreset = () => {
    const newPreset: PresetFunction = {
      id: `preset-${Date.now()}`,
      name: `Preset Function ${presets.length + 1}`,
      description: 'Reusable bundled action function.',
      actions: [
        {
          id: `act-${Date.now()}`,
          type: 'metric_delta',
          metricId: metrics[0]?.id,
          metricDelta: 10,
        },
      ],
    };
    onChange([...presets, newPreset]);
    setSelectedPresetId(newPreset.id);
  };

  const handleUpdateSelected = (updates: Partial<PresetFunction>) => {
    if (!selectedPreset) return;
    const nextList = presets.map((p) =>
      p.id === selectedPreset.id ? { ...p, ...updates } : p
    );
    onChange(nextList);
  };

  const handleDeletePreset = (id: string) => {
    const nextList = presets.filter((p) => p.id !== id);
    onChange(nextList);
    if (selectedPresetId === id) {
      setSelectedPresetId(nextList[0]?.id || '');
    }
  };

  const handleAddAction = () => {
    if (!selectedPreset) return;
    const newAction: ActionItem = {
      id: `act-${Date.now()}`,
      type: 'metric_delta',
      metricId: metrics[0]?.id,
      metricDelta: 10,
    };
    handleUpdateSelected({
      actions: [...selectedPreset.actions, newAction],
    });
  };

  const handleUpdateAction = (index: number, updates: Partial<ActionItem>) => {
    if (!selectedPreset) return;
    const nextActions = [...selectedPreset.actions];
    nextActions[index] = { ...nextActions[index], ...updates };
    handleUpdateSelected({ actions: nextActions });
  };

  const handleDeleteAction = (index: number) => {
    if (!selectedPreset) return;
    const nextActions = selectedPreset.actions.filter((_, i) => i !== index);
    handleUpdateSelected({ actions: nextActions });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Preset List */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Reusable Presets
            </h2>
            <p className="text-xs text-slate-400">
              Bundle actions into callable presets
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreatePreset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Preset
          </button>
        </div>

        {presets.length === 0 ? (
          <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center space-y-1.5">
            <Zap className="w-6 h-6 mx-auto text-slate-600" />
            <p className="text-xs text-slate-400 font-medium">No presets created yet.</p>
            <p className="text-[11px] text-slate-500">
              Click &quot;New Preset&quot; to bundle recurring actions (like resting, drinking, or crafting).
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {presets.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <div
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-sky-500 shadow-sm ring-1 ring-sky-500/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-semibold text-slate-200">
                        {preset.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {preset.actions.length} action{preset.actions.length === 1 ? '' : 's'} defined
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preset Details & Action Chaining */}
      <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        {selectedPreset ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase text-sky-400 tracking-wider">
                  Preset Function Editor
                </span>
                <h3 className="text-lg font-bold text-slate-100 font-display">
                  {selectedPreset.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleDeletePreset(selectedPreset.id)}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2.5 py-1.5 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Preset
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Preset Name
                </label>
                <input
                  type="text"
                  value={selectedPreset.name}
                  onChange={(e) => handleUpdateSelected({ name: e.target.value })}
                  placeholder="e.g. Rest by Campfire"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description / Documentation
                </label>
                <input
                  type="text"
                  value={selectedPreset.description}
                  onChange={(e) => handleUpdateSelected({ description: e.target.value })}
                  placeholder="e.g. Requires 1 wood, restores +20 health, -10 hunger"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Actions List in this Preset */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Actions Executed When Called
                </span>
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Action
                </button>
              </div>

              <div className="space-y-2">
                {selectedPreset.actions.map((act, idx) => (
                  <div
                    key={act.id || idx}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-wrap items-center gap-3 text-xs"
                  >
                    <span className="font-mono text-slate-500">{idx + 1}.</span>
                    <select
                      value={act.type}
                      onChange={(e) =>
                        handleUpdateAction(idx, {
                          type: e.target.value as ActionItem['type'],
                        })
                      }
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="metric_delta">Alter Metric (+ / -)</option>
                      <option value="require_item">Require & Deduct Item</option>
                      <option value="give_item">Give Item to Inventory</option>
                      <option value="take_item">Take Item from Inventory</option>
                    </select>

                    {act.type === 'metric_delta' && (
                      <>
                        <select
                          value={act.metricId || ''}
                          onChange={(e) => handleUpdateAction(idx, { metricId: e.target.value })}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
                        >
                          {metrics.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <span className="text-slate-400">Delta:</span>
                        <input
                          type="number"
                          value={act.metricDelta || 0}
                          onChange={(e) =>
                            handleUpdateAction(idx, { metricDelta: Number(e.target.value) })
                          }
                          className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 font-mono"
                          placeholder="+/- value"
                        />
                      </>
                    )}

                    {(act.type === 'require_item' || act.type === 'give_item' || act.type === 'take_item') && (
                      <>
                        <select
                          value={act.itemId || ''}
                          onChange={(e) => handleUpdateAction(idx, { itemId: e.target.value })}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
                        >
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.name}
                            </option>
                          ))}
                        </select>
                        <span className="text-slate-400">Count:</span>
                        <input
                          type="number"
                          min={1}
                          value={act.itemQuantity || 1}
                          onChange={(e) =>
                            handleUpdateAction(idx, { itemQuantity: Math.max(1, Number(e.target.value)) })
                          }
                          className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 font-mono"
                        />
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteAction(idx)}
                      className="ml-auto text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <Zap className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">No preset selected. Create or select a preset to edit.</p>
          </div>
        )}
      </div>
    </div>
  );
};
