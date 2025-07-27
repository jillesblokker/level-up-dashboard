import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      gridData, 
      characterPosition, 
      tileInventory, 
      userPreferences, 
      imageDescriptions, 
      gameSettings 
    } = body;

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Call the migration function
      const { data, error } = await supabase.rpc('migrate_user_local_storage_data', {
        p_user_id: userId,
        p_grid_data: gridData,
        p_character_position: characterPosition,
        p_tile_inventory: tileInventory,
        p_user_preferences: userPreferences,
        p_image_descriptions: imageDescriptions,
        p_game_settings: gameSettings
      });

      if (error) {
        throw error;
      }

      return data;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      migrated: result.data,
      message: 'Data migrated successfully'
    });

  } catch (error) {
    console.error('[Migration API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Check migration status
      const [gridData, characterPosition, tileInventory, userPreferences, imageDescriptions, gameSettings] = await Promise.all([
        supabase.from('realm_grids').select('id').eq('user_id', userId).limit(1),
        supabase.from('character_positions').select('id').eq('user_id', userId).limit(1),
        supabase.from('tile_inventory').select('id').eq('user_id', userId).limit(1),
        supabase.from('user_preferences').select('id').eq('user_id', userId).limit(1),
        supabase.from('image_descriptions').select('id').eq('user_id', userId).limit(1),
        supabase.from('game_settings').select('id').eq('user_id', userId).limit(1)
      ]);

      return {
        hasGridData: gridData.data && gridData.data.length > 0,
        hasCharacterPosition: characterPosition.data && characterPosition.data.length > 0,
        hasTileInventory: tileInventory.data && tileInventory.data.length > 0,
        hasUserPreferences: userPreferences.data && userPreferences.data.length > 0,
        hasImageDescriptions: imageDescriptions.data && imageDescriptions.data.length > 0,
        hasGameSettings: gameSettings.data && gameSettings.data.length > 0
      };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);

  } catch (error) {
    console.error('[Migration Status API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 