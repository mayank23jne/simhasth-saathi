import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ResponsiveCardProps extends React.ComponentProps<typeof Card> {
  children: React.ReactNode;
  hover?: boolean;
  interactive?: boolean;
  animated?: boolean;
  delay?: number;
  gradient?: boolean;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className,
  hover = true,
  interactive = false,
  animated = true,
  delay = 0,
  gradient = false,
  ...props
}) => {
  const cardClasses = cn(
    'transition-all duration-300',
    hover && 'hover:shadow-elegant hover:scale-[1.02] hover:-translate-y-1',
    interactive && 'cursor-pointer card-interactive focus-ring',
    gradient && 'bg-gradient-card',
    className
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay, ease: "easeOut" }}
      >
        <Card className={cardClasses} {...props}>
          {children}
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className={cardClasses} {...props}>
      {children}
    </Card>
  );
};