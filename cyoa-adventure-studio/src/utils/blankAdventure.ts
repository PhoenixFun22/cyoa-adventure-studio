import { AdventureProject } from '../types/cyoa';

/**
 * Creates a pristine, completely blank adventure.
 * By default provides the three core metric rings specified by the user:
 * - Hunger (meat brown #92400e)
 * - Thirst (azure blue #0284c7)
 * - Health (pinkish/red #e11d48)
 * With max 100 (fully customizable).
 * Everything else (items, presets, blocks) starts completely empty.
 */
export function createBlankAdventure(title = 'Untitled Adventure', filename = 'run.py'): AdventureProject {
  const timestamp = Date.now();
  return {
    id: `adv-${timestamp}`,
    title,
    description: '',
    filename: filename.endsWith('.py') ? filename : `${filename}.py`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metrics: [
      {
        id: `metric-hunger-${timestamp}`,
        name: 'Hunger',
        color: '#92400e', // brown like cooked meat
        initialValue: 100,
        minValue: 0,
        maxValue: 100,
        triggers: [
          {
            id: `trig-hunger-zero-${timestamp}`,
            condition: 'less_than_or_equal',
            threshold: 0,
            actionType: 'notice',
            noticeText: 'Your hunger has reached zero! You are starving.',
          },
        ],
      },
      {
        id: `metric-thirst-${timestamp}`,
        name: 'Thirst',
        color: '#0284c7', // blue
        initialValue: 100,
        minValue: 0,
        maxValue: 100,
        triggers: [
          {
            id: `trig-thirst-zero-${timestamp}`,
            condition: 'less_than_or_equal',
            threshold: 0,
            actionType: 'notice',
            noticeText: 'Your thirst has reached zero! You are severely dehydrated.',
          },
        ],
      },
      {
        id: `metric-health-${timestamp}`,
        name: 'Health',
        color: '#e11d48', // pinkish / red
        initialValue: 100,
        minValue: 0,
        maxValue: 100,
        triggers: [
          {
            id: `trig-health-zero-${timestamp}`,
            condition: 'less_than_or_equal',
            threshold: 0,
            actionType: 'notice',
            noticeText: 'Your health has depleted to zero!',
          },
        ],
      },
    ],
    items: [],
    presets: [],
    blocks: [
      {
        id: `block-start-${timestamp}`,
        title: 'Prologue: The Journey Begins',
        text: 'The journey begins here. You can write your narrative here and add choices below.',
        isStart: true,
        isEnding: false,
        options: [],
      },
    ],
  };
}
