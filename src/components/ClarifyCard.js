"use client";

import { HelpCircle } from 'lucide-react';

export default function ClarifyCard({ options, onOptionClick }) {
  if (!options || options.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 my-3 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle size={16} className="text-orange-500" />
        <span className="text-sm font-medium text-gray-800">选一下情况，我可以给你更针对的建议：</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => onOptionClick(opt)}
            className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-medium rounded-xl border border-orange-200 active:scale-95 transition-all"
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
