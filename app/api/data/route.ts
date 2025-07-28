import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    if (!type || !userId) {
      return NextResponse.json({ error: 'Missing type or userId parameter' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, authUserId) => {
      // Verify the userId matches the authenticated user
      if (authUserId !== userId) {
        throw new Error('Unauthorized access to user data');
      }

      switch (type) {
        case 'grid':
          const { data: gridData, error: gridError } = await supabase
            .from('realm_grids')
            .select('grid_data')
            .eq('user_id', userId)
            .eq('is_current', true)
            .single();
          
          return { data: { grid: gridData?.grid_data || null }, error: gridError };

        case 'character':
          const { data: charData, error: charError } = await supabase
            .from('realm_grids')
            .select('character_position')
            .eq('user_id', userId)
            .eq('is_current', true)
            .single();
          
          return { data: charData?.character_position || null, error: charError };

        case 'inventory':
          const { data: invData, error: invError } = await supabase
            .from('tile_inventory')
            .select('*')
            .eq('user_id', userId);
          
          // Convert array to object format expected by the frontend
          const inventoryObject: Record<string, any> = {};
          invData?.forEach(item => {
            inventoryObject[item.tile_type] = {
              type: item.tile_type,
              quantity: item.quantity,
              cost: item.cost
            };
          });
          
          return { data: inventoryObject, error: invError };

        case 'preferences':
          const { data: prefData, error: prefError } = await supabase
            .from('user_preferences')
            .select('preferences_data')
            .eq('user_id', userId)
            .single();
          
          return { data: prefData?.preferences_data || {}, error: prefError };

        case 'settings':
          const { data: settingsData, error: settingsError } = await supabase
            .from('game_settings')
            .select('settings_data')
            .eq('user_id', userId)
            .single();
          
          return { data: settingsData?.settings_data || {}, error: settingsError };

        case 'descriptions':
          const { data: descData, error: descError } = await supabase
            .from('image_descriptions')
            .select('image_path, description')
            .eq('user_id', userId);
          
          // Convert to the expected format
          const descriptions: Record<string, string> = {};
          descData?.forEach(item => {
            descriptions[item.image_path] = item.description || '';
          });
          
          return { data: descriptions, error: descError };

        default:
          throw new Error(`Unknown data type: ${type}`);
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ data: result.data });

  } catch (error) {
    console.error('[Data API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userId, data } = body;

    if (!type || !userId || data === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, authUserId) => {
      // Verify the userId matches the authenticated user
      if (authUserId !== userId) {
        throw new Error('Unauthorized access to user data');
      }

      switch (type) {
        case 'grid':
          // Mark all existing grids as not current
          await supabase
            .from('realm_grids')
            .update({ is_current: false })
            .eq('user_id', userId);

          // Insert new grid data
          const { error: gridError } = await supabase
            .from('realm_grids')
            .insert({
              user_id: userId,
              grid_data: data,
              is_current: true
            });

          return { error: gridError };

        case 'character':
          // Update character position in current grid
          const { error: charError } = await supabase
            .from('realm_grids')
            .update({ character_position: data })
            .eq('user_id', userId)
            .eq('is_current', true);

          return { error: charError };

        case 'inventory':
          // Clear existing inventory
          await supabase
            .from('tile_inventory')
            .delete()
            .eq('user_id', userId);

          // Insert new inventory items
          if (Object.keys(data).length > 0) {
            const items = Object.entries(data).map(([tileType, item]: [string, any]) => ({
              user_id: userId,
              tile_type: tileType,
              quantity: item.quantity || 1,
              cost: item.cost || 0
            }));

            const { error: invError } = await supabase
              .from('tile_inventory')
              .insert(items);

            return { error: invError };
          }

          return { error: null };

        case 'preferences':
          const { error: prefError } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: userId,
              preferences_data: data
            }, { onConflict: 'user_id' });

          return { error: prefError };

        case 'settings':
          const { error: settingsError } = await supabase
            .from('game_settings')
            .upsert({
              user_id: userId,
              settings_data: data
            }, { onConflict: 'user_id' });

          return { error: settingsError };

        case 'descriptions':
          // Clear existing descriptions
          await supabase
            .from('image_descriptions')
            .delete()
            .eq('user_id', userId);

          // Insert new descriptions
          if (Object.keys(data).length > 0) {
            const items = Object.entries(data).map(([imagePath, description]) => ({
              user_id: userId,
              image_path: imagePath,
              description: description
            }));

            const { error: descError } = await supabase
              .from('image_descriptions')
              .insert(items);

            return { error: descError };
          }

          return { error: null };

        default:
          throw new Error(`Unknown data type: ${type}`);
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Data API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 