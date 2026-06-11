'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ProgramDay } from '@/lib/types';

export function ProgramAccordion({ program }: { program: ProgramDay[] }) {
  const [open, setOpen] = useState<number>(program[0]?.day ?? 0);

  return (
    <div className="space-y-2">
      {program.map((p) => {
        const isOpen = open === p.day;
        return (
          <div key={p.day} className="overflow-hidden rounded-xl border border-slate-100">
            <button
              onClick={() => setOpen(isOpen ? -1 : p.day)}
              className="flex w-full items-center gap-3 bg-white px-4 py-3 text-left hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lake-100 text-sm font-bold text-lake-700">
                {p.day}
              </span>
              <span className="flex-1 font-semibold text-slate-800">{p.title}</span>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 px-4 py-3 pl-15 text-sm text-slate-600">
                {p.description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
