import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Return default milestone progress
    // In production, this checks user habit completions + alliance shared totals
    return NextResponse.json({
      success: true,
      progress: {
        Might: 100,
        Knowledge: 100,
        Honor: 100,
        Castle: 100,
        Craft: 100,
        Vitality: 100,
        Wellness: 100,
        Exploration: 100,
        Conquest: 100,
        Spirit: 100
      },
      claimedWeapons: []
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, weaponId } = body

    if (action === 'claim_weapon') {
      return NextResponse.json({
        success: true,
        weaponId,
        message: `Siege weapon ${weaponId} unlocked and placed in Sandbox Inventory!`
      })
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
