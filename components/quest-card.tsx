import React from 'react';
import { cn } from '../lib/utils';
import { Card } from './ui/card';

interface QuestCardProps {
  title: string;
  isSelected: boolean;
  className?: string;
}

const QuestCard: React.FC<QuestCardProps> = ({ title, isSelected, className }) => {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden border-amber-800/20 transition-all duration-200",
        isSelected && "ring-2 ring-amber-500",
        className
      )}
      aria-label={`${title}-quest-card`}
    >
      {/* Rest of the component content */}
    </Card>
  );
};

export default QuestCard; 