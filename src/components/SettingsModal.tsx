import React, { useState } from 'react';
import { X, Sliders, ShieldCheck, Trash2, Plus, RefreshCw, Type } from 'lucide-react';
import { FetchSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FetchSettings;
  onSaveSettings: (settings: FetchSettings) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetDefaults
}) => {
  const [localSettings, setLocalSettings] = useState<FetchSettings>(settings);
  const [newRegexInput, setNewRegexInput] = useState('');

  if (!isOpen) return null;

  const handleToggleRule = (ruleKey: keyof typeof localSettings.cleaningRules) => {
    setLocalSettings({
      ...localSettings,
      cleaningRules: {
        ...localSettings.cleaningRules,
        [ruleKey]: !localSettings.cleaningRules[ruleKey]
      }
    });
  };

  const handleAddRegex = () => {
    if (!newRegexInput.trim()) return;
    setLocalSettings({
      ...localSettings,
      cleaningRules: {
        ...localSettings.cleaningRules,
        customRegexes: [...localSettings.cleaningRules.customRegexes, newRegexInput.trim()]
      }
    });
    setNewRegexInput('');
  };

  const handleRemoveRegex = (index: number) => {
    const updated = localSettings.cleaningRules.customRegexes.filter((_, i) => i !== index);
    setLocalSettings({
      ...localSettings,
      cleaningRules: {
        ...localSettings.cleaningRules,
        customRegexes: updated
      }
    });
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Extraction & Fetch Engine Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure retry attempts, network timeout, cleaning rules & custom regex
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Section 1: Network & Retry Parameters */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Network & Protection</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Automatic Retry Count
                </label>
                <select
                  value={localSettings.retryCount}
                  onChange={(e) => setLocalSettings({ ...localSettings, retryCount: parseInt(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value={1}>1 Retry</option>
                  <option value={2}>2 Retries (Recommended)</option>
                  <option value={3}>3 Retries</option>
                  <option value={5}>5 Retries (Aggressive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Request Timeout (ms)
                </label>
                <select
                  value={localSettings.timeoutMs}
                  onChange={(e) => setLocalSettings({ ...localSettings, timeoutMs: parseInt(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value={5000}>5,000 ms (5s Fast)</option>
                  <option value={12000}>12,000 ms (12s Standard)</option>
                  <option value={20000}>20,000 ms (20s Patient)</option>
                  <option value={30000}>30,000 ms (30s Maximum)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Custom User-Agent Header
              </label>
              <input
                type="text"
                value={localSettings.userAgent}
                onChange={(e) => setLocalSettings({ ...localSettings, userAgent: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* Section 2: Powerful Cleaning Rules */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Powerful Cleaning Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.cleaningRules.removeAds}
                  onChange={() => handleToggleRule('removeAds')}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">Remove Advertisements</span>
              </label>

              <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.cleaningRules.removeNavLinks}
                  onChange={() => handleToggleRule('removeNavLinks')}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">Remove Navigation (Prev / Next)</span>
              </label>

              <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.cleaningRules.removeWatermarks}
                  onChange={() => handleToggleRule('removeWatermarks')}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">Remove Site Watermarks & Promo</span>
              </label>

              <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.cleaningRules.decodeEntities}
                  onChange={() => handleToggleRule('decodeEntities')}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">Decode HTML Entities (&nbsp;)</span>
              </label>

              <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.cleaningRules.normalizeQuotes}
                  onChange={() => handleToggleRule('normalizeQuotes')}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">Normalize Quotation Marks</span>
              </label>

              <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.cleaningRules.removeEmptyLines}
                  onChange={() => handleToggleRule('removeEmptyLines')}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">Remove Empty Lines & Breaks</span>
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* Section 3: Custom Regex Filters */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Custom Regex Noise Filters
            </h3>

            <div className="space-y-2">
              {localSettings.cleaningRules.customRegexes.map((regex, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200">
                  <span className="truncate pr-2">{regex}</span>
                  <button
                    onClick={() => handleRemoveRegex(idx)}
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={newRegexInput}
                  onChange={(e) => setNewRegexInput(e.target.value)}
                  placeholder="(?i)regex pattern to remove..."
                  className="flex-1 p-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddRegex}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Filter</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* Section 4: Typography & Chapter Header Template */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5">
              <Type className="w-4 h-4" />
              <span>Output Typography & Header Template</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chapter Text Output Font Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, fontSize: sz })}
                    className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                      localSettings.fontSize === sz
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chapter Divider Header Template
              </label>
              <textarea
                value={localSettings.chapterHeaderTemplate}
                onChange={(e) => setLocalSettings({ ...localSettings, chapterHeaderTemplate: e.target.value })}
                rows={2}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
              />
              <span className="text-[11px] text-slate-400">
                Use <code className="text-indigo-500">{'{title}'}</code> placeholder for chapter title.
              </span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
            >
              Save Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
