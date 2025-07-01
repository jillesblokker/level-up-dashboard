"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import logger, { LogEntry } from "@/lib/logger";
import { Badge } from "@/components/ui/badge";
import { useSupabaseRealtimeSync } from '@/hooks/useSupabaseRealtimeSync';

export default function LogCenterPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    setLogs(logger.getAllLogs());
  }, []);

  // --- Supabase real-time sync for app_logs ---
  useSupabaseRealtimeSync({
    table: 'app_logs',
    userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : undefined,
    onChange: () => {
      // Re-fetch logs from API or Supabase and update state
      // (Replace with your actual fetch logic if needed)
      fetch('/api/app-logs').then(async (response) => {
        if (response.ok) {
          const logs = await response.json();
          setLogs(logs);
        }
      });
    }
  });

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return "bg-blue-600";
      case "warning":
        return "bg-amber-600";
      case "error":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <main className="container mx-auto p-4" aria-label="log-center-section">
      <h1 className="text-2xl font-bold mb-4">Log Center</h1>
      <Card className="p-4" aria-label="log-center-card">
        <h2 className="text-xl font-semibold mb-4">Application Logs</h2>
        <ScrollArea className="h-[600px]" aria-label="log-center-scroll-area">
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No logs found.</div>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-4 border rounded-lg flex gap-4 items-start bg-black/60"
                  aria-label="log-entry"
                >
                  {log.image && (
                    <img
                      src={log.image}
                      alt={log.source + ' log image'}
                      aria-label="log-image"
                      className="w-16 h-16 object-cover rounded-md border border-amber-800/40"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getLevelColor(log.level)} aria-label={`log-level-${log.level}`}>{log.level.toUpperCase()}</Badge>
                      <span className="text-xs text-muted-foreground">{log.source}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{log.timestamp.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-white break-words">{log.message}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </main>
  );
} 