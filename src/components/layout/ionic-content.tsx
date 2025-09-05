import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IonicContentProps {
  children: React.ReactNode;
  className?: string;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

export const IonicContent: React.FC<IonicContentProps> = ({
  children,
  className,
  enablePullToRefresh = false,
  onRefresh,
  refreshing = false
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={contentRef}
      className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden",
        "pt-14", // Account for compact header
        "bg-gradient-to-br from-saffron-light/10 via-background to-sky-blue-light/10",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key="content"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};