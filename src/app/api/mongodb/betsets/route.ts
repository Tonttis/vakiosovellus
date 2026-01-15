import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Game, BetSet, BetRow } from '@/lib/mongodb-models'

/**
 * POST /api/mongodb/betsets - Save a complete bet set with rows
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { name, gameName, sport, poolSize, games, rows, totalCost = 32 } = body

    if (!Array.isArray(games)) {
      return NextResponse.json({ error: 'Invalid games data' }, { status: 400 })
    }

    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: 'Invalid rows data' }, { status: 400 })
    }

    // Save games first
    await Game.deleteMany({})
    const savedGames = await Game.insertMany(games)

    // Create bet set
    const betSetData = {
      name: name || 'Vakioveikkaus',
      gameName,
      sport,
      poolSize,
      matches: savedGames.map((g: any) => g._id),
      totalCost,
      rowsCount: rows.length,
    }

    const betSet = await BetSet.create(betSetData)

    // Save rows with reference to bet set
    const rowsToSave = rows.map((row: any) => ({
      rowNumber: row.rowNumber,
      picks: row.picks.join(','),
      betSet: betSet._id,
    }))

    await BetRow.insertMany(rowsToSave)

    return NextResponse.json({
      success: true,
      data: {
        betSetId: betSet._id,
        gamesCount: savedGames.length,
        rowsCount: rowsToSave.length,
        totalCost,
      },
      message: `Saved bet set with ${rowsToSave.length} rows to MongoDB`,
    })
  } catch (error) {
    console.error('Error saving bet set:', error)
    return NextResponse.json(
      { error: 'Failed to save bet set' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/mongodb/betsets - Get all bet sets
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')

    const betSets = await BetSet.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('matches')
      .populate('rows')
      .lean()

    const total = await BetSet.countDocuments()

    return NextResponse.json({
      success: true,
      data: betSets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching bet sets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bet sets' },
      { status: 500 }
    )
  }
}
