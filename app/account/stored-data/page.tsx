"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  // Only show Supabase-backed data
  const [characterStats, setCharacterStats] = useState<any>(null)
  const [characterTitles, setCharacterTitles] = useState<any>(null)
  const [characterPerks, setCharacterPerks] = useState<any>(null)
  const [characterStrengths, setCharacterStrengths] = useState<any>(null)

  // Remove all localStorage UI and logic
  // Only keep Supabase data display logic
  return (
    <main className="container mx-auto p-4" aria-label="stored-data-section">
      <h1 className="text-2xl font-bold mb-4">Stored Data</h1>
      <Card className="p-4" aria-label="stored-data-card">
        <ScrollArea className="h-[600px]" aria-label="stored-data-scroll-area">
          {/* Display Supabase-backed data here */}
          {/* Example: */}
          <div>Supabase data will be shown here.</div>
        </ScrollArea>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Character Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-96">
            {characterStats ? JSON.stringify(characterStats, null, 2) : 'No data found'}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Character Titles</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-96">
            {characterTitles ? JSON.stringify(characterTitles, null, 2) : 'No data found'}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Character Perks</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-96">
            {characterPerks ? JSON.stringify(characterPerks, null, 2) : 'No data found'}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Character Strengths</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-96">
            {characterStrengths ? JSON.stringify(characterStrengths, null, 2) : 'No data found'}
          </pre>
        </CardContent>
      </Card>
    </main>
  );
} 