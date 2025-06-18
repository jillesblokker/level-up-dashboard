"use client";

import { Button } from "@/components/ui/button";
import { Sword } from "lucide-react";

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
        
        <h1 className="text-4xl font-medievalsharp text-amber-500 mb-4">Quest Failed</h1>
        
        <div className="bg-amber-900/20 border border-amber-800/20 rounded-lg p-4 mb-6">
          <p className="text-amber-300 font-medievalsharp text-lg">
            The path you seek lies shrouded in mist. The ancient scroll speaks of error 404 - a location beyond the known realm.
          </p>
        </div>
        
        <p className="text-gray-400 mb-8">
          The page you are looking for may have been moved, deleted, or perhaps never existed in this kingdom.
        </p>
        
        <div className="space-y-3">
          <Button 
            className="w-full bg-amber-700 hover:bg-amber-600"
          >
            Return to Kingdom
          </Button>
          
          <Button 
            variant="outline"
            className="w-full border-amber-800/20 text-amber-500 hover:bg-amber-900/30"
          >
            Retrace Your Steps
          </Button>
        </div>
      </div>
    </div>
  );
} 