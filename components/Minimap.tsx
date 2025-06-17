"use client"

import React, { useRef, useLayoutEffect, useState } from "react";
import { MinimapProps } from "@/types/minimap";
import { cn } from "@/lib/utils";

const TILE_SIZE = 10; // px per tile at zoom=1
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

const ENTITY_ICONS: Record<string, string> = {
  npc: "🧑",
  enemy: "👾",
  landmark: "⭐",
};

export const Minimap: React.FC<MinimapProps> = ({
  grid,
  playerPosition,
  entities,
  zoom,
  onZoomChange,
  className,
  onClose,
}) => {
  // Debug logging
  // console.log('Minimap render:', { gridLength: grid?.length, gridFirstRow: grid?.[0]?.length, playerPosition, zoom });

  const rows = grid?.length || 0;
  const cols = grid?.[0]?.length || 0;
  const mapWidth = cols * TILE_SIZE * zoom;
  const mapHeight = rows * TILE_SIZE * zoom;

  // Controls height (estimate, or measure)
  const controlsHeight = 44; // px (approx height of controls row)
  const padding = 16; // px (top+bottom, left+right)

  // Container size: grid + controls + padding
  const containerWidth = mapWidth + padding;
  const containerHeight = mapHeight + controlsHeight + padding;

  // If no grid data, show a placeholder
  if (!grid || grid.length === 0 || !grid[0] || grid[0].length === 0) {
    return (
      <section
        className={cn(
          "fixed top-4 right-4 z-50 rounded-xl shadow-lg p-2 flex flex-col gap-2 border border-amber-800/60 bg-gradient-to-br from-blue-900/80 to-blue-700/80",
          className
        )}
        aria-label="minimap-container"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-amber-200">Minimap</span>
          <button
            aria-label="Close Minimap"
            className="w-7 h-7 rounded flex items-center justify-center bg-blue-800 text-amber-200 hover:bg-red-800 hover:text-red-200 focus:outline-none"
            onClick={onClose}
            tabIndex={0}
          >
            ×
          </button>
        </div>
        <div className="w-64 h-32 bg-blue-800/60 rounded flex items-center justify-center text-amber-100 text-sm">
          No map data available
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "fixed top-4 right-4 z-50 rounded-xl shadow-lg border border-amber-800/60 bg-gradient-to-br from-blue-900/80 to-blue-700/80 flex flex-col items-center",
        className
      )}
      aria-label="minimap-container"
    >
      {/* Controls */}
      <div className="flex items-center justify-between w-full px-4 pt-3 pb-2">
        <div className="flex gap-1">
          <button
            aria-label="Zoom out"
            className="w-7 h-7 rounded bg-blue-800 text-amber-200 flex items-center justify-center hover:bg-amber-800/20 focus:outline-none border border-amber-800/40"
            onClick={() => onZoomChange(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            tabIndex={0}
          >
            -
          </button>
          <span className="text-xs text-amber-100 px-1">{zoom.toFixed(1)}x</span>
          <button
            aria-label="Zoom in"
            className="w-7 h-7 rounded bg-blue-800 text-amber-200 flex items-center justify-center hover:bg-amber-800/20 focus:outline-none border border-amber-800/40"
            onClick={() => onZoomChange(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            tabIndex={0}
          >
            +
          </button>
        </div>
        <button
          aria-label="Close Minimap"
          className="w-7 h-7 rounded flex items-center justify-center bg-blue-800 text-amber-200 hover:bg-red-800 hover:text-red-200 focus:outline-none border border-amber-800/40"
          onClick={onClose}
          tabIndex={0}
        >
          ×
        </button>
      </div>
      {/* Minimap grid - centered, no overflow, with padding */}
      <div
        className="flex items-center justify-center p-4"
        aria-label="minimap-map-area"
      >
        <div
          className="relative"
          style={{ width: mapWidth, height: mapHeight }}
        >
          {/* Tiles */}
          {grid.map((row, y) =>
            row.map((tile, x) => {
              if (!tile) return null;
              return (
                <div
                  key={`minimap-tile-${x}-${y}`}
                  className={cn(
                    "absolute border border-blue-900/40 rounded-sm",
                    tile.type === "empty"
                      ? "bg-blue-900/40"
                      : tile.type === "water"
                      ? "bg-blue-400/80"
                      : tile.type === "mountain"
                      ? "bg-gray-400/80"
                      : tile.type === "forest"
                      ? "bg-green-700/80"
                      : tile.type === "city"
                      ? "bg-amber-300/80"
                      : tile.type === "town"
                      ? "bg-amber-100/80"
                      : tile.type === "grass"
                      ? "bg-green-300/80"
                      : tile.type === "snow"
                      ? "bg-blue-100/80"
                      : tile.type === "ice"
                      ? "bg-cyan-200/80"
                      : tile.type === "lava"
                      ? "bg-red-400/80"
                      : tile.type === "volcano"
                      ? "bg-red-700/80"
                      : tile.type === "desert"
                      ? "bg-yellow-200/80"
                      : tile.type === "cave"
                      ? "bg-gray-600/80"
                      : tile.type === "dungeon"
                      ? "bg-purple-400/80"
                      : tile.type === "castle"
                      ? "bg-gray-300/80"
                      : tile.type === "portal-entrance"
                      ? "bg-purple-200/80"
                      : tile.type === "portal-exit"
                      ? "bg-purple-200/80"
                      : tile.type === "mystery"
                      ? "bg-yellow-300/80"
                      : "bg-amber-300/80"
                  )}
                  style={{
                    width: TILE_SIZE * zoom,
                    height: TILE_SIZE * zoom,
                    left: x * TILE_SIZE * zoom,
                    top: y * TILE_SIZE * zoom,
                  }}
                  aria-label={`${tile.type} tile at position ${x}, ${y}`}
                />
              );
            })
          )}
          {/* Player as yellow dot */}
          <span
            className="absolute z-10 rounded-full bg-amber-400 border-2 border-amber-300 shadow transition-transform duration-200 ease-out drop-shadow-lg pointer-events-none"
            style={{
              left: playerPosition.x * TILE_SIZE * zoom,
              top: playerPosition.y * TILE_SIZE * zoom,
              width: TILE_SIZE * zoom,
              height: TILE_SIZE * zoom,
            }}
            aria-label={`Player position: ${playerPosition.x}, ${playerPosition.y}`}
          />
          {/* Entities */}
          {entities.map((entity, index) => (
            <div
              key={`entity-${index}`}
              className="absolute z-5 text-xs -translate-x-1/2 -translate-y-1/2"
              style={{
                left: entity.x * TILE_SIZE * zoom,
                top: entity.y * TILE_SIZE * zoom,
              }}
              aria-label={`${entity.type} at position ${entity.x}, ${entity.y}`}
            >
              {ENTITY_ICONS[entity.type] || "?"}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}; 