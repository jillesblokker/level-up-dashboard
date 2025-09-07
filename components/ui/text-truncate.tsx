import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TextTruncateProps {
  text: string;
  maxLength?: number;
  className?: string;
  showTooltip?: boolean;
  tooltipContent?: string;
  children?: React.ReactNode;
}

export function TextTruncate({
  text,
  maxLength = 50,
  className,
  showTooltip = true,
  tooltipContent,
  children,
}: TextTruncateProps) {
  const truncatedText = text.length > maxLength 
    ? text.substring(0, maxLength) + '...' 
    : text;

  const shouldShowTooltip = showTooltip && (text.length > maxLength || tooltipContent);

  if (shouldShowTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('cursor-help', className)}>
            {children || truncatedText}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs break-words">
            {tooltipContent || text}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <span className={className}>
      {children || truncatedText}
    </span>
  );
}

interface ButtonTextTruncateProps {
  text: string;
  maxLength?: number;
  className?: string;
  showTooltip?: boolean;
}

export function ButtonTextTruncate({
  text,
  maxLength = 20,
  className,
  showTooltip = true,
}: ButtonTextTruncateProps) {
  return (
    <TextTruncate
      text={text}
      maxLength={maxLength}
      className={cn('block truncate', className)}
      showTooltip={showTooltip}
    />
  );
}

interface CardTitleTruncateProps {
  title: string;
  maxLength?: number;
  className?: string;
  showTooltip?: boolean;
}

export function CardTitleTruncate({
  title,
  maxLength = 30,
  className,
  showTooltip = true,
}: CardTitleTruncateProps) {
  return (
    <TextTruncate
      text={title}
      maxLength={maxLength}
      className={cn('font-semibold', className)}
      showTooltip={showTooltip}
    />
  );
}

interface QuestNameTruncateProps {
  name: string;
  maxLength?: number;
  className?: string;
  showTooltip?: boolean;
}

export function QuestNameTruncate({
  name,
  maxLength = 25,
  className,
  showTooltip = true,
}: QuestNameTruncateProps) {
  return (
    <TextTruncate
      text={name}
      maxLength={maxLength}
      className={cn('text-sm font-medium', className)}
      showTooltip={showTooltip}
    />
  );
}
