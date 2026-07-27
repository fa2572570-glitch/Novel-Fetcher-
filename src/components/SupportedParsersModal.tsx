import React from 'react';
import { X, Globe, CheckCircle2, Shield, PlusCircle } from 'lucide-react';
import { ParserInfo } from '../types';

interface SupportedParsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsers: ParserInfo[];
}

export const SupportedParsersModal: React.FC<SupportedParsersModalProps> = ({
  isOpen,
  onClose,
  parsers
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Supported Novel Websites & Parsers
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modular parser engine dynamically matches domain signatures
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
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          
          <div className="p-3.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 space-y-1">
            <p className="font-semibold flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-sky-500" />
              <span>Extensible Modular Architecture</span>
            </p>
            <p>
              Every novel site uses its own dedicated parser module (e.g. <code>69shuba.ts</code>, <code>RoyalRoad.ts</code>, <code>NovelBin.ts</code>). If a domain is not explicitly registered, our <strong>Generic Extractor</strong> automatically analyzes DOM density to extract clean novel chapters!
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {parsers.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-sky-400 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{p.name}</span>
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    ID: {p.id}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {p.description}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">Domains:</span>
                  {p.domains.map((dom, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60"
                    >
                      {dom}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center space-x-1.5">
              <PlusCircle className="w-4 h-4 text-indigo-500" />
              <span>Adding a New Site Parser</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Adding support for a new website requires creating only one TypeScript parser module in <code>/src/parsers/</code> implementing the <code>NovelParser</code> interface.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
