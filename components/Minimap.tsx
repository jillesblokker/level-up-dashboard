"use client"

import React from "react";
import { MinimapProps, MinimapEntity, MinimapRotationMode } from "@/types/minimap";
import { cn } from "@/lib/utils";

const TILE_SIZE = 6; // px per tile at zoom=1
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
  playerDirection = 0,
  entities,
  zoom,
  onZoomChange,
  rotationMode,
  onRotationModeChange,
  className,
  onClose,
}) => {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const mapWidth = cols * TILE_SIZE * zoom;
  const mapHeight = rows * TILE_SIZE * zoom;

  // Rotation transform
  const rotation = rotationMode === "player" ? -playerDirection : 0;

  return (
    <section
      className={cn(
        "fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2 border border-amber-800/60",
        className
      )}
      aria-label="minimap-container"
      style={{ width: mapWidth + 32, minWidth: 120 }}
    >
      {/* Controls */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex gap-1">
          <button
            aria-label="Zoom out"
            className="w-7 h-7 rounded bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-amber-800/20 focus:outline-none"
            onClick={() => onZoomChange(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            tabIndex={0}
          >
            -
          </button>
          <span className="text-xs text-gray-700 px-1">{zoom.toFixed(1)}x</span>
          <button
            aria-label="Zoom in"
            className="w-7 h-7 rounded bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-amber-800/20 focus:outline-none"
            onClick={() => onZoomChange(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            tabIndex={0}
          >
            +
          </button>
        </div>
        <div className="flex gap-1">
          <button
            aria-label="Static North Mode"
            className={cn(
              "w-7 h-7 rounded flex items-center justify-center text-gray-700 text-xs",
              rotationMode === "static" ? "bg-amber-700 text-white" : "bg-gray-200 hover:bg-amber-800/20"
            )}
            onClick={() => onRotationModeChange("static")}
            tabIndex={0}
          >
            N
          </button>
          <button
            aria-label="Close Minimap"
            className="w-7 h-7 rounded flex items-center justify-center bg-gray-200 text-gray-700 hover:bg-red-200 hover:text-red-700 focus:outline-none"
            onClick={onClose}
            tabIndex={0}
          >
            ×
          </button>
        </div>
      </div>
      {/* Minimap grid */}
      <div
        className="relative bg-neutral-50 rounded overflow-hidden border border-gray-200"
        style={{ width: mapWidth, height: mapHeight }}
        aria-label="minimap-map-area"
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: mapWidth,
            height: mapHeight,
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "center center",
            transition: "transform 0.2s cubic-bezier(.4,2,.6,1)",
          }}
        >
          {/* Tiles */}
          {grid.map((row, y) =>
            row.map((tile, x) => (
              <div
                key={`minimap-tile-${x}-${y}`}
                className={cn(
                  "absolute border border-gray-200",
                  tile.type === "empty"
                    ? "bg-gray-100"
                    : tile.type === "water"
                    ? "bg-blue-200"
                    : tile.type === "mountain"
                    ? "bg-gray-400"
                    : tile.type === "forest"
                    ? "bg-green-200"
                    : tile.type === "city"
                    ? "bg-amber-200"
                    : tile.type === "town"
                    ? "bg-amber-100"
                    : "bg-amber-300"
                )}
                style={{
                  width: TILE_SIZE * zoom,
                  height: TILE_SIZE * zoom,
                  left: x * TILE_SIZE * zoom,
                  top: y * TILE_SIZE * zoom,
                  borderRadius: 1,
                }}
                aria-label={`minimap-tile-${x}-${y}`}
              />
            ))
          )}
          {/* Player as yellow dot */}
          <span
            className="absolute z-10 rounded-full bg-yellow-400 border-2 border-yellow-300 shadow"
            style={{
              left: playerPosition.x * TILE_SIZE * zoom,
              top: playerPosition.y * TILE_SIZE * zoom,
              width: TILE_SIZE * zoom,
              height: TILE_SIZE * zoom,
              display: "block",
              pointerEvents: "none",
              filter: "drop-shadow(0 0 2px #000)",
              transform: rotationMode === "player" ? `rotate(${-rotation}deg)` : undefined,
              transition: "transform 0.2s cubic-bezier(.4,2,.6,1)",
            }}
            aria-label="minimap-player"
            role="img"
          />
        </div>
      </div>
    </section>
  );
}; 