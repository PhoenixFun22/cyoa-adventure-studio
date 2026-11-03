import React, { useState } from 'react';
import {
  NarrativeBlock,
  OptionChoice,
  ActionItem,
  Metric,
  Item,
  PresetFunction,
  LootboxItemEntry,
} from '../types/cyoa';
import {
  Plus,
  Trash2,
  BookOpen,
  ArrowRight,
  GitBranch,
  ShieldAlert,
  Package,
  Sparkles,
  Trophy,
  Skull,
  Compass,
  CheckCircle,
  Dice5,
} from 'lucide-react';
import { LootboxBalanceRing } from './LootboxBalanceRing';

interface NarrativeEditorProps {
  blocks: NarrativeBlock[];
  metrics: Metric[];
  items: Item[];
  presets: PresetFunction[];
  onChange: (updatedBlocks: NarrativeBlock[]) => void;
}

export const NarrativeEditor: React.FC<NarrativeEditorProps> = ({
  blocks,
  metrics,
  items,
  presets,
  onChange,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string>(
    blocks.find((b) => b.isStart)?.id || blocks[0]?.id || ''
  );
  const [searchFilter, setSearchFilter] = useState('');

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  const handleCreateBlock = (isEnding = false) => {
    const newBlock: NarrativeBlock = {
      id: `block-${Date.now()}`,
      title: isEnding ? `Ending ${blocks.length + 1}` : `Chapter ${blocks.length + 1}`,
      text: isEnding
        ? 'The journey reaches its resolution here.'
        : 'Describe the atmosphere, surroundings, and situation for the traveler here.',
      isStart: blocks.length === 0,
      isEnding,
      endingType: isEnding ? 'neutral' : undefined,
      options: isEnding
        ? []
        : [
            {
              id: `opt-${Date.now()}`,
              text: 'Investigate the surroundings',
              grayOutOnComplete: false,
              actions: [],
            },
          ],
    };
    onChange([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleUpdateSelectedBlock = (updates: Partial<NarrativeBlock>) => {
    if (!selectedBlock) return;
    const nextBlocks = blocks.map((b) => {
      if (b.id === selectedBlock.id) {
        return { ...b, ...updates };
      }
      // If setting this block as starting block, unset any other starting block
      if (updates.isStart && b.id !== selectedBlock.id && b.isStart) {
        return { ...b, isStart: false };
      }
      return b;
    });
    onChange(nextBlocks);
  };

  const handleDeleteBlock = (id: string) => {
    const nextBlocks = blocks.filter((b) => b.id !== id);
    onChange(nextBlocks);
    if (selectedBlockId === id) {
      setSelectedBlockId(nextBlocks[0]?.id || '');
    }
  };

  // Option Operations
  const handleAddOption = () => {
    if (!selectedBlock) return;
    const newOption: OptionChoice = {
      id: `opt-${Date.now()}`,
      text: 'New Action Choice',
      grayOutOnComplete: false,
      actions: [],
    };
    handleUpdateSelectedBlock({
      options: [...selectedBlock.options, newOption],
    });
  };

  const handleUpdateOption = (optIndex: number, updates: Partial<OptionChoice>) => {
    if (!selectedBlock) return;
    const nextOptions = [...selectedBlock.options];
    nextOptions[optIndex] = { ...nextOptions[optIndex], ...updates };
    handleUpdateSelectedBlock({ options: nextOptions });
  };

  const handleDeleteOption = (optIndex: number) => {
    if (!selectedBlock) return;
    const nextOptions = selectedBlock.options.filter((_, i) => i !== optIndex);
    handleUpdateSelectedBlock({ options: nextOptions });
  };

  // Action Operations within an Option
  const handleAddActionToOption = (optIndex: number, actionType: ActionItem['type']) => {
    if (!selectedBlock) return;
    const opt = selectedBlock.options[optIndex];
    const newAction: ActionItem = {
      id: `act-${Date.now()}`,
      type: actionType,
      targetBlockId: actionType === 'narrative_nav' ? blocks[0]?.id : undefined,
      metricId: actionType === 'metric_delta' ? metrics[0]?.id : undefined,
      metricDelta: actionType === 'metric_delta' ? -5 : undefined,
      itemId: ['give_item', 'take_item', 'require_item'].includes(actionType)
        ? items[0]?.id
        : undefined,
      itemQuantity: 1,
      lootboxRolls: actionType === 'lootbox' ? 1 : undefined,
      lootboxEntries:
        actionType === 'lootbox'
          ? items.slice(0, 3).map((it, idx) => ({
              itemId: it.id,
              weight: idx === 0 ? 50 : idx === 1 ? 30 : 20,
              minCount: 1,
              maxCount: 1,
            }))
          : undefined,
      presetId: actionType === 'preset_call' ? presets[0]?.id : undefined,
    };
    const nextOptions = [...selectedBlock.options];
    nextOptions[optIndex] = {
      ...opt,
      actions: [...opt.actions, newAction],
    };
    handleUpdateSelectedBlock({ options: nextOptions });
  };

  const handleUpdateActionInOption = (
    optIndex: number,
    actionIndex: number,
    updates: Partial<ActionItem>
  ) => {
    if (!selectedBlock) return;
    const opt = selectedBlock.options[optIndex];
    const nextActions = [...opt.actions];
    nextActions[actionIndex] = { ...nextActions[actionIndex], ...updates };
    const nextOptions = [...selectedBlock.options];
    nextOptions[optIndex] = { ...opt, actions: nextActions };
    handleUpdateSelectedBlock({ options: nextOptions });
  };

  const handleDeleteActionInOption = (optIndex: number, actionIndex: number) => {
    if (!selectedBlock) return;
    const opt = selectedBlock.options[optIndex];
    const nextActions = opt.actions.filter((_, i) => i !== actionIndex);
    const nextOptions = [...selectedBlock.options];
    nextOptions[optIndex] = { ...opt, actions: nextActions };
    handleUpdateSelectedBlock({ options: nextOptions });
  };

  const filteredBlocks = blocks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      b.text.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Left Column: Narrative Blocks Navigator */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Narrative Blocks & Story Map
            </h2>
            <p className="text-xs text-slate-400">
              {blocks.length} story node{blocks.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleCreateBlock(false)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors"
              title="Add narrative chapter block"
            >
              <Plus className="w-3.5 h-3.5" />
              Node
            </button>
            <button
              type="button"
              onClick={() => handleCreateBlock(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600/80 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors"
              title="Add an ending block"
            >
              <Trophy className="w-3.5 h-3.5" />
              Ending
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filter story nodes..."
          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        />

        {/* Blocks list */}
        <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
          {filteredBlocks.map((b) => {
            const isSelected = b.id === selectedBlockId;
            return (
              <div
                key={b.id}
                onClick={() => setSelectedBlockId(b.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-sky-500 shadow-sm ring-1 ring-sky-500/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {b.isStart && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                        START
                      </span>
                    )}
                    {b.isEnding && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.5 rounded">
                        {b.endingType?.toUpperCase() || 'ENDING'}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {b.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {b.options.length} choice{b.options.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {b.text || 'Empty chapter text'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Selected Block Editor */}
      <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        {selectedBlock ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-400" />
                <div>
                  <span className="text-xs font-semibold uppercase text-sky-400 tracking-wider">
                    {selectedBlock.isEnding ? 'Ending Node' : 'Narrative Node'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-100 font-display">
                    {selectedBlock.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteBlock(selectedBlock.id)}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2.5 py-1.5 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Block
                </button>
              </div>
            </div>

            {/* Block Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Block Title</label>
                <input
                  type="text"
                  value={selectedBlock.title}
                  onChange={(e) => handleUpdateSelectedBlock({ title: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedBlock.isStart || false}
                    onChange={(e) => handleUpdateSelectedBlock({ isStart: e.target.checked })}
                    className="rounded border-slate-700 text-sky-500"
                  />
                  <span>Mark as Starting Block</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedBlock.isEnding || false}
                    onChange={(e) =>
                      handleUpdateSelectedBlock({
                        isEnding: e.target.checked,
                        endingType: e.target.checked ? 'neutral' : undefined,
                      })
                    }
                    className="rounded border-slate-700 text-amber-500"
                  />
                  <span>Is Ending Block</span>
                </label>

                {selectedBlock.isEnding && (
                  <select
                    value={selectedBlock.endingType || 'neutral'}
                    onChange={(e) =>
                      handleUpdateSelectedBlock({
                        endingType: e.target.value as NarrativeBlock['endingType'],
                      })
                    }
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="victory">Victory</option>
                    <option value="defeat">Defeat</option>
                    <option value="neutral">Neutral Resolution</option>
                  </select>
                )}
              </div>
            </div>

            {/* Narrative Box Content */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                Narrative Prose (Appears in Top-Middle Narrative Box)
              </label>
              <textarea
                rows={5}
                value={selectedBlock.text}
                onChange={(e) => handleUpdateSelectedBlock({ text: e.target.value })}
                placeholder="Write the atmospheric scene description here. The player will read this upon entering this block."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Configurable Choices / Options List */}
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-200 tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-sky-400" />
                    Available Player Options / Action Choices
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Options can navigate to narrative blocks, require & take items, adjust metrics, or trigger lootbox crates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Option Choice
                </button>
              </div>

              {selectedBlock.options.length === 0 ? (
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-center text-xs text-slate-400 italic">
                  No choices added for this node. (If this is an ending, options can offer a restart or return).
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedBlock.options.map((opt, optIdx) => (
                    <div
                      key={opt.id || optIdx}
                      className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Choice Option Label
                          </label>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) =>
                              handleUpdateOption(optIdx, { text: e.target.value })
                            }
                            placeholder="e.g. Rummage through the iron crate"
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-medium focus:outline-none focus:border-sky-500"
                          />
                        </div>

                        <div className="flex items-center gap-3 pt-5">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={opt.grayOutOnComplete}
                              onChange={(e) =>
                                handleUpdateOption(optIdx, {
                                  grayOutOnComplete: e.target.checked,
                                })
                              }
                              className="rounded border-slate-700 text-sky-500"
                            />
                            <span>Gray Out When Completed</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleDeleteOption(optIdx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Remove choice option"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Actions in this option */}
                      <div className="space-y-2 pt-2 border-t border-slate-850">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Chained Actions & Logic ({opt.actions.length})
                          </span>

                          {/* Quick Add Action Selector */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAddActionToOption(optIdx, 'narrative_nav')}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                              title="Branch forward, back, or to an ending block"
                            >
                              + Move to Block
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddActionToOption(optIdx, 'metric_delta')}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                              title="Add or subtract from a metric (e.g. -5 Hunger)"
                            >
                              + Metric Delta
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddActionToOption(optIdx, 'require_item')}
                              className="px-2 py-0.5 bg-amber-950/70 border border-amber-800 hover:bg-amber-900/60 text-amber-300 rounded text-[11px]"
                              title="Require items to succeed and take them"
                            >
                              + Require Item!
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddActionToOption(optIdx, 'give_item')}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                              title="Give an item to player inventory"
                            >
                              + Give Item
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddActionToOption(optIdx, 'lootbox')}
                              className="px-2 py-0.5 bg-purple-950/70 border border-purple-800 hover:bg-purple-900/60 text-purple-300 rounded text-[11px]"
                              title="Lootbox procedural rolling crate"
                            >
                              + Lootbox
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddActionToOption(optIdx, 'preset_call')}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                              title="Call a saved preset function"
                            >
                              + Preset
                            </button>
                          </div>
                        </div>

                        {opt.actions.map((act, actIdx) => (
                          <div
                            key={act.id || actIdx}
                            className="p-2.5 bg-slate-900/90 rounded border border-slate-800 text-xs flex flex-wrap items-center gap-2"
                          >
                            <span className="font-mono text-slate-500 text-[10px]">
                              {actIdx + 1}.
                            </span>

                            {/* Action Type: Narrative Navigation */}
                            {act.type === 'narrative_nav' && (
                              <div className="flex items-center gap-2 flex-1">
                                <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                                <span className="text-slate-300 text-[11px]">Go to block:</span>
                                <select
                                  value={act.targetBlockId || ''}
                                  onChange={(e) =>
                                    handleUpdateActionInOption(optIdx, actIdx, {
                                      targetBlockId: e.target.value,
                                    })
                                  }
                                  className="flex-1 max-w-xs bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                                >
                                  {blocks.map((b) => (
                                    <option key={b.id} value={b.id}>
                                      {b.isStart ? '[START] ' : b.isEnding ? '[ENDING] ' : ''}
                                      {b.title}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Action Type: Metric Delta */}
                            {act.type === 'metric_delta' && (
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-slate-300 text-[11px]">Modify Metric:</span>
                                <select
                                  value={act.metricId || ''}
                                  onChange={(e) =>
                                    handleUpdateActionInOption(optIdx, actIdx, {
                                      metricId: e.target.value,
                                    })
                                  }
                                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
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
                                    handleUpdateActionInOption(optIdx, actIdx, {
                                      metricDelta: Number(e.target.value),
                                    })
                                  }
                                  placeholder="-5 or +10"
                                  className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono"
                                />
                              </div>
                            )}

                            {/* Action Type: Require Item */}
                            {act.type === 'require_item' && (
                              <div className="flex items-center gap-2 flex-1 bg-amber-950/20 p-1.5 rounded border border-amber-900/40">
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-amber-300 font-semibold text-[11px]">
                                  Requires Item:
                                </span>
                                <select
                                  value={act.itemId || ''}
                                  onChange={(e) =>
                                    handleUpdateActionInOption(optIdx, actIdx, {
                                      itemId: e.target.value,
                                    })
                                  }
                                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                                >
                                  {items.map((it) => (
                                    <option key={it.id} value={it.id}>
                                      {it.name}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-amber-200/80 text-[11px]">Count:</span>
                                <input
                                  type="number"
                                  min={1}
                                  value={act.itemQuantity || 1}
                                  onChange={(e) =>
                                    handleUpdateActionInOption(optIdx, actIdx, {
                                      itemQuantity: Math.max(1, Number(e.target.value)),
                                    })
                                  }
                                  className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono"
                                />
                                <span className="text-[10px] text-slate-400 italic">
                                  (Takes required count, keeps excess)
                                </span>
                              </div>
                            )}

                            {/* Action Type: Give Item */}
                            {act.type === 'give_item' && (
                              <div className="flex items-center gap-2 flex-1">
                                <Package className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-slate-300 text-[11px]">Give Item:</span>
                                <select
                                  value={act.itemId || ''}
                                  onChange={(e) =>
                                    handleUpdateActionInOption(optIdx, actIdx, {
                                      itemId: e.target.value,
                                    })
                                  }
                                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                                >
                                  {items.map((it) => (
                                    <option key={it.id} value={it.id}>
                                      {it.name}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-slate-400">Qty:</span>
                                <input
                                  type="number"
                                  min={1}
                                  value={act.itemQuantity || 1}
                                  onChange={(e) =>
                                    handleUpdateActionInOption(optIdx, actIdx, {
                                      itemQuantity: Math.max(1, Number(e.target.value)),
                                    })
                                  }
                                  className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono"
                                />
                              </div>
                            )}

                            {/* Action Type: Lootbox Function */}
                            {act.type === 'lootbox' && (
                              <div className="w-full bg-purple-950/20 p-3 rounded-xl border border-purple-900/40 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Dice5 className="w-4 h-4 text-purple-400" />
                                    <span className="text-purple-300 font-semibold text-xs">
                                      Lootbox Crate Roll Function
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-slate-400">Rolls / Items:</span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={10}
                                      value={act.lootboxRolls || 1}
                                      onChange={(e) =>
                                        handleUpdateActionInOption(optIdx, actIdx, {
                                          lootboxRolls: Math.max(1, Number(e.target.value)),
                                        })
                                      }
                                      className="w-14 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs"
                                    />
                                    <span className="text-[10px] text-slate-400">
                                      ({act.lootboxRolls === 1 ? 'Single roll with drop animation' : 'Procedural multiple items'})
                                    </span>
                                  </div>
                                </div>

                                {/* Items in Pool Selector Bar */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                                      Loot Items in Pool ({(act.lootboxEntries || []).length})
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!items.length) {
                                          alert('Please register at least one item in the Inventory Items tab first.');
                                          return;
                                        }
                                        const current = act.lootboxEntries || [];
                                        const newWeight = Math.max(5, Math.floor(100 / (current.length + 1)));
                                        const nextEntries = [
                                          ...current.map((e) => ({
                                            ...e,
                                            weight: Math.max(1, Math.round(e.weight * (current.length / (current.length + 1)))),
                                          })),
                                          {
                                            itemId: items[0]?.id || '',
                                            weight: newWeight,
                                            minCount: 1,
                                            maxCount: 1,
                                          },
                                        ];
                                        // Auto-balance sum to 100
                                        const sum = nextEntries.reduce((a, b) => a + b.weight, 0);
                                        if (sum !== 100 && nextEntries.length > 0) {
                                          nextEntries[nextEntries.length - 1].weight += (100 - sum);
                                        }
                                        handleUpdateActionInOption(optIdx, actIdx, {
                                          lootboxEntries: nextEntries,
                                        });
                                      }}
                                      className="text-[11px] text-purple-300 hover:text-purple-200 bg-purple-900/50 hover:bg-purple-800/60 px-2.5 py-1 rounded border border-purple-700/60 transition-colors"
                                    >
                                      + Add Item to Lootbox Pool
                                    </button>
                                  </div>

                                  {(act.lootboxEntries || []).length > 0 ? (
                                    <>
                                      {/* Item Assignment Row */}
                                      <div className="flex flex-wrap gap-2 text-xs">
                                        {(act.lootboxEntries || []).map((entry, eIdx) => (
                                          <div
                                            key={eIdx}
                                            className="flex items-center gap-1.5 p-1.5 bg-slate-900 rounded border border-slate-800"
                                          >
                                            <span className="text-[10px] text-slate-500 font-mono">#{eIdx + 1}</span>
                                            <select
                                              value={entry.itemId}
                                              onChange={(e) => {
                                                const next = [...(act.lootboxEntries || [])];
                                                next[eIdx] = { ...entry, itemId: e.target.value };
                                                handleUpdateActionInOption(optIdx, actIdx, { lootboxEntries: next });
                                              }}
                                              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 max-w-[120px]"
                                            >
                                              {items.map((it) => (
                                                <option key={it.id} value={it.id}>
                                                  {it.name}
                                                </option>
                                              ))}
                                            </select>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const next = (act.lootboxEntries || []).filter((_, i) => i !== eIdx);
                                                handleUpdateActionInOption(optIdx, actIdx, { lootboxEntries: next });
                                              }}
                                              className="text-slate-500 hover:text-rose-400 p-0.5"
                                              title="Remove from pool"
                                            >
                                              &times;
                                            </button>
                                          </div>
                                        ))}
                                      </div>

                                      {/* 100% Probability Balance Ring with adjustable partition lines */}
                                      <LootboxBalanceRing
                                        entries={act.lootboxEntries || []}
                                        items={items}
                                        onChange={(nextEntries) =>
                                          handleUpdateActionInOption(optIdx, actIdx, {
                                            lootboxEntries: nextEntries,
                                          })
                                        }
                                      />
                                    </>
                                  ) : (
                                    <div className="p-4 bg-slate-950/60 rounded border border-dashed border-purple-900/40 text-center text-xs text-slate-400 italic">
                                      No items in lootbox pool. Click &quot;+ Add Item to Lootbox Pool&quot; to configure items and set their 100% balance percentages.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Action Type: Preset Call */}
                            {act.type === 'preset_call' && (
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-slate-300 text-[11px]">Execute Preset:</span>
                                <select
                                  value={act.presetId || ''}
                                  onChange={(e) =>
                                    handleUpdateActionInOption(optIdx, actIdx, {
                                      presetId: e.target.value,
                                    })
                                  }
                                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                                >
                                  {presets.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteActionInOption(optIdx, actIdx)}
                              className="text-slate-500 hover:text-rose-400 p-1 ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <BookOpen className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">No narrative node selected. Choose or create a chapter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
