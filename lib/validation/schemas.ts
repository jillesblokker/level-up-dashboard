import { z } from 'zod';

// Base schemas
export const baseIdSchema = z.string().uuid();
export const baseTimestampSchema = z.string().datetime();

// User schemas
export const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().optional(),
  preferences: z.record(z.any()).optional(),
});

export const userPreferencesSchema = z.object({
  key: z.string().min(1, 'Preference key is required'),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({}).passthrough(),
    z.array(z.any())
  ]),
});

// Quest schemas
export const questSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Quest title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  category: z.enum(['might', 'agility', 'intelligence', 'knowledge', 'social', 'spiritual'], {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  difficulty: z.enum(['easy', 'medium', 'hard', 'epic', 'legendary'], {
    errorMap: () => ({ message: 'Please select a valid difficulty' })
  }),
  xp: z.number().min(0, 'XP must be 0 or greater').max(10000, 'XP cannot exceed 10,000').optional(),
  gold: z.number().min(0, 'Gold must be 0 or greater').max(10000, 'Gold cannot exceed 10,000').optional(),
  tags: z.array(z.string()).optional(),
  isRepeatable: z.boolean().optional(),
  cooldownHours: z.number().min(0).optional(),
});

export const questCompletionSchema = z.object({
  questId: z.string().uuid('Invalid quest ID'),
  userId: z.string().min(1, 'User ID is required'),
  completed: z.boolean(),
  completedAt: z.string().datetime().optional(),
  xpEarned: z.number().min(0).optional(),
  goldEarned: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

// Challenge schemas
export const challengeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Challenge name is required').max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['strength', 'condition', 'knowledge', 'nutrition', 'mental'], {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  difficulty: z.enum(['easy', 'medium', 'hard', 'epic', 'legendary']),
  xp: z.number().min(0).max(10000).optional(),
  gold: z.number().min(0).max(10000).optional(),
  target: z.number().min(1, 'Target must be at least 1'),
  unit: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

export const challengeCompletionSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID'),
  userId: z.string().min(1),
  completed: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  progress: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

// Milestone schemas
export const milestoneSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Milestone name is required').max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['might', 'agility', 'intelligence', 'knowledge', 'social', 'spiritual']),
  difficulty: z.enum(['easy', 'medium', 'hard', 'epic', 'legendary']),
  xp: z.number().min(0).max(10000).optional(),
  gold: z.number().min(0).max(10000).optional(),
  target: z.number().min(1, 'Target must be at least 1'),
  progress: z.number().min(0).optional(),
  isRepeatable: z.boolean().optional(),
});

// Inventory schemas
export const inventoryItemSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().min(1),
  itemType: z.string().min(1, 'Item type is required'),
  quantity: z.number().min(0, 'Quantity must be 0 or greater'),
  cost: z.number().min(0, 'Cost must be 0 or greater').optional(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']).optional(),
  equipped: z.boolean().optional(),
  slot: z.string().optional(),
});

// Character schemas
export const characterStatsSchema = z.object({
  userId: z.string().min(1),
  level: z.number().min(1, 'Level must be at least 1').max(100, 'Level cannot exceed 100'),
  experience: z.number().min(0, 'Experience cannot be negative'),
  gold: z.number().min(0, 'Gold cannot be negative'),
  health: z.number().min(0).max(1000).optional(),
  mana: z.number().min(0).max(1000).optional(),
  strength: z.number().min(0).max(100).optional(),
  agility: z.number().min(0).max(100).optional(),
  intelligence: z.number().min(0).max(100).optional(),
  vitality: z.number().min(0).max(100).optional(),
});

// Realm schemas
export const realmDataSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.any(),
});

export const characterPositionSchema = z.object({
  x: z.number().min(0, 'X coordinate must be 0 or greater'),
  y: z.number().min(0, 'Y coordinate must be 0 or greater'),
});

// Form schemas (for UI forms)
export const questFormSchema = questSchema.omit({ id: true });
export const challengeFormSchema = challengeSchema.omit({ id: true });
export const milestoneFormSchema = milestoneSchema.omit({ id: true });

// Search and filter schemas
export const questFiltersSchema = z.object({
  category: z.string().optional(),
  difficulty: z.string().optional(),
  completed: z.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "Start date must be before or equal to end date",
  path: ["endDate"],
});

// API request schemas
export const apiRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
});

// Error response schema
export const errorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  code: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

// Success response schema
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
});

// Validation helper functions
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

export const safeParse = <T>(schema: z.ZodSchema<T>, data: unknown): T | null => {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
};

// Type exports
export type Quest = z.infer<typeof questSchema>;
export type QuestCompletion = z.infer<typeof questCompletionSchema>;
export type Challenge = z.infer<typeof challengeSchema>;
export type ChallengeCompletion = z.infer<typeof challengeCompletionSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type CharacterStats = z.infer<typeof characterStatsSchema>;
export type QuestFilters = z.infer<typeof questFiltersSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
