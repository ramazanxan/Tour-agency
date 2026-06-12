'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { ProgramDay } from '@/lib/types';

export function ProgramAccordion({ program }: { program: ProgramDay[] }) {
  const [open, setOpen] = useState<number>(program[0]?.day ?? 0);

  return (
    <div className="relative space-y-2.5">
      {program.map((p, i) => {
        const isOpen = open === p.day;
        const last = i === program.length - 1;
        return (
          <div
            key={p.day}
            className={`overflow-hidden rounded-2xl border transition-colors ${
              isOpen ? 'border-slate-300 bg-white shadow-sm' : 'border-slate-200/70 bg-white'
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? -1 : p.day)}
              className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/60"
            >
              <span className="relative flex flex-col items-center">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                    isOpen ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p.day}
                </span>
              </span>
              <span className="flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  День {p.day}{last ? ' · финал' : ''}
                </span>
                <span className="block font-semibold tracking-tight text-slate-900">{p.title}</span>
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="px-4 pb-4 pl-[4.4rem] text-sm leading-relaxed text-slate-600">
                    {p.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
