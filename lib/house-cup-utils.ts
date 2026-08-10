export interface HouseCupStandings {
  user_id: string;
  display_name: string;
  title: string;
  is_viewer: boolean;
  categories: Record<string, { points: number; fill: number }>;
  total_points: number;
  categories_won: number;
}

export interface HouseCupCategorySummary {
  category_id: string;
  points: number;
  fill: number;
}

/**
 * Calculates the power 0.6 fill curve for House Cup hourglasses (§5 of spec).
 * fill = clamp(pow(points / 50000, 0.6), 0, 1)
 */
export function calculateFillCurve(points: number): number {
  if (points <= 0) return 0;
  const ratio = Math.min(1, points / 50000);
  const fill = Math.pow(ratio, 0.6);
  return Math.min(1, Math.max(0, fill));
}
