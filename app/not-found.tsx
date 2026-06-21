"use client";

import { Button } from "@/components/ui/button";
import { Sword } from "lucide-react";
import { TEXT_CONTENT } from "@/lib/text-content";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-black border-2 border-amber-800/50 rounded-lg p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Sword className="h-24 w-24 text-amber-500 rotate-45" />
            <Sword className="h-24 w-24 text-amber-500 -rotate-45 absolute top-0 left-0" />
          </div>
        </div>

        <h1 className="text-4xl font-medievalsharp text-amber-500 mb-4">{TEXT_CONTENT.errorPage.notFound.title}</h1>

        <div className="bg-amber-900/20 border border-amber-800/20 rounded-lg p-4 mb-6">
          <p className="text-amber-300 font-medievalsharp text-lg">
            {TEXT_CONTENT.errorPage.notFound.description}
          </p>
        </div>

        <p className="text-gray-400 mb-8">
          {TEXT_CONTENT.errorPage.notFound.subtext}
        </p>

        <div className="space-y-3">
          <Button
            className="w-full bg-amber-700 hover:bg-amber-600"
          >
            {TEXT_CONTENT.errorPage.notFound.return}
          </Button>

          <Button
            variant="outline"
            className="w-full border-amber-800/20 text-amber-500 hover:bg-amber-900/30"
          >
            {TEXT_CONTENT.errorPage.notFound.retrace}
          </Button>
        </div>
      </div>
    </div>
  );
} 