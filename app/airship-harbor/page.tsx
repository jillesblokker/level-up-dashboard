"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Anchor, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AirshipHarborTab } from "@/components/kingdom/airship-harbor-tab";

export default function AirshipHarborPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-serif pb-24 pb-safe">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-amber-900/30 bg-zinc-950/90 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/kingdom">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-amber-800/40 bg-zinc-900/80 text-amber-300 hover:bg-amber-950/40 hover:text-amber-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Kingdom</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-950/60 text-amber-400">
                <Anchor className="h-4 w-4" />
              </div>
              <h1 className="text-lg font-bold tracking-wide text-amber-300 sm:text-xl font-serif">
                Airship Harbor
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/worldmap">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-zinc-400 hover:text-amber-300"
              >
                <Compass className="h-4 w-4" />
                <span className="hidden sm:inline">World Map</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <AirshipHarborTab />
      </main>
    </div>
  );
}
