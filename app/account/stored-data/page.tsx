"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEYS = [
  { key: "checked-quests", label: "Checked Quests" },
  { key: "checked-milestones", label: "Checked Milestones" },
  { key: "tilemap", label: "Tilemap" },
  { key: "kingdom-inventory", label: "Kingdom Inventory" },
  { key: "achievements", label: "Achievements Unlocked" },
  { key: "titles", label: "Titles Gained/Set" },
  { key: "perks", label: "Perks Gained/Set" },
];

function getStoredData() {
  return STORAGE_KEYS.map(({ key, label }) => {
    let value = null;
    try {
      value = localStorage.getItem(key);
    } catch (error) {
      // Error handling intentionally left empty to avoid breaking the UI if stored data fails to load
    }
    return { key, label, value };
  });
}

function summarizeData(key: string, value: any) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return <span>No entries.</span>;
      // Show a table for array of objects
      if (typeof parsed[0] === "object" && parsed[0] !== null) {
        const fields = Object.keys(parsed[0]);
        return (
          <table className="min-w-[300px] text-xs border mb-2" aria-label={`${key}-summary-table`}>
            <thead>
              <tr>
                {fields.map(f => <th key={f} className="px-2 py-1 border-b">{f}</th>)}
              </tr>
            </thead>
            <tbody>
              {parsed.slice(0, 3).map((row, i) => (
                <tr key={i}>
                  {fields.map(f => <td key={f} className="px-2 py-1 border-b">{String(row[f])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        );
      } else {
        // Array of primitives
        return <div>Entries: {parsed.slice(0, 5).join(", ")}{parsed.length > 5 ? "..." : ""}</div>;
      }
    } else if (typeof parsed === "object" && parsed !== null) {
      // Show keys and a preview
      const keys = Object.keys(parsed);
      return <div>Fields: {keys.join(", ")}</div>;
    } else {
      return <div>Value: {String(parsed)}</div>;
    }
  } catch {
    return <span>Invalid JSON or not structured data.</span>;
  }
}

export default function StoredDataPage() {
  const [data, setData] = useState(() => getStoredData());

  const refresh = () => setData(getStoredData());

  const handleCopy = (value: string | null) => {
    if (value) navigator.clipboard.writeText(value);
  };

  const handleClear = (key: string) => {
    localStorage.removeItem(key);
    refresh();
  };

  return (
    <main className="container mx-auto p-4" aria-label="stored-data-section">
      <h1 className="text-2xl font-bold mb-4">Stored Data</h1>
      <Button onClick={refresh} className="mb-4" aria-label="refresh-stored-data">Refresh</Button>
      <Card className="p-4" aria-label="stored-data-card">
        <ScrollArea className="h-[600px]" aria-label="stored-data-scroll-area">
          <div className="space-y-8">
            {data.map(({ key, label, value }) => (
              <section key={key} aria-label={`${label}-section`}>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-lg font-semibold">{label}</h2>
                  <Badge>{key}</Badge>
                  <Button size="sm" variant="outline" onClick={() => handleCopy(value)} aria-label={`copy-${key}`}>Copy</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleClear(key)} aria-label={`clear-${key}`}>Clear</Button>
                </div>
                <div className="mb-2">
                  {value ? summarizeData(key, value) : <span>No data stored.</span>}
                </div>
                <pre className="bg-black/60 rounded p-2 text-xs text-white overflow-x-auto max-w-full" aria-label={`${label}-data`}>
                  {value || "<empty>"}
                </pre>
              </section>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </main>
  );
} 