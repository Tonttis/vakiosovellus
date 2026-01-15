import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { VakioScore } from '@/lib/mongodb-models'

/**
 * POST /api/mongodb/scores - Save vakioveikkaus scores
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { gameName, poolSize, date, scores, hitCount, totalPossible = 13, correctCount = 0, percentage = 0 } = body

    // Validate required fields
    if (!gameName || !scores || !date) {
      return NextResponse.json({ error: 'Missing required fields: gameName, scores, date' }, { status: 400 })
    }

    // Calculate percentage if not provided
    const calculatedPercentage = percentage || Math.round((correctCount / totalPossible) * 100)

    // Create vakio score record
    const vakioScore = await VakioScore.create({
      gameName,
      poolSize,
      date: new Date(date),
      scores,
      hitCount,
      totalPossible,
      correctCount,
      percentage: calculatedPercentage,
    })

    return NextResponse.json({
      success: true,
      data: vakioScore,
      message: `Score saved: ${correctCount}/${totalPossible} hits (${calculatedPercentage}%)`,
    })
  } catch (error) {
    console.error('Error saving score:', error)
    return NextResponse.json(
      { error: 'Failed to save score' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/mongodb/scores - Get all scores
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')

    const scores = await VakioScore.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()

    const total = await VakioScore.countDocuments()

    return NextResponse.json({
      success: true,
      data: scores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching scores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/mongodb/scores/latest - Get most recent score
 */
export async function LATEST(request: NextRequest) {
  try {
    await connectDB()

    const latestScore = await VakioScore.findOne()
      .sort({ createdAt: -1 })
      .lean()

    if (!latestScore) {
      return NextResponse.json(
        { error: 'No scores found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: latestScore,
    })
  } catch (error) {
    console.error('Error fetching latest score:', error)
    return NextResponse.json(
      { error: 'Failed to fetch latest score' },
      { status: 500 }
    )
  }
}
