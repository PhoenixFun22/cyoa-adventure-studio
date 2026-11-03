import React, { useState } from 'react';
import { AdventureProject } from '../types/cyoa';
import {
  ADVENTURES_FOLDER,
  getSavedAdventures,
  saveAdventureToFolder,
  deleteAdventureFromFolder,
  downloadFile,
} from '../utils/adventureStorage';
import { createBlankAdventure } from '../utils/blankAdventure';
import { generatePythonScript } from '../utils/pythonExporter';
import {
  FolderOpen,
  FileCode,
  Plus,
  Trash2,
  Download,
  BookOpen,
  Package,
  Layers,
  X,
  Check,
  FilePlus2,
} from 'lucide-react';

interface AdventureManagerModalProps {
  currentAdventure: AdventureProject;
  isOpen: boolean;
  onClose: () => void;
  onSelectAdventure: (adventure: AdventureProject) => void;
}

export const AdventureManagerModal: React.FC<AdventureManagerModalProps> = ({
  currentAdventure,
  isOpen,
  onClose,
  onSelectAdventure,
}) => {
  const [adventures, setAdventures] = useState<AdventureProject[]>(getSavedAdventures());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (adv: AdventureProject) => {
    onSelectAdventure(adv);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this adventure? All its associated items, images, and narrative blocks will be removed.')) {
      const updated = deleteAdventureFromFolder(id);
      setAdventures(updated);
      setFeedbackMsg('Adventure deleted.');
      setTimeout(() => setFeedbackMsg(null), 3000);
      if (currentAdventure.id === id) {
        onSelectAdventure(updated[0]);
      }
    }
  };

  const handleCreateNewBlank = () => {
    const titlePrompt = prompt('Enter a name for the new blank adventure:', `Adventure ${adventures.length + 1}`);
    const finalTitle = titlePrompt?.trim() || `Adventure ${adventures.length + 1}`;
    const filename = `${finalTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.py`;

    const newBlank = createBlankAdventure(finalTitle, filename);
    saveAdventureToFolder(newBlank);
    const updatedList = getSavedAdventures();
    setAdventures(updatedList);
    onSelectAdventure(newBlank);
    onClose();
  };

  const handleDownloadPython = (e: React.MouseEvent, adv: AdventureProject) => {
    e.stopPropagation();
    const script = generatePythonScript(adv);
    downloadFile(script, adv.filename || 'run.py', 'text/x-python');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-950/80 border border-sky-600/40 flex items-center justify-center text-sky-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display">
                Adventures Directory ({ADVENTURES_FOLDER})
              </h3>
              <p className="text-xs text-slate-400">
                Each adventure stores its own isolated assets, images, and items.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNewBlank}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              New Blank Adventure
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className="my-2 p-2 bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs rounded flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            {feedbackMsg}
          </div>
        )}

        {/* Adventures List */}
        <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1">
          {adventures.map((adv) => {
            const isCurrentlyActive = adv.id === currentAdventure.id;
            return (
              <div
                key={adv.id}
                onClick={() => handleSelect(adv)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCurrentlyActive
                    ? 'bg-slate-800/90 border-sky-500 shadow-lg ring-1 ring-sky-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors truncate">
                      {adv.title || 'Untitled Adventure'}
                    </span>
                    {isCurrentlyActive && (
                      <span className="text-[10px] font-bold uppercase text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                        Active Workspace
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {adv.description || 'Pristine adventure file.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      {adv.blocks.length} chapters
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-slate-400" />
                      {adv.items.length} items
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      {adv.metrics.length} metrics
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <FileCode className="w-3 h-3 text-emerald-400" />
                      {adv.filename}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDownloadPython(e, adv)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                    title="Export bundled python file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.py</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, adv.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                    title="Delete adventure"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Switching adventures loads that file&apos;s specific assets and items.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
