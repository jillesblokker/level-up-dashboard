export interface Alliance {
    id: string;
    name: string;
    description: string | null;
    created_by: string;
    members: string[]; // Array of user IDs
    created_at: string;
    updated_at: string;
}

export interface AllianceStreak {
    id: string;
    user_id: string;
    alliance_id: string;
    current_streak: number;
    last_check_in: string; // ISO timestamp
}

export interface AllianceCheckInResult {
    success: boolean;
    streak?: number;
    message?: string;
    data?: AllianceStreak;
}
