"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  formatFn?: (val: number) => string | number;
  className?: string;
}

export function AnimatedNumber({ value, formatFn, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  
  // A snappy but lightweight spring config
  const springValue = useSpring(value, { 
    stiffness: 150, 
    damping: 20, 
    mass: 1 
  });

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      // Round to nearest integer to prevent floating point decimals showing up
      setDisplayValue(Math.round(latest));
    });
  }, [springValue]);

  const formatted = formatFn ? formatFn(displayValue) : displayValue;

  return (
    <motion.span className={className}>
      {formatted}
    </motion.span>
  );
}
