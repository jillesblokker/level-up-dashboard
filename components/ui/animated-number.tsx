"use client";

import { useEffect, useState, useRef } from "react";
import { motion, animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  formatFn?: (val: number) => string | number;
  className?: string;
  title?: string;
}

export function AnimatedNumber({ value, formatFn, className, title }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current === value) {
      setDisplayValue(value);
      return;
    }

    const controls = animate(prevValueRef.current, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) {
        setDisplayValue(Math.round(v));
      }
    });
    
    prevValueRef.current = value;
    return () => controls.stop();
  }, [value]);

  const formatted = formatFn ? formatFn(displayValue) : displayValue;

  return (
    <motion.span className={className} title={title}>
      {formatted}
    </motion.span>
  );
}
