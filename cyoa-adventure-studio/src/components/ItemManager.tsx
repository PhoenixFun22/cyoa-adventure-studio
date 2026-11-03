import React, { useState } from 'react';
import { Item, ItemCrop, ItemMetricEffect, Metric } from '../types/cyoa';
import { SquareImageCropper } from './SquareImageCropper';
import { Plus, Trash2, Package, Upload, Image as ImageIcon, HeartPulse, Sparkles, Utensils } from 'lucide-react';

interface ItemManagerProps {
  items: Item[];
  metrics: Metric[];
  onChange: (updatedItems: Item[]) => void;
}

export const ItemManager: React.FC<ItemManagerProps> = ({ items, metrics, onChange }) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleCreateItem = () => {
    const newItem: Item = {
      id: `item-${Date.now()}`,
      name: `Item ${items.length + 1}`,
      description: '',
      imageUrl: '',
      crop: { scale: 100, offsetX: 0, offsetY: 0 },
      initialQuantity: 1,
      stackable: true,
      isUsable: false,
      consumable: true,
      useLabel: 'Use',
      useMessage: '',
      metricEffects: [],
    };
    onChange([...items, newItem]);
    setSelectedItemId(newItem.id);
  };

  const handleUpdateSelectedItem = (updates: Partial<Item>) => {
    if (!selectedItem) return;
    const nextList = items.map((it) => (it.id === selectedItem.id ? { ...it, ...updates } : it));
    onChange(nextList);
  };

  const handleDeleteItem = (id: string) => {
    const nextList = items.filter((it) => it.id !== id);
    onChange(nextList);
    if (selectedItemId === id) {
      setSelectedItemId(nextList[0]?.id || '');
    }
  };

  const handleAddMetricEffect = () => {
    if (!selectedItem) return;
    const defaultMetricId = metrics[0]?.id || '';
    const newEffect: ItemMetricEffect = {
      metricId: defaultMetricId,
      delta: 20,
    };
    handleUpdateSelectedItem({
      metricEffects: [...(selectedItem.metricEffects || []), newEffect],
    });
  };

  const handleUpdateMetricEffect = (index: number, updates: Partial<ItemMetricEffect>) => {
    if (!selectedItem) return;
    const nextEffects = [...(selectedItem.metricEffects || [])];
    nextEffects[index] = { ...nextEffects[index], ...updates };
    handleUpdateSelectedItem({ metricEffects: nextEffects });
  };

  const handleDeleteMetricEffect = (index: number) => {
    if (!selectedItem) return;
    const nextEffects = (selectedItem.metricEffects || []).filter((_, i) => i !== index);
    handleUpdateSelectedItem({ metricEffects: nextEffects });
  };

  // Convert uploaded image to base64 data URL so it's fully bundled with this adventure
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result && selectedItem) {
          handleUpdateSelectedItem({
            imageUrl: result,
            crop: { scale: 100, offsetX: 0, offsetY: 0 },
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Left Column: Item List */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Objects & Inventory Registry
            </h2>
            <p className="text-xs text-slate-400">
              {items.length} item{items.length === 1 ? '' : 's'} registered in adventure
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateItem}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Item
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-8 bg-slate-950/60 rounded-xl border border-slate-800 text-center space-y-2">
            <Package className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs text-slate-400 font-medium">No items in this adventure.</p>
            <p className="text-[11px] text-slate-500">
              Click &quot;New Item&quot; to register items with usable actions and square-cropped images.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {items.map((item) => {
              const isSelected = item.id === selectedItemId;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-sky-500 shadow-sm ring-1 ring-sky-500/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  {/* Square Thumbnail */}
                  <div className="relative w-12 h-12 rounded bg-black border border-slate-700 overflow-hidden shrink-0">
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
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    {item.initialQuantity > 0 && (
                      <span className="absolute bottom-0 right-0 bg-sky-950/90 text-sky-300 font-mono text-[9px] px-1 font-bold rounded-tl">
                        x{item.initialQuantity}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {item.name}
                      </span>
                      {item.isUsable && (
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1 rounded border border-emerald-800/60">
                          Usable
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.description || 'No description provided'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Selected Item Editor */}
      <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        {selectedItem ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase text-sky-400 tracking-wider">
                  Item Configuration
                </span>
                <h3 className="text-lg font-bold text-slate-100 font-display">
                  {selectedItem.name || 'Untitled Item'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteItem(selectedItem.id)}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2.5 py-1.5 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={selectedItem.name}
                  onChange={(e) => handleUpdateSelectedItem({ name: e.target.value })}
                  placeholder="e.g. Cooked Meat, Fresh Spring Water, Health Salve"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Initial Starting Quantity (in inventory at start)
                </label>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={selectedItem.initialQuantity}
                  onChange={(e) =>
                    handleUpdateSelectedItem({ initialQuantity: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Item Description / Inspection Text
              </label>
              <textarea
                rows={2}
                value={selectedItem.description}
                onChange={(e) => handleUpdateSelectedItem({ description: e.target.value })}
                placeholder="Describe the item. For food or drinks, describe how much hunger/thirst fulfillment it gives!"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-400 mt-1 italic">
                Tip: State how much fulfillment or replenishment it provides (e.g. &quot;Provides +35 Hunger when eaten&quot;).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={selectedItem.stackable}
                  onChange={(e) => handleUpdateSelectedItem({ stackable: e.target.checked })}
                  className="rounded border-slate-700 text-sky-500 focus:ring-sky-500/20"
                />
                <span>Allow Item Stacking in Inventory</span>
              </label>
            </div>

            {/* ITEM USABILITY & METRIC EFFECTS (NEW) */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    Use Option & Metric Changing Actions
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-emerald-400 font-medium">
                  <input
                    type="checkbox"
                    checked={selectedItem.isUsable || false}
                    onChange={(e) =>
                      handleUpdateSelectedItem({
                        isUsable: e.target.checked,
                        useLabel: selectedItem.useLabel || 'Use',
                        consumable: selectedItem.consumable !== false,
                      })
                    }
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                  />
                  <span>Enable &quot;Use&quot; Action from Inventory</span>
                </label>
              </div>

              {selectedItem.isUsable ? (
                <div className="space-y-4 pt-2 border-t border-slate-850">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Use Button Label</label>
                      <input
                        type="text"
                        value={selectedItem.useLabel || 'Use'}
                        onChange={(e) => handleUpdateSelectedItem({ useLabel: e.target.value })}
                        placeholder="e.g. Eat, Drink, Consume, Apply"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={selectedItem.consumable !== false}
                          onChange={(e) =>
                            handleUpdateSelectedItem({ consumable: e.target.checked })
                          }
                          className="rounded border-slate-700 text-emerald-500"
                        />
                        <span>Item disappears when used (Decreases count by 1)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs mb-1">
                      Custom Message When Used (Optional)
                    </label>
                    <input
                      type="text"
                      value={selectedItem.useMessage || ''}
                      onChange={(e) => handleUpdateSelectedItem({ useMessage: e.target.value })}
                      placeholder="e.g. You ate the hearty meat and felt your hunger satisfied."
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200"
                    />
                  </div>

                  {/* Metric Effects List */}
                  <div className="space-y-2 pt-2 border-t border-slate-850">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                        Metric Effects (Give or Take from Metrics)
                      </span>
                      <button
                        type="button"
                        onClick={handleAddMetricEffect}
                        disabled={metrics.length === 0}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3" />
                        Add Metric Effect
                      </button>
                    </div>

                    {(!selectedItem.metricEffects || selectedItem.metricEffects.length === 0) ? (
                      <p className="text-[11px] text-slate-500 italic p-2 bg-slate-900/60 rounded border border-slate-800">
                        No metric changes defined. Click &quot;Add Metric Effect&quot; to configure hunger fulfillment, thirst quench, or health restoration.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedItem.metricEffects.map((eff, effIdx) => {
                          const metricDef = metrics.find((m) => m.id === eff.metricId) || metrics[0];
                          return (
                            <div
                              key={effIdx}
                              className="flex items-center gap-2 p-2 bg-slate-900 rounded border border-slate-800 text-xs"
                            >
                              <span className="text-slate-400 text-[11px]">Metric:</span>
                              <select
                                value={eff.metricId}
                                onChange={(e) =>
                                  handleUpdateMetricEffect(effIdx, { metricId: e.target.value })
                                }
                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                              >
                                {metrics.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>

                              <span className="text-slate-400 text-[11px]">Delta (+/-):</span>
                              <input
                                type="number"
                                value={eff.delta}
                                onChange={(e) =>
                                  handleUpdateMetricEffect(effIdx, { delta: Number(e.target.value) })
                                }
                                placeholder="+20 or -10"
                                className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono"
                              />

                              <span
                                className="text-[11px] font-mono font-semibold ml-2"
                                style={{ color: eff.delta >= 0 ? '#34d399' : '#f87171' }}
                              >
                                {eff.delta >= 0 ? `+${eff.delta}` : eff.delta} {metricDef?.name}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleDeleteMetricEffect(effIdx)}
                                className="ml-auto text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  When enabled, players can click this item in their inventory pouch to use it, triggering metric restoration or depletion.
                </p>
              )}
            </div>

            {/* Image Selection & Square Cropper */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-sky-400" />
                    Assigned Item Image & Square Edge Cropper
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Upload an image file. It will be bundled directly into this adventure file.
                  </p>
                </div>

                <label className="cursor-pointer text-xs bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {selectedItem.imageUrl ? (
                <SquareImageCropper
                  imageUrl={selectedItem.imageUrl}
                  crop={selectedItem.crop || { scale: 100, offsetX: 0, offsetY: 0 }}
                  onChange={(crop) => handleUpdateSelectedItem({ crop })}
                />
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-800 rounded-lg text-center space-y-2 bg-slate-950/40">
                  <ImageIcon className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs text-slate-400">No image assigned yet for this item.</p>
                  <p className="text-[11px] text-slate-500">
                    Click &quot;Upload Image&quot; above to select any picture. You can crop it to a square and adjust the edges.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <Package className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">Select or create an object to view and edit its properties.</p>
          </div>
        )}
      </div>
    </div>
  );
};
