"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  PenTool, 
  Sparkles, 
  BookOpen, 
  Smile, 
  Laugh, 
  Meh, 
  Frown, 
  PartyPopper 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReflectionEntry {
  id: string;
  content: string;
  mood_score?: number;
  mood_tag?: string;
  entry_date: string; // "YYYY-MM-DD"
  created_at?: string;
}

interface ReflectionsBookcaseProps {
  entries: ReflectionEntry[];
  onSelectEntry: (entry: ReflectionEntry) => void;
  onCreateEntry: () => void;
}

// 7 Curated vintage leather book spine styles matching the reference image
const BOOK_STYLES = [
  {
    id: 'emerald-gold',
    bg: 'from-emerald-800 via-emerald-700 to-emerald-950',
    border: 'border-emerald-600/50',
    accentLine: 'border-amber-400/60',
    foilText: 'text-amber-200',
    motif: '✦',
    pattern: 'diamond'
  },
  {
    id: 'ruby-stitch',
    bg: 'from-red-800 via-red-700 to-red-950',
    border: 'border-red-600/50',
    accentLine: 'border-amber-400/70 border-dashed',
    foilText: 'text-amber-100',
    motif: '❖',
    pattern: 'stitch'
  },
  {
    id: 'sapphire-rhombus',
    bg: 'from-sky-800 via-blue-700 to-blue-950',
    border: 'border-blue-500/50',
    accentLine: 'border-cyan-300/60',
    foilText: 'text-cyan-100',
    motif: '◈',
    pattern: 'rhombus'
  },
  {
    id: 'amber-ochre',
    bg: 'from-amber-700 via-amber-600 to-amber-950',
    border: 'border-amber-500/50',
    accentLine: 'border-yellow-300/80',
    foilText: 'text-amber-100',
    motif: '⚜',
    pattern: 'grid'
  },
  {
    id: 'burgundy-border',
    bg: 'from-rose-900 via-rose-800 to-stone-950',
    border: 'border-rose-700/50',
    accentLine: 'border-amber-300/60',
    foilText: 'text-amber-200',
    motif: '✷',
    pattern: 'concentric'
  },
  {
    id: 'olive-filigree',
    bg: 'from-lime-900 via-emerald-800 to-zinc-950',
    border: 'border-lime-600/50',
    accentLine: 'border-amber-400/60',
    foilText: 'text-amber-200',
    motif: '✿',
    pattern: 'floral'
  },
  {
    id: 'chestnut-rings',
    bg: 'from-amber-900 via-stone-800 to-zinc-950',
    border: 'border-amber-700/50',
    accentLine: 'border-amber-400/60',
    foilText: 'text-amber-200',
    motif: '❂',
    pattern: 'rings'
  }
];

// Slight organic height variations for authentic bookcase feel
const HEIGHT_VARIANTS = ['h-[138px]', 'h-[148px]', 'h-[156px]', 'h-[144px]', 'h-[152px]', 'h-[160px]'];

export function ReflectionsBookcase({ entries, onSelectEntry, onCreateEntry }: ReflectionsBookcaseProps) {
  // Current active month view (defaulting to current real-world month)
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(() => new Date());
  const [hoveredEntry, setHoveredEntry] = useState<ReflectionEntry | null>(null);

  const currentYear = selectedMonthDate.getFullYear();
  const currentMonth = selectedMonthDate.getMonth(); // 0-indexed

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthName = selectedMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isCurrentCalendarMonth = 
    new Date().getFullYear() === currentYear && new Date().getMonth() === currentMonth;

  // Filter and sort entries for active month (ascending order: Day 1 -> Day 31)
  const monthEntries = useMemo(() => {
    return entries
      .filter(e => e.entry_date && e.entry_date.startsWith(monthKey))
      .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
  }, [entries, monthKey]);

  // Navigate months
  const handlePrevMonth = () => {
    setSelectedMonthDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonthDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setSelectedMonthDate(new Date());
  };

  const getMoodIcon = (score?: number) => {
    switch (score) {
      case 1: return <Frown className="w-3 h-3 text-zinc-400" />;
      case 2: return <Meh className="w-3 h-3 text-zinc-300" />;
      case 3: return <Smile className="w-3 h-3 text-amber-200" />;
      case 4: return <Laugh className="w-3 h-3 text-amber-300" />;
      case 5: return <PartyPopper className="w-3 h-3 text-amber-400" />;
      default: return null;
    }
  };

  // Helper to format sideways date (e.g. "14 Sep" or "4 Oct")
  const formatSpineDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Divide entries into rows
  // Desktop: 3 rows (approx ~10-11 books per shelf)
  // Mobile: 6 rows (approx ~5-6 books per shelf)
  const chunkRows = (items: (ReflectionEntry | 'scribe_button')[], numRows: number) => {
    const rows: (ReflectionEntry | 'scribe_button')[][] = Array.from({ length: numRows }, () => []);
    const itemsPerRow = Math.max(1, Math.ceil(items.length / numRows));

    items.forEach((item, index) => {
      const rowIndex = Math.min(numRows - 1, Math.floor(index / itemsPerRow));
      rows[rowIndex]!.push(item);
    });

    return rows;
  };

  // Book list including the "+ Scribe" action book
  const allShelfItems: (ReflectionEntry | 'scribe_button')[] = [...monthEntries, 'scribe_button'];

  const desktopRows = useMemo(() => chunkRows(allShelfItems, 3), [allShelfItems]);
  const mobileRows = useMemo(() => chunkRows(allShelfItems, 6), [allShelfItems]);

  // Render an individual book spine
  const renderBookSpine = (item: ReflectionEntry | 'scribe_button', index: number) => {
    if (item === 'scribe_button') {
      return (
        <button
          key="scribe_action_book"
          onClick={onCreateEntry}
          className="group relative flex flex-col items-center justify-between w-[44px] sm:w-[48px] h-[142px] sm:h-[150px] rounded-t-md rounded-b-sm border-2 border-dashed border-amber-500/40 bg-zinc-950/60 hover:bg-amber-950/40 hover:border-amber-400 transition-all duration-200 hover:-translate-y-2 cursor-pointer shadow-md shadow-black/60 shrink-0 select-none p-1.5"
          title="Scribe a new reflection"
        >
          <div className="w-full flex items-center justify-center pt-1 text-amber-400 group-hover:scale-110 transition-transform">
            <PenTool className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-serif font-bold text-amber-400/90 tracking-widest [writing-mode:vertical-rl] rotate-180 uppercase">
            + Scribe
          </span>
          <div className="w-full h-1 bg-amber-500/30 rounded-full" />
        </button>
      );
    }

    const entry = item;
    const styleIndex = (parseInt(entry.entry_date.replace(/-/g, ''), 10) + index) % BOOK_STYLES.length;
    const style = BOOK_STYLES[styleIndex]!;
    const heightClass = HEIGHT_VARIANTS[index % HEIGHT_VARIANTS.length];

    return (
      <div
        key={entry.id}
        onClick={() => onSelectEntry(entry)}
        onMouseEnter={() => setHoveredEntry(entry)}
        onMouseLeave={() => setHoveredEntry(null)}
        className={cn(
          "group relative flex flex-col items-center justify-between w-[44px] sm:w-[48px] rounded-t-md rounded-b-sm border transition-all duration-300 hover:-translate-y-2.5 cursor-pointer shadow-lg shadow-black/80 shrink-0 select-none p-1.5 bg-gradient-to-r",
          style.bg,
          style.border,
          heightClass,
          "hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:border-amber-300 z-10"
        )}
      >
        {/* Embossed Leather Spine Texture Overlay (Vertical Highlights) */}
        <div className="absolute inset-0 rounded-t-md rounded-b-sm bg-gradient-to-r from-black/40 via-white/10 to-black/50 pointer-events-none" />

        {/* Top Gold Foil Band & Sigil */}
        <div className="relative z-10 w-full flex flex-col items-center gap-0.5 pt-0.5">
          <div className={cn("w-full h-[2px] border-t", style.accentLine)} />
          <span className="text-[8px] text-amber-300/80 leading-none">{style.motif}</span>
        </div>

        {/* Vertical Sideways Date Typography */}
        <div className="relative z-10 my-auto flex items-center justify-center">
          <span className={cn(
            "text-[10px] sm:text-[11px] font-serif font-bold tracking-wider [writing-mode:vertical-rl] rotate-180 whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]",
            style.foilText
          )}>
            {formatSpineDate(entry.entry_date)}
          </span>
        </div>

        {/* Bottom Gold Foil Band & Mood Ribbon */}
        <div className="relative z-10 w-full flex flex-col items-center gap-0.5 pb-0.5">
          <div className="flex items-center justify-center">
            {getMoodIcon(entry.mood_score)}
          </div>
          <div className={cn("w-full h-[2px] border-b", style.accentLine)} />
        </div>

        {/* Subtle Silk Ribbon Marker hanging under spine */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2.5 bg-amber-400 rounded-b-sm shadow-sm pointer-events-none opacity-80" />
      </div>
    );
  };

  // Render a wooden shelf plank
  const renderShelfRow = (items: (ReflectionEntry | 'scribe_button')[], rowIndex: number) => {
    return (
      <div key={`shelf_row_${rowIndex}`} className="relative flex flex-col items-start w-full">
        {/* Books Standing on Shelf */}
        <div className="flex items-end justify-start gap-1.5 sm:gap-2.5 px-3 sm:px-6 w-full min-h-[165px] sm:min-h-[170px] overflow-x-auto overflow-y-hidden pb-0.5">
          {items.map((item, itemIdx) => renderBookSpine(item, rowIndex * 6 + itemIdx))}

          {/* If row is empty, display subtle empty shelf indicator */}
          {items.length === 0 && (
            <div className="h-[140px] flex items-center justify-center w-full text-zinc-600/40 text-xs italic font-serif select-none">
              Tier {rowIndex + 1} empty
            </div>
          )}
        </div>

        {/* Realistic Dark Oak Wooden Shelf Plank */}
        <div className="relative w-full h-4 sm:h-5 bg-gradient-to-r from-[#2c180e] via-[#4a2e1b] to-[#2c180e] border-t-2 border-[#6b4423] border-b border-[#180e08] shadow-[0_8px_15px_rgba(0,0,0,0.9)] flex items-center justify-between px-4">
          <span className="text-[9px] font-serif text-amber-500/40 tracking-widest uppercase select-none">
            Shelf {rowIndex + 1}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-600/40 border border-amber-950 shadow-inner" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Shelf Header & Monthly Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950/80 p-3 sm:p-4 rounded-2xl border border-amber-900/40 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
              <span>{monthName}</span>
              {isCurrentCalendarMonth && (
                <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400 bg-emerald-950/40 uppercase font-mono">
                  Current month
                </Badge>
              )}
            </h3>
            <p className="text-xs text-zinc-400">
              {monthEntries.length} {monthEntries.length === 1 ? 'reflection volume' : 'reflection volumes'} in the royal library
            </p>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {!isCurrentCalendarMonth && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="h-8 text-xs text-amber-400 hover:text-amber-200 hover:bg-amber-950/40 rounded-lg px-2.5"
            >
              Today
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="h-8 w-8 p-0 border-amber-900/60 bg-zinc-900 text-amber-300 hover:bg-amber-950/40 rounded-lg"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="h-8 w-8 p-0 border-amber-900/60 bg-zinc-900 text-amber-300 hover:bg-amber-950/40 rounded-lg"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Floating Hover Preview Card if user hovers over a book */}
      {hoveredEntry && (
        <div className="bg-gradient-to-r from-amber-950/90 via-zinc-950 to-zinc-950 border border-amber-500/50 rounded-xl p-3 shadow-xl animate-in fade-in duration-150 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-zinc-900 border border-amber-500/30 text-amber-300 shrink-0">
            {getMoodIcon(hoveredEntry.mood_score) || <BookOpen className="w-4 h-4" />}
          </div>
          <div className="space-y-1 flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-serif font-bold text-amber-300">
                {new Date(hoveredEntry.entry_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {hoveredEntry.mood_tag && (
                <Badge className="bg-amber-950/80 border-amber-500/30 text-amber-300 text-[9px] font-mono">
                  {hoveredEntry.mood_tag}
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-300 italic font-serif line-clamp-2 leading-relaxed">
              &ldquo;{hoveredEntry.content}&rdquo;
            </p>
          </div>
          <span className="text-[10px] text-amber-400 font-bold shrink-0 self-center">Click to open ↗</span>
        </div>
      )}

      {/* The Majestic Bookcase Cabinet */}
      <div className="relative rounded-2xl border-4 border-[#3a2012] bg-[#0c0805] shadow-2xl overflow-hidden p-2 sm:p-4">
        {/* Subtle woodgrain backdrop gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* DESKTOP VIEW: 3 Grand Shelf Tiers */}
        <div className="hidden sm:flex sm:flex-col gap-6 relative z-10 py-2">
          {desktopRows.map((row, idx) => renderShelfRow(row, idx))}
        </div>

        {/* MOBILE VIEW: 6 Cozy Shelf Tiers (5-6 books per shelf, thumb-friendly width) */}
        <div className="flex sm:hidden flex-col gap-4 relative z-10 py-1">
          {mobileRows.map((row, idx) => renderShelfRow(row, idx))}
        </div>
      </div>
    </div>
  );
}
