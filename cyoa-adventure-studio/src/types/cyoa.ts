export interface MetricTrigger {
  id: string;
  condition: 'less_than_or_equal' | 'greater_than_or_equal' | 'equals';
  threshold: number;
  actionType: 'notice' | 'goto_block' | 'ending' | 'modify_metric' | 'modify_item';
  noticeText?: string;
  targetBlockId?: string;
  metricDelta?: { metricId: string; delta: number };
}

export interface Metric {
  id: string;
  name: string;
  color: string;
  initialValue: number;
  minValue: number;
  maxValue: number;
  triggers: MetricTrigger[];
}

export interface ItemCrop {
  scale: number;    // 100 - 300%
  offsetX: number;  // -100 to 100
  offsetY: number;  // -100 to 100
}

export interface ItemMetricEffect {
  metricId: string;
  delta: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  crop: ItemCrop;
  initialQuantity: number;
  stackable: boolean;
  isUsable?: boolean;
  consumable?: boolean; // default true (item disappears when used)
  useLabel?: string; // e.g. "Use", "Eat", "Drink", "Apply"
  useMessage?: string; // custom notice on use
  metricEffects?: ItemMetricEffect[]; // give or take from any metric
}

export interface LootboxItemEntry {
  itemId: string;
  weight: number; // percentage or weight, e.g. 30 for 30%
  minCount: number;
  maxCount: number;
}

export type ActionType = 
  | 'narrative_nav'
  | 'metric_delta'
  | 'give_item'
  | 'take_item'
  | 'require_item'
  | 'lootbox'
  | 'preset_call';

export interface ActionItem {
  id: string;
  type: ActionType;
  targetBlockId?: string;
  metricId?: string;
  metricDelta?: number;
  itemId?: string;
  itemQuantity?: number;
  lootboxEntries?: LootboxItemEntry[];
  lootboxRolls?: number; // 1 or more
  presetId?: string;
  customNotice?: string;
}

export interface OptionChoice {
  id: string;
  text: string;
  actions: ActionItem[];
  grayOutOnComplete: boolean;
}

export interface NarrativeBlock {
  id: string;
  title: string;
  text: string;
  isStart?: boolean;
  isEnding?: boolean;
  endingType?: 'victory' | 'defeat' | 'neutral';
  options: OptionChoice[];
}

export interface PresetFunction {
  id: string;
  name: string;
  description: string;
  actions: ActionItem[];
}

export interface AdventureProject {
  id: string;
  title: string;
  description: string;
  filename: string;
  metrics: Metric[];
  items: Item[];
  presets: PresetFunction[];
  blocks: NarrativeBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface PlayerInventorySlot {
  itemId: string;
  quantity: number;
}

export interface PlayerState {
  currentBlockId: string;
  metrics: Record<string, number>;
  inventory: Record<string, number>;
  completedOptions: Record<string, boolean>; // optionId -> boolean
  visitedBlockIds: string[];
  history: string[];
  lastNotice: string | null;
}
