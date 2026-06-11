import React from 'react';
import * as Icons from 'lucide-react';

export interface PageRange {
  id: string;
  from: number;
  to: number;
}

interface RangeInputEditorProps {
  ranges: PageRange[];
  onChange: (ranges: PageRange[]) => void;
  maxPages?: number;
}

export const RangeInputEditor: React.FC<RangeInputEditorProps> = ({ ranges, onChange, maxPages }) => {
  const handleUpdate = (id: string, field: 'from' | 'to', value: number) => {
    let val = Math.max(1, value);
    if (maxPages) val = Math.min(val, maxPages);

    const updated = ranges.map(r => {
      if (r.id === id) {
        const newRange = { ...r, [field]: val };
        // Auto-fix inversions smoothly
        if (field === 'from' && val > r.to) newRange.to = val;
        if (field === 'to' && val < r.from) newRange.from = val;
        return newRange;
      }
      return r;
    });
    onChange(updated);
  };

  const handleAdd = () => {
    const lastRange = ranges[ranges.length - 1];
    let nextFrom = lastRange ? lastRange.to + 1 : 1;
    let nextTo = nextFrom;
    
    if (maxPages) {
      if (nextFrom > maxPages) nextFrom = maxPages;
      if (nextTo > maxPages) nextTo = maxPages;
    }
    
    onChange([...ranges, { id: Date.now().toString(), from: nextFrom, to: nextTo }]);
  };

  const handleRemove = (id: string) => {
    if (ranges.length <= 1) return;
    onChange(ranges.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {ranges.map((range, index) => (
          <div key={range.id} className="flex items-center gap-2">
            <div className="flex flex-col items-center justify-center">
              <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-bold tracking-wider writing-vertical-lr mb-1 hidden sm:block">
                Range {index + 1}
              </span>
            </div>
            
            <div className="flex-1 flex flex-wrap items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 px-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">from page</span>
                <input
                  type="number"
                  min={1}
                  max={maxPages}
                  value={range.from || ''}
                  onChange={(e) => handleUpdate(range.id, 'from', parseInt(e.target.value) || 1)}
                  className="w-16 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 text-xs font-bold text-center outline-none text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 dark:focus:ring-zinc-700"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">to</span>
                <input
                  type="number"
                  min={range.from}
                  max={maxPages}
                  value={range.to || ''}
                  onChange={(e) => handleUpdate(range.id, 'to', parseInt(e.target.value) || range.from)}
                  className="w-16 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 text-xs font-bold text-center outline-none text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 dark:focus:ring-zinc-700"
                />
              </div>
            </div>

            <button
              onClick={() => handleRemove(range.id)}
              disabled={ranges.length <= 1}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                ranges.length <= 1 
                  ? 'opacity-30 cursor-not-allowed text-zinc-400' 
                  : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer'
              }`}
            >
              <Icons.X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      <button
        onClick={handleAdd}
        className="flex items-center justify-center gap-2 w-full text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400 dark:hover:border-indigo-400 py-2.5 px-3 rounded-xl hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
      >
        <Icons.Plus className="w-4 h-4" />
        Add Range
      </button>
    </div>
  );
};
