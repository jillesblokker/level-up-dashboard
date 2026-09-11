"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Download, FileText, Table, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { exportChronicleToMarkdown, exportHabitsToCsv } from '@/lib/data-export-service';

export function DataExportCard() {
  const { toast } = useToast();
  const [isExportingMd, setIsExportingMd] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const handleExportMarkdown = async () => {
    setIsExportingMd(true);
    try {
      const success = await exportChronicleToMarkdown();
      if (success) {
        toast({
          title: "Chronicle exported! 📜",
          description: "Downloaded your journal reflections as a clean Markdown archive (.md).",
        });
      } else {
        toast({
          title: "Export notice",
          description: "Could not compile chronicle archive.",
          variant: "destructive"
        });
      }
    } finally {
      setIsExportingMd(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const success = await exportHabitsToCsv();
      if (success) {
        toast({
          title: "Habits exported! 📊",
          description: "Downloaded your habits & streak records as a spreadsheet-ready CSV (.csv).",
        });
      } else {
        toast({
          title: "Export notice",
          description: "Could not compile habits CSV.",
          variant: "destructive"
        });
      }
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <Card className="border border-amber-500/30 bg-zinc-950/90 shadow-xl overflow-hidden font-serif">
      <CardHeader className="pb-3 border-b border-amber-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-serif font-bold text-amber-200">
                Data sovereignty & archives
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                You own your life data. One-click export your personal history without walled gardens.
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-emerald-950 border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
            Zero lock-in
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Markdown Diary Export */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-amber-900/30 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <FileText className="w-4 h-4 text-amber-400" />
                Chronicle journal archive (.md)
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Formatted markdown document with all your dates, mood ratings, and personal reflections. Compatible with Obsidian, Notion, and Logseq.
              </p>
            </div>

            <Button
              onClick={handleExportMarkdown}
              disabled={isExportingMd}
              size="sm"
              className="w-full bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs font-serif"
            >
              {isExportingMd ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              )}
              Export chronicle (.md)
            </Button>
          </div>

          {/* CSV Habits Export */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-amber-900/30 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Table className="w-4 h-4 text-amber-400" />
                Habit & streak records (.csv)
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Raw data table with your habit names, categories, difficulties, active streaks, and completed milestones. Opens in Excel and Google Sheets.
              </p>
            </div>

            <Button
              onClick={handleExportCsv}
              disabled={isExportingCsv}
              size="sm"
              className="w-full bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs font-serif"
            >
              {isExportingCsv ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              )}
              Export habits (.csv)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
