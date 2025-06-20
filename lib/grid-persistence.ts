import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { Tile } from "@/types/tiles";
import { numericToTileType, tileTypeToNumeric, createTileFromNumeric } from "./grid-loader";

const GRID_COLS = 13;
const INITIAL_ROWS = 7;

function createDefaultGrid(): Tile[][] {
    const grid: Tile[][] = [];
    for (let y = 0; y < INITIAL_ROWS; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < GRID_COLS; x++) {
            row.push(createTileFromNumeric(2, x, y)); // Default to grass
        }
        grid.push(row);
    }
    return grid;
}

export async function loadGridFromSupabase(supabase: SupabaseClient<Database>, userId: string): Promise<Tile[][] | null> {
    console.log('Attempting to load grid from Supabase for user:', userId);
    const { data, error } = await supabase
        .from('realm_grids')
        .select('grid')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error loading grid from Supabase:', error.message);
        return null;
    }

    if (!data || !data.grid) {
        console.log('No grid found in Supabase for user.');
        return null;
    }

    console.log('Successfully loaded grid from Supabase.');
    return data.grid.map((row: number[], y: number) =>
        row.map((numeric: number, x: number) => createTileFromNumeric(numeric, x, y))
    );
}

export async function loadGridFromLocalStorage(): Promise<Tile[][]> {
    console.log('Attempting to load grid from localStorage.');
    const savedGrid = localStorage.getItem('grid');
    if (savedGrid) {
        console.log('Found grid in localStorage.');
        try {
            // It's already stored as Tile[][], so just parse
            return JSON.parse(savedGrid);
        } catch (e) {
            console.error("Failed to parse grid from localStorage", e);
            return createDefaultGrid();
        }
    }
    console.log('No grid in localStorage. Creating default grid.');
    return createDefaultGrid();
}

export async function saveGridToSupabase(supabase: SupabaseClient<Database>, userId: string, grid: Tile[][]): Promise<void> {
    console.log('Attempting to save grid to Supabase for user:', userId);
    const numericGrid = grid.map(row =>
        row.map(tile => tileTypeToNumeric(tile.type))
    );

    const { error } = await supabase
        .from('realm_grids')
        .upsert({
            user_id: userId,
            grid: numericGrid,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error) {
        console.error('Error saving grid to Supabase:', error.message);
        throw new Error(error.message);
    }
    console.log('Successfully saved grid to Supabase.');
}

export async function saveGridToLocalStorage(grid: Tile[][]): Promise<void> {
    console.log('Saving grid to localStorage.');
    localStorage.setItem('grid', JSON.stringify(grid));
} 