'use client';

import { motion, useInView } from 'framer-motion';
import React from 'react';

interface FadeInViewProps {
   children: React.ReactNode;
   delay?: number;
   duration?: number;
   distance?: number;
   direction?: 'up' | 'down' | 'left' | 'right';
   className?: string;
   exit?: boolean;
}

export default function FadeInView({
   children,
   delay = 0,
   duration = 0.6,
   distance = 50,
   direction = 'up',
   className = '',
   exit = false,
}: FadeInViewProps) {
   const ref = React.useRef<HTMLDivElement | null>(null);
   const inView = useInView(ref, {
      amount: 0.1,
      once: !exit,
   });
   const initialPosition = {
      up: { x: 0, y: distance },
      down: { x: 0, y: -distance },
      left: { x: distance, y: 0 },
      right: { x: -distance, y: 0 },
   };

   const variants = {
      hidden: {
         opacity: 0,
         ...initialPosition[direction],
         scale: 0.95,
      },
      visible: {
         opacity: 1,
         x: 0,
         y: 0,
         scale: 1,
         transition: {
            duration,
            delay
         },
      },
      exit: {
         opacity: 0,
         scale: 0.95,
         transition: { duration: 0.3 },
      },
   };

   return (
      <motion.div
         ref={ref}
         initial="hidden"
         animate={inView ? 'visible' : exit ? 'exit' : 'hidden'}
         variants={variants}
         className={className}
      >
         {children}
      </motion.div>
   );
}
