import React, { useState, useEffect, useRef } from 'react';
import {
  AdventureProject,
  PlayerState,
  OptionChoice,
  ActionItem,
  Item,
  LootboxItemEntry,
} from '../types/cyoa';
import { MetricRing } from './MetricRing';
import {
  Package,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Info,
  CheckCircle,
  X,
  Volume2,
  VolumeX,
  Utensils,
} from 'lucide-react';

interface PlayerViewProps {
  adventure: AdventureProject;
  onExitPreview?: () => void;
}

interface LootboxRevealData {
  item: Item;
  count: number;
  allRolled?: { item: Item; count: number }[];
  isMulti: boolean;
}

export const PlayerView: React.FC<PlayerViewProps> = ({ adventure, onExitPreview }) => {
  // Sound effects helper using Web Audio API
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  };

  const playChime = () => {
    playTone(523.25, 0.15, 'triangle'); // C5
    setTimeout(() => playTone(659.25, 0.2, 'triangle'), 100); // E5
    setTimeout(() => playTone(783.99, 0.35, 'triangle'), 200); // G5
  };

  const playWarningTone = () => {
    playTone(220, 0.2, 'sawtooth');
    setTimeout(() => playTone(180, 0.3, 'sawtooth'), 150);
  };

  // Find start block
  const startBlock = adventure.blocks.find((b) => b.isStart) || adventure.blocks[0];

  // Initialize Game State
  const [gameState, setGameState] = useState<PlayerState>(() => {
    const initialMetrics: Record<string, number> = {};
    adventure.metrics.forEach((m) => {
      initialMetrics[m.id] = m.initialValue;
    });

    const initialInventory: Record<string, number> = {};
    adventure.items.forEach((it) => {
      if (it.initialQuantity > 0) {
        initialInventory[it.id] = it.initialQuantity;
      }
    });

    return {
      currentBlockId: startBlock?.id || '',
      metrics: initialMetrics,
      inventory: initialInventory,
      completedOptions: {},
      visitedBlockIds: startBlock ? [startBlock.id] : [],
      history: [],
      lastNotice: null,
    };
  });

  const [noticeModal, setNoticeModal] = useState<{ title: string; text: string; isError?: boolean } | null>(
    null
  );
  const [inspectItem, setInspectItem] = useState<{ item: Item; quantity: number } | null>(null);

  // Lootbox animated reveal state
  const [lootboxReveal, setLootboxReveal] = useState<LootboxRevealData | null>(null);
  const [isAnimatingDrop, setIsAnimatingDrop] = useState(false);

  const inventoryScrollRef = useRef<HTMLDivElement>(null);

  const currentBlock =
    adventure.blocks.find((b) => b.id === gameState.currentBlockId) || startBlock;

  // Synchronize when switching adventures
  useEffect(() => {
    const initialMetrics: Record<string, number> = {};
    adventure.metrics.forEach((m) => {
      initialMetrics[m.id] = m.initialValue;
    });

    const initialInventory: Record<string, number> = {};
    adventure.items.forEach((it) => {
      if (it.initialQuantity > 0) {
        initialInventory[it.id] = it.initialQuantity;
      }
    });

    const nextStartBlock = adventure.blocks.find((b) => b.isStart) || adventure.blocks[0];

    setGameState({
      currentBlockId: nextStartBlock?.id || '',
      metrics: initialMetrics,
      inventory: initialInventory,
      completedOptions: {},
      visitedBlockIds: nextStartBlock ? [nextStartBlock.id] : [],
      history: [],
      lastNotice: null,
    });
    setNoticeModal(null);
    setInspectItem(null);
    setLootboxReveal(null);
  }, [adventure.id]);

  // Restart Journey
  const handleRestart = () => {
    const initialMetrics: Record<string, number> = {};
    adventure.metrics.forEach((m) => {
      initialMetrics[m.id] = m.initialValue;
    });

    const initialInventory: Record<string, number> = {};
    adventure.items.forEach((it) => {
      if (it.initialQuantity > 0) {
        initialInventory[it.id] = it.initialQuantity;
      }
    });

    setGameState({
      currentBlockId: startBlock?.id || '',
      metrics: initialMetrics,
      inventory: initialInventory,
      completedOptions: {},
      visitedBlockIds: startBlock ? [startBlock.id] : [],
      history: [],
      lastNotice: null,
    });
    setNoticeModal(null);
    setInspectItem(null);
    setLootboxReveal(null);
    playTone(440, 0.2);
  };

  // Scroll Inventory Horizontally
  const scrollInventory = (direction: 'left' | 'right') => {
    if (inventoryScrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      inventoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Check Metric Triggers
  const checkMetricTriggers = (updatedMetrics: Record<string, number>, currentBlockId: string) => {
    let nextBlockId = currentBlockId;

    for (const metricDef of adventure.metrics) {
      const val = updatedMetrics[metricDef.id] ?? metricDef.initialValue;
      for (const trig of metricDef.triggers) {
        let conditionMet = false;
        if (trig.condition === 'less_than_or_equal' && val <= trig.threshold) {
          conditionMet = true;
        } else if (trig.condition === 'greater_than_or_equal' && val >= trig.threshold) {
          conditionMet = true;
        } else if (trig.condition === 'equals' && val === trig.threshold) {
          conditionMet = true;
        }

        if (conditionMet) {
          if (trig.noticeText) {
            setNoticeModal({
              title: `Vital Warning: ${metricDef.name}`,
              text: trig.noticeText,
              isError: true,
            });
            playWarningTone();
          }

          if ((trig.actionType === 'ending' || trig.actionType === 'goto_block') && trig.targetBlockId) {
            nextBlockId = trig.targetBlockId;
          }
        }
      }
    }

    return nextBlockId;
  };

  // Handle Using an Item from Inventory (e.g. Eating food, drinking water)
  const handleUseItem = (item: Item) => {
    const currentQty = gameState.inventory[item.id] || 0;
    if (currentQty <= 0) return;

    playChime();

    // 1. Calculate updated metrics
    const nextMetrics = { ...gameState.metrics };
    const effectsSummary: string[] = [];

    (item.metricEffects || []).forEach((eff) => {
      const mDef = adventure.metrics.find((m) => m.id === eff.metricId);
      if (mDef) {
        const cur = nextMetrics[mDef.id] ?? mDef.initialValue;
        const minVal = mDef.minValue ?? 0;
        const maxVal = mDef.maxValue ?? 100;
        const updated = Math.max(minVal, Math.min(maxVal, cur + eff.delta));
        nextMetrics[mDef.id] = updated;
        const sign = eff.delta >= 0 ? '+' : '';
        effectsSummary.push(`${mDef.name} ${sign}${eff.delta}`);
      }
    });

    // 2. Consume item if consumable (default true)
    const nextInventory = { ...gameState.inventory };
    const isConsumable = item.consumable !== false;
    let remainingQty = currentQty;

    if (isConsumable) {
      nextInventory[item.id] = currentQty - 1;
      remainingQty = currentQty - 1;
      if (nextInventory[item.id] <= 0) {
        delete nextInventory[item.id];
      }
    }

    // 3. Check metric triggers with updated metrics
    const finalBlockId = checkMetricTriggers(nextMetrics, gameState.currentBlockId);

    setGameState((prev) => ({
      ...prev,
      metrics: nextMetrics,
      inventory: nextInventory,
      currentBlockId: finalBlockId,
    }));

    // Update or close inspect popover
    if (remainingQty <= 0) {
      setInspectItem(null);
    } else {
      setInspectItem({ item, quantity: remainingQty });
    }

    // Feedback message
    const msg =
      item.useMessage ||
      (effectsSummary.length > 0
        ? `Used ${item.name}! (${effectsSummary.join(', ')})`
        : `Used ${item.name}.`);

    setNoticeModal({
      title: `${item.useLabel || 'Used'} ${item.name}`,
      text: msg,
    });
  };

  // Weighted Lootbox Roll helper directly using the user's mathematical model
  const runLootboxRoll = (entries: LootboxItemEntry[], rollsCount: number) => {
    if (!entries.length) return null;

    const rolledResults: { item: Item; count: number }[] = [];
    const pool: LootboxItemEntry[] = [];
    const weights: number[] = [];

    entries.forEach((entry) => {
      pool.push(entry);
      weights.push(Math.max(1, entry.weight));
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);

    for (let r = 0; r < rollsCount; r++) {
      let rand = Math.random() * totalWeight;
      let chosenEntry = pool[0];

      for (let i = 0; i < pool.length; i++) {
        if (rand < weights[i]) {
          chosenEntry = pool[i];
          break;
        }
        rand -= weights[i];
      }

      const itemDef = adventure.items.find((it) => it.id === chosenEntry.itemId);
      if (itemDef) {
        const minC = chosenEntry.minCount || 1;
        const maxC = chosenEntry.maxCount || 1;
        const count = Math.floor(Math.random() * (maxC - minC + 1)) + minC;
        rolledResults.push({ item: itemDef, count });
      }
    }

    return rolledResults;
  };

  // Handle Option Click
  const handleSelectOption = (option: OptionChoice) => {
    // If option already grayed out and completed
    if (gameState.completedOptions[option.id] && option.grayOutOnComplete) {
      return;
    }

    playTone(330, 0.1);

    // 1. Verify all "require_item" requirements
    const requirementActions = option.actions.filter((a) => a.type === 'require_item');
    for (const req of requirementActions) {
      const reqId = req.itemId || '';
      const neededQty = req.itemQuantity || 1;
      const currentQty = gameState.inventory[reqId] || 0;
      const itemDef = adventure.items.find((i) => i.id === reqId);
      const itemName = itemDef ? itemDef.name : 'Required Item';

      if (currentQty < neededQty) {
        playWarningTone();
        setNoticeModal({
          title: 'Action Unsuccessful',
          text: `Unsuccessful! You do not have the required item: ${itemName}.\n\nPossessed: ${currentQty} | Required: ${neededQty}`,
          isError: true,
        });
        return;
      }
    }

    // 2. Consume required items (takes required, leaves excess)
    const nextInventory = { ...gameState.inventory };
    for (const req of requirementActions) {
      const reqId = req.itemId || '';
      const neededQty = req.itemQuantity || 1;
      nextInventory[reqId] = (nextInventory[reqId] || 0) - neededQty;
      if (nextInventory[reqId] <= 0) {
        delete nextInventory[reqId];
      }
    }

    // 3. Process remaining actions
    let nextMetrics = { ...gameState.metrics };
    let nextBlockId = gameState.currentBlockId;
    let lootboxDataToReveal: LootboxRevealData | null = null;

    const executeAction = (action: ActionItem) => {
      switch (action.type) {
        case 'narrative_nav':
          if (action.targetBlockId) {
            nextBlockId = action.targetBlockId;
          }
          break;

        case 'metric_delta':
          if (action.metricId) {
            const mDef = adventure.metrics.find((m) => m.id === action.metricId);
            if (mDef) {
              const currentVal = nextMetrics[mDef.id] ?? mDef.initialValue;
              const delta = action.metricDelta || 0;
              const minVal = mDef.minValue ?? 0;
              const maxVal = mDef.maxValue ?? 100;
              nextMetrics[mDef.id] = Math.max(minVal, Math.min(maxVal, currentVal + delta));
            }
          }
          break;

        case 'give_item':
          if (action.itemId) {
            const qty = action.itemQuantity || 1;
            nextInventory[action.itemId] = (nextInventory[action.itemId] || 0) + qty;
            const givenItem = adventure.items.find((i) => i.id === action.itemId);
            playChime();
            setNoticeModal({
              title: 'Item Obtained',
              text: `You acquired ${qty > 1 ? `${qty}x ` : ''}${givenItem ? givenItem.name : 'an item'} into your inventory!`,
            });
          }
          break;

        case 'take_item':
          if (action.itemId) {
            const qty = action.itemQuantity || 1;
            const currentQty = nextInventory[action.itemId] || 0;
            nextInventory[action.itemId] = Math.max(0, currentQty - qty);
            if (nextInventory[action.itemId] <= 0) {
              delete nextInventory[action.itemId];
            }
          }
          break;

        case 'lootbox': {
          const entries = action.lootboxEntries || [];
          const rolls = action.lootboxRolls || 1;
          const results = runLootboxRoll(entries, rolls);

          if (results && results.length > 0) {
            // Add items to inventory
            results.forEach((res) => {
              nextInventory[res.item.id] = (nextInventory[res.item.id] || 0) + res.count;
            });

            if (results.length === 1) {
              // Single item roll: Trigger brief reveal + animation into inventory
              lootboxDataToReveal = {
                item: results[0].item,
                count: results[0].count,
                isMulti: false,
              };
            } else {
              // Multiple procedural items
              lootboxDataToReveal = {
                item: results[0].item,
                count: results[0].count,
                allRolled: results,
                isMulti: true,
              };
            }
            playChime();
          }
          break;
        }

        case 'preset_call': {
          if (action.presetId) {
            const preset = adventure.presets.find((p) => p.id === action.presetId);
            if (preset) {
              preset.actions.forEach((pAct) => executeAction(pAct));
            }
          }
          break;
        }

        default:
          break;
      }
    };

    // Execute actions in sequence
    option.actions.forEach((act) => {
      if (act.type !== 'require_item') {
        executeAction(act);
      }
    });

    // Mark as completed if grayOutOnComplete
    const nextCompletedOptions = { ...gameState.completedOptions };
    if (option.grayOutOnComplete) {
      nextCompletedOptions[option.id] = true;
    }

    // Check metric threshold triggers
    const finalBlockId = checkMetricTriggers(nextMetrics, nextBlockId);

    setGameState((prev) => ({
      ...prev,
      currentBlockId: finalBlockId,
      metrics: nextMetrics,
      inventory: nextInventory,
      completedOptions: nextCompletedOptions,
      visitedBlockIds: [...prev.visitedBlockIds, finalBlockId],
    }));

    if (lootboxDataToReveal) {
      setLootboxReveal(lootboxDataToReveal);
      setIsAnimatingDrop(false);
    }
  };

  // Close Lootbox animation with drop
  const handleAcknowledgeLootbox = () => {
    setIsAnimatingDrop(true);
    setTimeout(() => {
      setLootboxReveal(null);
      setIsAnimatingDrop(false);
    }, 600);
  };

  // Format Requirement Text for Choice Label
  const getRequirementDisplay = (option: OptionChoice) => {
    const reqAction = option.actions.find((a) => a.type === 'require_item');
    if (!reqAction || !reqAction.itemId) return null;

    const item = adventure.items.find((i) => i.id === reqAction.itemId);
    const itemName = item ? item.name : 'Key Item';
    const qty = reqAction.itemQuantity || 1;

    if (qty > 1) {
      return `requires ${itemName}s! (${qty})`;
    }
    return `requires ${itemName}!`;
  };

  const inventoryEntries = Object.entries(gameState.inventory)
    .filter(([_, qty]) => qty > 0)
    .map(([itemId, quantity]) => {
      const itemDef = adventure.items.find((it) => it.id === itemId);
      return { item: itemDef, quantity };
    })
    .filter((entry): entry is { item: Item; quantity: number } => !!entry.item);

  return (
    <div className="relative w-full min-h-[780px] bg-[#070a10] text-slate-100 flex flex-col justify-between overflow-hidden select-none">
      {/* Subtle fantasy vignette backdrop */}
      <div className="absolute inset-0 bg-radial from-slate-900/40 via-transparent to-black pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm tracking-wider uppercase text-slate-200 font-bold">
            {adventure.title}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">Adventure Engine Runtime</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart Journey
          </button>

          {onExitPreview && (
            <button
              type="button"
              onClick={onExitPreview}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors"
            >
              Return to Builder
            </button>
          )}
        </div>
      </header>

      {/* Main Game Stage: Top-Middle Narrative Box & Below Choice Options */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start max-w-4xl w-full mx-auto px-4 py-6 overflow-y-auto">
        {/* Narrative Box (Top-Middle-ish) */}
        <section className="w-full bg-slate-900/90 border border-slate-700/70 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md mb-6 relative group transition-all">
          {/* Ending Badge or Chapter Badge */}
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              {currentBlock?.isEnding ? (
                <span
                  className={`text-[11px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full ${
                    currentBlock.endingType === 'victory'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-700/80'
                      : currentBlock.endingType === 'defeat'
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-700/80'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {currentBlock.endingType === 'victory'
                    ? '✦ VICTORY RESOLUTION ✦'
                    : currentBlock.endingType === 'defeat'
                    ? '☠ DEFEAT & DEATH ☠'
                    : '✦ CONCLUSION ✦'}
                </span>
              ) : (
                <span className="text-[11px] font-mono tracking-widest uppercase text-sky-400">
                  {currentBlock?.isStart ? 'PROLOGUE · ENTRY POINT' : 'CHAPTER SCENARIO'}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Steps taken: {gameState.visitedBlockIds.length}
            </span>
          </div>

          <h1 className="font-display text-xl md:text-2xl font-bold text-slate-100 mb-4 tracking-wide text-balance">
            {currentBlock?.title || 'Unknown Path'}
          </h1>

          <div className="text-sm md:text-base leading-relaxed text-slate-300 whitespace-pre-line font-normal">
            {currentBlock?.text || 'The air is silent.'}
          </div>
        </section>

        {/* Choice Options List (Directly Below the Narrative Box) */}
        <section className="w-full space-y-2.5">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Decide Your Action
            </span>
            <span className="text-[11px] text-slate-500">
              {currentBlock?.options.length || 0} option{currentBlock?.options.length === 1 ? '' : 's'} available
            </span>
          </div>

          {currentBlock?.options.length === 0 ? (
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-3">
              <p className="text-sm text-slate-400 italic">
                There are no further paths leading from here. Your story has concluded.
              </p>
              <button
                type="button"
                onClick={handleRestart}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow"
              >
                Start Over from Beginning
              </button>
            </div>
          ) : (
            currentBlock?.options.map((option) => {
              const isCompleted = !!gameState.completedOptions[option.id];
              const isGrayedOut = isCompleted && option.grayOutOnComplete;
              const reqText = getRequirementDisplay(option);

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isGrayedOut}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full group text-left px-5 py-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                    isGrayedOut
                      ? 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed line-through opacity-60'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-750 hover:border-sky-500/80 text-slate-200 hover:text-white shadow-md hover:shadow-sky-500/5 active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isGrayedOut
                          ? 'bg-slate-700'
                          : reqText
                          ? 'bg-amber-400 ring-2 ring-amber-400/20'
                          : 'bg-sky-400 group-hover:bg-sky-300'
                      }`}
                    />
                    <span className="text-xs md:text-sm font-medium tracking-wide truncate">
                      {option.text}
                    </span>
                  </div>

                  {reqText && !isGrayedOut && (
                    <span className="shrink-0 text-[11px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded shadow-sm">
                      {reqText}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </section>
      </main>

      {/* Bottom HUD: Metric Rings on Bottom-Left & Inventory Bar on Bottom */}
      <footer className="relative z-20 w-full border-t border-slate-800 bg-[#090d16]/95 backdrop-blur-md p-4 flex flex-col md:flex-row items-center gap-6">
        {/* Metric Rings (Bottom-Left as strictly requested) */}
        <div className="shrink-0 flex items-center gap-5 pl-2">
          {adventure.metrics.map((metric) => {
            const currentVal = gameState.metrics[metric.id] ?? metric.initialValue;
            return (
              <MetricRing
                key={metric.id}
                name={metric.name}
                current={currentVal}
                max={metric.maxValue}
                color={metric.color}
                size={82}
                strokeWidth={7}
              />
            );
          })}
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block w-px h-16 bg-slate-800 shrink-0" />

        {/* Inventory Bar (Bottom scrollable pouch) */}
        <div className="flex-1 w-full min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between pb-1.5 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-sky-400" />
              Adventurer Pouch & Inventory ({inventoryEntries.length} items)
            </span>

            {/* Scroll navigation arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollInventory('left')}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                title="Scroll Left"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => scrollInventory('right')}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                title="Scroll Right"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Slots container (Scrollable horizontally) */}
          <div
            ref={inventoryScrollRef}
            className="flex items-center gap-3 overflow-x-auto pb-1 pt-0.5 scroll-smooth"
          >
            {inventoryEntries.length === 0 ? (
              <div className="h-16 flex items-center px-4 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500 italic">
                Your pockets are empty. Search crates and explore rooms to find items.
              </div>
            ) : (
              inventoryEntries.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  onClick={() => setInspectItem({ item, quantity })}
                  className="group relative w-16 h-16 rounded-xl bg-black border border-slate-700/80 hover:border-sky-400 overflow-hidden shrink-0 cursor-pointer shadow transition-all hover:scale-105 active:scale-95"
                  title={`${item.name} (x${quantity}) - Click to inspect`}
                >
                  {/* Square-cropped image placed over the slot as strictly requested */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="absolute max-w-none pointer-events-none"
                      style={{
                        width: `${item.crop?.scale || 100}%`,
                        height: `${item.crop?.scale || 100}%`,
                        objectFit: 'cover',
                        left: `calc(50% + ${item.crop?.offsetX || 0}px)`,
                        top: `calc(50% + ${item.crop?.offsetY || 0}px)`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Package className="w-6 h-6" />
                    </div>
                  )}

                  {/* Quantity badge */}
                  {quantity > 1 && (
                    <span className="absolute bottom-1 right-1 bg-black/85 text-sky-300 font-mono text-[10px] font-bold px-1 rounded shadow">
                      x{quantity}
                    </span>
                  )}

                  {/* Item label overlay strip at top */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1 pointer-events-none">
                    <p className="text-[9px] font-medium text-slate-200 truncate leading-none">
                      {item.name}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </footer>

      {/* Item Inspection Popover */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setInspectItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl bg-black border border-slate-700 overflow-hidden shrink-0">
                {inspectItem.item.imageUrl && (
                  <img
                    src={inspectItem.item.imageUrl}
                    alt={inspectItem.item.name}
                    referrerPolicy="no-referrer"
                    className="absolute max-w-none pointer-events-none"
                    style={{
                      width: `${inspectItem.item.crop?.scale || 100}%`,
                      height: `${inspectItem.item.crop?.scale || 100}%`,
                      objectFit: 'cover',
                      left: `calc(50% + ${inspectItem.item.crop?.offsetX || 0}px)`,
                      top: `calc(50% + ${inspectItem.item.crop?.offsetY || 0}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 font-display">
                  {inspectItem.item.name}
                </h3>
                <span className="text-xs font-mono text-sky-400">
                  Carrying: {inspectItem.quantity} unit{inspectItem.quantity === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
              {inspectItem.item.description || 'No lore description inscribed.'}
            </p>

            {/* If Item is Usable: Render Metric Effects & Use Option Button */}
            {inspectItem.item.isUsable && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                {inspectItem.item.metricEffects && inspectItem.item.metricEffects.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Metric Effects:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectItem.item.metricEffects.map((eff, i) => {
                        const m = adventure.metrics.find((m) => m.id === eff.metricId);
                        return (
                          <span
                            key={i}
                            className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-950 border border-slate-800"
                            style={{ color: eff.delta >= 0 ? '#34d399' : '#f87171' }}
                          >
                            {eff.delta >= 0 ? `+${eff.delta}` : eff.delta} {m?.name || 'Metric'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleUseItem(inspectItem.item)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>{inspectItem.item.useLabel || 'Use Item'}</span>
                  {inspectItem.item.consumable !== false && (
                    <span className="font-normal lowercase text-[10px] opacity-80">(consumes 1)</span>
                  )}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setInspectItem(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Animated Lootbox Reveal Modal with Drop into Inventory */}
      {lootboxReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div
            className={`bg-slate-900 border border-purple-500/80 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4 relative transition-all duration-500 transform ${
              isAnimatingDrop
                ? 'translate-y-72 scale-50 opacity-0'
                : 'translate-y-0 scale-100 opacity-100'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-400 mb-2">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-purple-400">
                Lootbox Unlocked!
              </span>
              <h2 className="text-xl font-bold font-display text-slate-100">
                Treasure Uncovered
              </h2>
            </div>

            {!lootboxReveal.isMulti ? (
              <div className="flex flex-col items-center py-2 space-y-3">
                <div className="relative w-28 h-28 rounded-2xl bg-black border-2 border-purple-500 shadow-lg shadow-purple-500/20 overflow-hidden">
                  {lootboxReveal.item.imageUrl && (
                    <img
                      src={lootboxReveal.item.imageUrl}
                      alt={lootboxReveal.item.name}
                      referrerPolicy="no-referrer"
                      className="absolute max-w-none pointer-events-none"
                      style={{
                        width: `${lootboxReveal.item.crop?.scale || 100}%`,
                        height: `${lootboxReveal.item.crop?.scale || 100}%`,
                        objectFit: 'cover',
                        left: `calc(50% + ${lootboxReveal.item.crop?.offsetX || 0}px)`,
                        top: `calc(50% + ${lootboxReveal.item.crop?.offsetY || 0}px)`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {lootboxReveal.item.name}
                  </h3>
                  <span className="text-xs font-mono text-purple-300 font-semibold">
                    +{lootboxReveal.count} added to Pouch
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-xs">
                  {lootboxReveal.item.description}
                </p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <p className="text-xs text-slate-300">
                  You opened the crate and uncovered several procedurally rolled items:
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {lootboxReveal.allRolled?.map((rolled, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 bg-slate-950 rounded-lg border border-slate-800 text-left"
                    >
                      <div className="relative w-10 h-10 rounded bg-black border border-slate-700 overflow-hidden shrink-0">
                        {rolled.item.imageUrl && (
                          <img
                            src={rolled.item.imageUrl}
                            alt={rolled.item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-200 block truncate">
                          {rolled.item.name}
                        </span>
                        <span className="text-[11px] font-mono text-purple-400">
                          +{rolled.count} Quantity
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleAcknowledgeLootbox}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Collect into Inventory
            </button>
          </div>
        </div>
      )}

      {/* Notice / Warning Modal */}
      {noticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className={`bg-slate-900 border rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative ${
              noticeModal.isError ? 'border-rose-500/80' : 'border-sky-500/80'
            }`}
          >
            <div className="flex items-start gap-3">
              {noticeModal.isError ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-100">{noticeModal.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1 whitespace-pre-line">
                  {noticeModal.text}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setNoticeModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
