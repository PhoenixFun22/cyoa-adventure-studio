import React, { useState } from 'react';
import { AdventureProject } from '../types/cyoa';
import { generatePythonScript } from '../utils/pythonExporter';
import { saveAdventureToFolder, downloadFile, ADVENTURES_FOLDER } from '../utils/adventureStorage';
import {
  Download,
  Copy,
  Check,
  Terminal,
  FileCode,
  CheckCircle2,
  X,
  Code2,
} from 'lucide-react';

interface ExportModalProps {
  adventure: AdventureProject;
  isOpen: boolean;
  onClose: () => void;
  onAdventureSaved?: (updated: AdventureProject) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  adventure,
  isOpen,
  onClose,
  onAdventureSaved,
}) => {
  const [copied, setCopied] = useState(false);
  const [filenameInput, setFilenameInput] = useState(adventure.filename || 'run.py');
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const pythonScript = generatePythonScript({
    ...adventure,
    filename: filenameInput,
  });

  const handleSaveAndExportPython = () => {
    const updatedAdventure = {
      ...adventure,
      filename: filenameInput.endsWith('.py') ? filenameInput : `${filenameInput}.py`,
    };

    saveAdventureToFolder(updatedAdventure);
    if (onAdventureSaved) {
      onAdventureSaved(updatedAdventure);
    }

    downloadFile(pythonScript, updatedAdventure.filename, 'text/x-python');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(adventure, null, 2);
    downloadFile(jsonStr, `${adventure.filename.replace(/\.py$/, '')}.json`, 'application/json');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display">
                Export Standalone Adventure
              </h3>
              <p className="text-xs text-slate-400">
                Exports standalone game script with local GUI, inventory pouch, and metric rings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Adventure saved into <code className="font-mono">{ADVENTURES_FOLDER}</code> (replacing old version) and downloaded!
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-5 py-4">
          {/* Filename & Target Directory */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Target Script Filename
                </label>
                <p className="text-[11px] text-slate-400">
                  Saves into app directory folder: <span className="text-sky-400 font-mono">{ADVENTURES_FOLDER}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={filenameInput}
                  onChange={(e) => setFilenameInput(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-mono w-52 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Quick Export Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-850">
              <button
                type="button"
                onClick={handleSaveAndExportPython}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Save & Download Standalone Python GUI (.py)</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Project</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors ml-auto"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Script!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Running Instructions */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              How to Run Standalone in Command Prompt
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The exported script uses Python's standard library (<code className="font-mono text-emerald-400">tkinter</code>) and has zero pip dependencies. To launch the local GUI window:
            </p>
            <div className="bg-black/80 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 space-y-1">
              <div className="text-slate-500"># Windows Command Prompt / PowerShell:</div>
              <div className="text-emerald-400">py {filenameInput}</div>
              <div className="text-slate-500 pt-1"># macOS / Linux Terminal:</div>
              <div className="text-emerald-400">python3 {filenameInput}</div>
            </div>
          </div>

          {/* Code Preview Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowCodePreview(!showCodePreview)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showCodePreview ? 'Hide Python Source Code' : 'View Generated Python Source Code'}</span>
            </button>

            {showCodePreview && (
              <div className="mt-2 max-h-60 overflow-y-auto bg-black p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 leading-tight whitespace-pre">
                {pythonScript}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Self-contained adventure bundle · Ready for standalone execution</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
