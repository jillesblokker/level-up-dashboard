import { NextRequest, NextResponse } from 'next/server'
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification'

export async function DELETE(request: NextRequest) {
  try {
    const { userId, itemId } = await request.json()
    
    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'Missing userId or itemId' },
        { status: 400 }
      )
    }

    const { success, data, error } = await authenticatedSupabaseQuery(
      userId,
      async (supabase) => {
        // Remove the item from the user's inventory
        const { error: deleteError } = await supabase
          .from('inventory_items')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', itemId)

        if (deleteError) {
          throw deleteError
        }

        return { success: true }
      }
    )

    if (!success) {
      return NextResponse.json(
        { error: error || 'Failed to remove item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
