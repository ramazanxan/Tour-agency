'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * Секция «Горы зовут»: пустое предрассветное небо, из которого при скролле
 * слой за слоем поднимаются горы Ала-Тоо (parallax + atmospheric perspective).
 */
export function ParallaxBand() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // Горы поднимаются снизу: задние — меньше, передние — больше (параллакс глубины)
  const yFar = useTransform(scrollYProgress, [0.08, 0.62], reduce ? ['0%', '0%'] : ['58%', '0%']);
  const yMid = useTransform(scrollYProgress, [0.12, 0.72], reduce ? ['0%', '0%'] : ['82%', '0%']);
  const yNear = useTransform(scrollYProgress, [0.16, 0.82], reduce ? ['0%', '0%'] : ['115%', '0%']);
  const yFog = useTransform(scrollYProgress, [0.2, 0.9], reduce ? ['0%', '0%'] : ['40%', '0%']);

  const opFar = useTransform(scrollYProgress, [0.05, 0.3], [0, 1]);
  const opMid = useTransform(scrollYProgress, [0.1, 0.38], [0, 1]);
  const opNear = useTransform(scrollYProgress, [0.16, 0.46], [0, 1]);

  // Звёзды гаснут с рассветом, тёплое сияние у горизонта разгорается
  const starsOp = useTransform(scrollYProgress, [0, 0.45], [0.9, 0]);
  const glowOp = useTransform(scrollYProgress, [0.1, 0.6], [0.2, 0.9]);

  const textY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['28%', '-12%']);
  const textOp = useTransform(scrollYProgress, [0.28, 0.5, 0.92, 1], [0, 1, 1, 0.5]);

  return (
    <section ref={ref} className="relative h-[230vh] bg-[#05080f]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Небо */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05080f] via-[#0c1b30] to-[#173049]" />

        {/* Звёзды */}
        <motion.div
          style={{ opacity: starsOp }}
          className="absolute inset-0 [background-image:radial-gradient(1px_1px_at_20%_30%,#fff,transparent),radial-gradient(1px_1px_at_60%_20%,#fff,transparent),radial-gradient(1px_1px_at_80%_40%,#cfe,transparent),radial-gradient(1.5px_1.5px_at_35%_15%,#fff,transparent),radial-gradient(1px_1px_at_50%_45%,#fff,transparent),radial-gradient(1px_1px_at_90%_25%,#fff,transparent),radial-gradient(1px_1px_at_10%_50%,#fff,transparent)] [background-size:100%_100%]"
        />

        {/* Тёплое сияние рассвета у горизонта */}
        <motion.div
          style={{ opacity: glowOp }}
          className="absolute inset-x-0 bottom-0 h-[55%] bg-[radial-gradient(120%_80%_at_50%_100%,rgba(252,140,60,0.55)_0%,rgba(252,90,40,0.18)_38%,transparent_70%)]"
        />

        {/* Дальний хребет (хазовый, светлый) */}
        <motion.div style={{ y: yFar, opacity: opFar, willChange: 'transform' }} className="absolute inset-x-0 bottom-0">
          <svg viewBox="0 0 1440 300" preserveAspectRatio="none" className="h-[34vh] w-full">
            <defs>
              <linearGradient id="alFar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#5b7ea6" />
                <stop offset="0.45" stopColor="#3a5a80" />
                <stop offset="1" stopColor="#24405f" />
              </linearGradient>
            </defs>
            <path fill="url(#alFar)" d="M0,300 L0,185 L160,120 L300,172 L460,92 L620,150 L780,78 L940,140 L1100,100 L1260,162 L1440,108 L1440,300 Z" />
          </svg>
        </motion.div>

        {/* Средний хребет */}
        <motion.div style={{ y: yMid, opacity: opMid, willChange: 'transform' }} className="absolute inset-x-0 bottom-0">
          <svg viewBox="0 0 1440 380" preserveAspectRatio="none" className="h-[46vh] w-full">
            <defs>
              <linearGradient id="alMid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#cdd9e8" />
                <stop offset="0.12" stopColor="#6d88aa" />
                <stop offset="0.5" stopColor="#21344c" />
                <stop offset="1" stopColor="#142536" />
              </linearGradient>
            </defs>
            <path fill="url(#alMid)" d="M0,380 L0,232 L130,128 L270,212 L420,86 L560,202 L700,66 L860,190 L1010,110 L1180,212 L1320,120 L1440,200 L1440,380 Z" />
          </svg>
        </motion.div>

        {/* Передний хребет со снежными вершинами */}
        <motion.div style={{ y: yNear, opacity: opNear, willChange: 'transform' }} className="absolute inset-x-0 bottom-0">
          <svg viewBox="0 0 1440 480" preserveAspectRatio="none" className="h-[60vh] w-full">
            <defs>
              <linearGradient id="alNear" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#eef4fb" />
                <stop offset="0.14" stopColor="#8aa6c4" />
                <stop offset="0.4" stopColor="#16273d" />
                <stop offset="1" stopColor="#0a1626" />
              </linearGradient>
            </defs>
            <path fill="url(#alNear)" d="M0,480 L0,304 L120,150 L230,292 L360,78 L500,262 L640,38 L800,252 L960,122 L1120,272 L1270,142 L1440,250 L1440,480 Z" />
          </svg>
        </motion.div>

        {/* Туман в долине */}
        <motion.div
          style={{ y: yFog, willChange: 'transform' }}
          className="absolute inset-x-0 bottom-0 h-[26vh] bg-gradient-to-t from-[#0a1626] via-[#0a1626]/70 to-transparent"
        />

        {/* Текст */}
        <motion.div style={{ y: textY, opacity: textOp }} className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.42em] text-sunset-300/90">Жол — путь, дорога</p>
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)] sm:text-6xl">
            Горы зовут.<br /> Найдите свой маршрут.
          </h2>
          <Link
            href="/tours"
            className="group mt-8 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-white/50 hover:bg-white/20"
          >
            Выбрать маршрут
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
