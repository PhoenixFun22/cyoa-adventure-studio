import React, { useState, useEffect } from 'react';
import { AdventureProject } from './types/cyoa';
import { createBlankAdventure } from './utils/blankAdventure';
import {
  getSavedAdventures,
  saveAdventureToFolder,
  getActiveAdventureId,
  setActiveAdventureId,
  ADVENTURES_FOLDER,
} from './utils/adventureStorage';
import { MetricManager } from './components/MetricManager';
import { ItemManager } from './components/ItemManager';
import { NarrativeEditor } from './components/NarrativeEditor';
import { PresetManager } from './components/PresetManager';
import { PlayerView } from './components/PlayerView';
import { AdventureManagerModal } from './components/AdventureManagerModal';
import { ExportModal } from './components/ExportModal';
import {
  BookOpen,
  Layers,
  Package,
  Zap,
  Play,
  Download,
  FolderOpen,
  Sparkles,
  Save,
  Check,
} from 'lucide-react';

type ActiveTab = 'narrative' | 'metrics' | 'items' | 'presets' | 'play';

export default function App() {
  const [adventure, setAdventure] = useState<AdventureProject>(() => {
    const list = getSavedAdventures();
    const activeId = getActiveAdventureId();
    const found = list.find((a) => a.id === activeId);
    return found || list[0] || createBlankAdventure('New Adventure', 'run.py');
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('narrative');
  const [isAdventuresModalOpen, setIsAdventuresModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [autoSavedNotice, setAutoSavedNotice] = useState(false);

  // Synchronize active ID
  useEffect(() => {
    setActiveAdventureId(adventure.id);
  }, [adventure.id]);

  // Handle updates to the current adventure
  const handleUpdateAdventure = (updates: Partial<AdventureProject>) => {
    setAdventure((prev) => {
      const next = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      saveAdventureToFolder(next);
      return next;
    });
    setAutoSavedNotice(true);
    setTimeout(() => setAutoSavedNotice(false), 2000);
  };

  const handleSelectAdventureFromFolder = (selected: AdventureProject) => {
    setAdventure(selected);
    setActiveAdventureId(selected.id);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Top Bar following Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (Nav links) - Zone 3 (Action) */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-[#0c121e]/90 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/"
            className="text-base font-bold tracking-tight text-slate-100 font-display whitespace-nowrap"
          >
            CYOA Adventure Studio
          </a>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-xs text-sky-400 font-medium truncate max-w-[200px] hidden sm:inline" title={adventure.title}>
            {adventure.title}
          </span>
        </div>

        {/* Zone 2: Navigation link controls */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('narrative')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'narrative'
                ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Story Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'metrics'
                ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Metric Rings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'items'
                ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventory Items</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'presets'
                ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Presets & Lootbox</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('play')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'play'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Play / Test Game</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAdventuresModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-750 rounded-lg transition-colors whitespace-nowrap"
            title="Browse and edit saved adventures in /adventures/ folder"
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Adventures</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            title="Export standalone Python script with local GUI"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export (.py)</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'play' ? (
          <PlayerView
            adventure={adventure}
            onExitPreview={() => setActiveTab('narrative')}
          />
        ) : (
          <div className="max-w-7xl w-full mx-auto p-4 flex-1 flex flex-col">
            {/* Context Sub-bar */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  Editing Project: <strong className="text-slate-200">{adventure.title}</strong>
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 font-mono">
                  {ADVENTURES_FOLDER}{adventure.filename}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {autoSavedNotice && (
                  <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-medium animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    Saved to {ADVENTURES_FOLDER}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    saveAdventureToFolder(adventure);
                    setAutoSavedNotice(true);
                    setTimeout(() => setAutoSavedNotice(false), 2000);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-xs transition-colors"
                >
                  <Save className="w-3 h-3 text-sky-400" />
                  Save
                </button>
              </div>
            </div>

            {/* Tab Views */}
            {activeTab === 'narrative' && (
              <NarrativeEditor
                blocks={adventure.blocks}
                metrics={adventure.metrics}
                items={adventure.items}
                presets={adventure.presets}
                onChange={(blocks) => handleUpdateAdventure({ blocks })}
              />
            )}

            {activeTab === 'metrics' && (
              <MetricManager
                metrics={adventure.metrics}
                blocks={adventure.blocks}
                onChange={(metrics) => handleUpdateAdventure({ metrics })}
              />
            )}

            {activeTab === 'items' && (
              <ItemManager
                items={adventure.items}
                metrics={adventure.metrics}
                onChange={(items) => handleUpdateAdventure({ items })}
              />
            )}

            {activeTab === 'presets' && (
              <PresetManager
                presets={adventure.presets}
                items={adventure.items}
                metrics={adventure.metrics}
                blocks={adventure.blocks}
                onChange={(presets) => handleUpdateAdventure({ presets })}
              />
            )}
          </div>
        )}
      </main>

      {/* In-App Adventures Folder Selector Modal */}
      <AdventureManagerModal
        currentAdventure={adventure}
        isOpen={isAdventuresModalOpen}
        onClose={() => setIsAdventuresModalOpen(false)}
        onSelectAdventure={handleSelectAdventureFromFolder}
      />

      {/* Export Standalone Script Modal */}
      <ExportModal
        adventure={adventure}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onAdventureSaved={(updated) => setAdventure(updated)}
      />
    </div>
  );
}
