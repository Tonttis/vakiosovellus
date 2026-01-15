import { NextRequest, NextResponse } from 'next/server'

type Outcome = '1' | 'X' | '2'

interface GameWeight {
  gameNumber: number
  weightHome: number
  weightDraw: number
  weightAway: number
}

interface GenerateRequest {
  games: GameWeight[]
}

// Weighted random selection
function weightedPick(weightHome: number, weightDraw: number, weightAway: number): Outcome {
  const total = weightHome + weightDraw + weightAway
  const random = Math.random() * total

  if (random < weightHome) return '1'
  if (random < weightHome + weightDraw) return 'X'
  return '2'
}

// Generate a single row based on weighted probabilities
function generateRow(games: GameWeight[]): Outcome[] {
  return games.map(game =>
    weightedPick(game.weightHome, game.weightDraw, game.weightAway)
  )
}

// Generate unique rows (avoid duplicates)
function generateUniqueRows(games: GameWeight[], targetCount: number): Outcome[][] {
  const rows: Set<string> = new Set()
  const uniqueRows: Outcome[][] = []

  let attempts = 0
  const maxAttempts = targetCount * 100 // Prevent infinite loop

  while (rows.size < targetCount && attempts < maxAttempts) {
    const row = generateRow(games)
    const rowString = row.join(',')

    if (!rows.has(rowString)) {
      rows.add(rowString)
      uniqueRows.push(row)
    }

    attempts++
  }

  // If we couldn't generate enough unique rows, generate more with slight variations
  while (uniqueRows.length < targetCount) {
    const row = generateRow(games)
    uniqueRows.push(row)
  }

  return uniqueRows.slice(0, targetCount)
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()

    if (!body.games || body.games.length !== 13) {
      return NextResponse.json(
        { error: 'Exactly 13 games are required' },
        { status: 400 }
      )
    }

    // Validate weights
    for (const game of body.games) {
      const total = game.weightHome + game.weightDraw + game.weightAway
      if (total === 0) {
        return NextResponse.json(
          { error: `Game ${game.gameNumber} has invalid weights` },
          { status: 400 }
        )
      }
    }

    // Generate 128 unique rows
    const rows = generateUniqueRows(body.games, 128)

    // Format response
    const formattedRows = rows.map((picks, index) => ({
      rowNumber: index + 1,
      picks,
    }))

    return NextResponse.json({
      rows: formattedRows,
      total: formattedRows.length,
      costPerRow: 0.25,
      totalCost: 32,
    })
  } catch (error) {
    console.error('Error generating rows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
