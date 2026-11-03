import { AdventureProject } from '../types/cyoa';
import { createBlankAdventure } from './blankAdventure';

const STORAGE_KEY = 'cyoa_studio_adventures_v2'; // Bumped key to purge old sample adventures
const ACTIVE_ADVENTURE_ID_KEY = 'cyoa_studio_active_id_v2';

export const ADVENTURES_FOLDER = '/adventures/';

export function getSavedAdventures(): AdventureProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with a single, completely blank adventure
      const initial = [createBlankAdventure('New Adventure', 'run.py')];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const blank = [createBlankAdventure('New Adventure', 'run.py')];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blank));
    return blank;
  } catch (err) {
    console.error('Failed to load saved adventures from storage:', err);
    return [createBlankAdventure('New Adventure', 'run.py')];
  }
}

export function saveAdventureToFolder(adventure: AdventureProject): { replaced: boolean; list: AdventureProject[] } {
  const currentList = getSavedAdventures();
  const index = currentList.findIndex(
    (a) => a.id === adventure.id || (adventure.filename && a.filename.toLowerCase() === adventure.filename.toLowerCase())
  );

  const updatedAdventure: AdventureProject = {
    ...adventure,
    updatedAt: new Date().toISOString(),
  };

  let replaced = false;
  let newList: AdventureProject[];

  if (index >= 0) {
    // Delete old finished adventure and replace with edited version
    newList = [...currentList];
    newList[index] = updatedAdventure;
    replaced = true;
  } else {
    newList = [updatedAdventure, ...currentList];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    localStorage.setItem(ACTIVE_ADVENTURE_ID_KEY, updatedAdventure.id);
  } catch (err) {
    console.error('Failed to save adventure to localStorage:', err);
  }

  return { replaced, list: newList };
}

export function deleteAdventureFromFolder(adventureId: string): AdventureProject[] {
  const currentList = getSavedAdventures();
  let newList = currentList.filter((a) => a.id !== adventureId);
  if (newList.length === 0) {
    // Always keep at least one pristine blank adventure
    newList = [createBlankAdventure('New Adventure', 'run.py')];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  } catch (err) {
    console.error('Failed to update storage after deletion:', err);
  }
  return newList;
}

export function getActiveAdventureId(): string {
  const currentList = getSavedAdventures();
  const storedId = localStorage.getItem(ACTIVE_ADVENTURE_ID_KEY);
  if (storedId && currentList.some((a) => a.id === storedId)) {
    return storedId;
  }
  return currentList[0]?.id || '';
}

export function setActiveAdventureId(id: string) {
  localStorage.setItem(ACTIVE_ADVENTURE_ID_KEY, id);
}

export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
