import { cn } from '@/lib/utils';

/**
 * Шкала набора группы «5/8 мест» с заполняющейся анимацией.
 * Социальный триггер из ТЗ (раздел 4.2).
 */
export function GroupProgress({
  taken,
  total,
  min,
  className,
}: {
  taken: number;
  total: number;
  min: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((taken / total) * 100));
  const left = total - taken;
  const guaranteed = taken >= min;

  let barColor = 'bg-lake-500';
  if (pct >= 90) barColor = 'bg-rose-500';
  else if (pct >= 60) barColor = 'bg-amber-500';
  else if (guaranteed) barColor = 'bg-emerald-500';

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">
          Записались: {taken} из {total}
        </span>
        <span className={cn('font-semibold', left <= 3 ? 'text-rose-600' : 'text-slate-500')}>
          {left <= 0 ? 'Мест нет' : `Осталось ${left}`}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full animate-fill-up', barColor)}
          style={{ ['--fill-target' as string]: `${pct}%`, width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {guaranteed
          ? '✅ Выезд гарантирован — группа набрана'
          : `Выезд состоится при наборе ${min} человек`}
      </p>
    </div>
  );
}
