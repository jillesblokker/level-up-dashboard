import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  // Calculate total height
  const totalHeight = items.length * itemHeight;

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleRange.startIndex * itemHeight}px)`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Quest-specific virtual scroll component
interface VirtualQuestListProps {
  quests: any[];
  renderQuest: (quest: any, index: number) => React.ReactNode;
  className?: string;
  height?: number;
}

export function VirtualQuestList({
  quests,
  renderQuest,
  className,
  height = 600,
}: VirtualQuestListProps) {
  return (
    <VirtualScroll
      items={quests}
      itemHeight={120} // Approximate height of a quest card
      containerHeight={height}
      renderItem={renderQuest}
      {...(className && { className })}
      overscan={3}
    />
  );
}

// Kingdom tile virtual scroll
interface VirtualKingdomGridProps {
  tiles: any[];
  renderTile: (tile: any, index: number) => React.ReactNode;
  className?: string;
  height?: number;
}

export function VirtualKingdomGrid({
  tiles,
  renderTile,
  className,
  height = 500,
}: VirtualKingdomGridProps) {
  return (
    <VirtualScroll
      items={tiles}
      itemHeight={100} // Approximate height of a kingdom tile
      containerHeight={height}
      renderItem={renderTile}
      {...(className && { className })}
      overscan={2}
    />
  );
}
