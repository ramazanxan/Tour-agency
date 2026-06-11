'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Параллакс-полоса: фон, средний и передний слои движутся с разной скоростью
 * при скролле — глубина «гор», как на award-сайтах.
 */
export function ParallaxBand() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const yBack = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '-12%']);
  const yMid = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '-26%']);
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '40%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);

  return (
    <section ref={ref} className="relative h-[80vh] min-h-[460px] overflow-hidden bg-lake-950">
      <motion.div style={{ y: yBack, scale }} className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1454942901704-3c44c11b2ad1?auto=format&fit=crop&w=1600&q=80"
          alt="Горы Кыргызстана"
          fill
          sizes="100vw"
          className="object-cover opacity-80"
        />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-lake-950/40 via-lake-900/30 to-lake-950/80" />

      <motion.div
        style={{ y: yMid }}
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-lake-950 to-transparent"
      />

      <motion.div style={{ y: yText }} className="relative flex h-full items-center justify-center px-6 text-center">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sunset-300">Жол — путь, дорога</p>
          <h2 className="mt-4 text-balance text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            Горы зовут.<br /> Найдите свой маршрут.
          </h2>
        </div>
      </motion.div>
    </section>
  );
}
