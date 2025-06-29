import React from 'react';
import { cn } from '../lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface UnifiedCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  completed: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  progress?: number; // 0-100
  xp?: number;
  gold?: number;
  className?: string;
  children?: React.ReactNode;
}

const CardWithProgress: React.FC<UnifiedCardProps> = ({
  title,
  description,
  icon,
  completed,
  onToggle,
  onEdit,
  onDelete,
  progress = 5,
  xp,
  gold,
  className,
  children,
}) => {
  return (
    <Card
      className={cn(
        'flex flex-col border-2 border-amber-800/20 bg-black/30 shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500',
        completed ? 'bg-green-900/30' : '',
        className
      )}
      tabIndex={0}
      role="button"
      aria-label={`${title}-card`}
      aria-pressed={completed}
      onClick={onToggle}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="rounded-full p-2 bg-black/40 border border-amber-800">{icon}</span>}
          <CardTitle className="text-lg font-semibold text-amber-300">{title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-gray-500 hover:text-amber-500"
              aria-label={`edit-${title}-card`}
              onClick={e => { e.stopPropagation(); onEdit(); }}
              tabIndex={-1}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          <Checkbox
            checked={completed}
            onCheckedChange={onToggle}
            aria-label={`Mark ${title} as ${completed ? 'incomplete' : 'complete'}`}
            className="h-5 w-5 border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500 mt-1"
            tabIndex={-1}
            onClick={e => e.stopPropagation()}
          />
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-red-500"
              onClick={e => { e.stopPropagation(); onDelete(); }}
              aria-label={`Delete ${title} card`}
              tabIndex={-1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {description && <CardDescription className="mb-4 text-gray-400">{description}</CardDescription>}
        <Progress value={completed ? 100 : progress} className="w-full h-2 bg-gray-700" />
        {children}
      </CardContent>
      {(xp !== undefined || gold !== undefined) && (
        <CardFooter className="flex justify-between items-center text-xs text-gray-500 pt-2">
          <div className="flex items-center gap-2">
            {xp !== undefined && <span>XP: {xp}</span>}
            {gold !== undefined && <span>Gold: {gold}</span>}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default CardWithProgress; 