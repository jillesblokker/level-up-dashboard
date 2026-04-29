import { z } from 'zod';

export const TileSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  description: z.string().optional(),
  connections: z.array(z.string()).optional(),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).optional(),
  revealed: z.boolean().optional(),
  isVisited: z.boolean().optional(),
  x: z.number(),
  y: z.number(),
  ariaLabel: z.string().optional(),
  image: z.string().optional(),
  cost: z.number().optional(),
  quantity: z.number().optional(),
  version: z.number().optional(),
  last_updated: z.string().optional(),
});

export const TileInventoryUpdateSchema = z.object({
  tile: TileSchema,
});

export const KingdomGridSchema = z.object({
  grid: z.array(z.array(TileSchema)),
});
