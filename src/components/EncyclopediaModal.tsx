import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  ADDICTIVE_LIST,
  HARMFUL_ADDITIVE_LIST,
  SAFE_SUBSTANCE_LIST,
} from '../data/substances';
import { SubstanceEntry } from '../types/game';

interface EncyclopediaModalProps {
  onClose: () => void;
}

type FilterTab = 'all' | 'safe' | 'harmful' | 'addictive';

export const EncyclopediaModal: React.FC<EncyclopediaModalProps> = ({ onClose }) => {
  const [filter, setFilter] = useState<FilterTab>('all');

  const items: SubstanceEntry[] =
    filter === 'safe'
      ? SAFE_SUBSTANCE_LIST
      : filter === 'harmful'
      ? HARMFUL_ADDITIVE_LIST
      : filter === 'addictive'
      ? ADDICTIVE_LIST
      : [...SAFE_SUBSTANCE_LIST, ...HARMFUL_ADDITIVE_LIST, ...ADDICTIVE_LIST];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Pustaka Zat Aditif &amp; Zat Adiktif</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kenali zat aman yang memberi poin dan zat berbahaya yang harus dihindari atau dilawan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup Pustaka Zat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Filter Tabs */}
        <div className="px-6 py-3 border-b border-slate-800 flex flex-wrap gap-2 bg-slate-950/40">
          {(
            [
              { id: 'all', label: 'Semua Zat' },
              { id: 'safe', label: 'Zat Aman (Kumpulkan)' },
              { id: 'harmful', label: 'Aditif Berbahaya (Hindari)' },
              { id: 'addictive', label: 'Zat Adiktif & Bos (Lawan)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filter === tab.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((sub) => (
            <div
              key={sub.id}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">
                    {sub.role} ·{' '}
                    <span className={sub.isSafe ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {sub.isSafe ? 'Aman (+Poin)' : 'Berbahaya (Hindari)'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{sub.name}</h3>
                </div>
                <div
                  className="w-4 h-4 rounded-full shrink-0 mt-1 border border-white/20"
                  style={{ backgroundColor: sub.color }}
                  aria-hidden="true"
                />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{sub.description}</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-200">Dampak:</strong> {sub.impact}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
