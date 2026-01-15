import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Game, BetSet, BetRow, VakioData } from '@/lib/mongodb-models'

/**
 * POST /api/mongodb/games - Save or update games
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { games } = body

    if (!Array.isArray(games)) {
      return NextResponse.json({ error: 'Invalid games data' }, { status: 400 })
    }

    // Delete existing games and create new ones
    await Game.deleteMany({})
    const savedGames = await Game.insertMany(games)

    return NextResponse.json({
      success: true,
      data: savedGames,
      message: `Saved ${savedGames.length} games to MongoDB`,
    })
  } catch (error) {
    console.error('Error saving games:', error)
    return NextResponse.json(
      { error: 'Failed to save games' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/mongodb/games - Get all games
 */
export async function GET() {
  try {
    await connectDB()

    const games = await Game.find().sort({ gameNumber: 1 }).lean()

    return NextResponse.json({
      success: true,
      data: games,
    })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}
