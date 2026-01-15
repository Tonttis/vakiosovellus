import mongoose, { Schema, Document, Model } from 'mongoose'

/**
 * Game/Match Schema for Vakioveikkaus
 * Stores information about each match/game
 */
export interface IGame extends Document {
  gameNumber: number
  homeTeam: string
  awayTeam: string
  weightHome: number
  weightDraw: number
  weightAway: number
  createdAt: Date
  updatedAt: Date
}

const GameSchema = new Schema<IGame>(
  {
    gameNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 13,
    },
    homeTeam: {
      type: String,
      required: true,
      trim: true,
    },
    awayTeam: {
      type: String,
      required: true,
      trim: true,
    },
    weightHome: {
      type: Number,
      required: true,
      default: 33,
      min: 0,
      max: 100,
    },
    weightDraw: {
      type: Number,
      required: true,
      default: 34,
      min: 0,
      max: 100,
    },
    weightAway: {
      type: Number,
      required: true,
      default: 33,
      min: 0,
      max: 100,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'games',
  }
)

// Index for efficient queries
GameSchema.index({ gameNumber: 1 })

export const Game: Model<IGame> = mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema)

/**
 * BetSet Schema for Vakioveikkaus
 * Stores a complete set of generated betting rows
 */
export interface IBetSet extends Document {
  name: string
  gameName?: string
  poolSize?: string
  sport?: string
  matches: IGame[]
  rows: IBetRow[]
  totalCost: number
  rowsCount: number
  createdAt: Date
  updatedAt: Date
}

const BetSetSchema = new Schema<IBetSet>(
  {
    name: {
      type: String,
      default: 'Vakioveikkaus',
    },
    gameName: {
      type: String,
      trim: true,
    },
    poolSize: {
      type: String,
      trim: true,
    },
    sport: {
      type: String,
      trim: true,
    },
    matches: [{
      type: Schema.Types.ObjectId,
      ref: 'Game',
    }],
    rows: [{
      type: Schema.Types.ObjectId,
      ref: 'BetRow',
    }],
    totalCost: {
      type: Number,
      default: 32,
    },
    rowsCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'betsets',
  }
)

BetSetSchema.index({ createdAt: -1 })

export const BetSet: Model<IBetSet> = mongoose.models.BetSet || mongoose.model<IBetSet>('BetSet', BetSetSchema)

/**
 * BetRow Schema for Vakioveikkaus
 * Stores individual betting rows
 */
export interface IBetRow extends Document {
  rowNumber: number
  picks: string
  betSet: mongoose.Types.ObjectId
  createdAt: Date
}

const BetRowSchema = new Schema<IBetRow>(
  {
    rowNumber: {
      type: Number,
      required: true,
    },
    picks: {
      type: String,
      required: true,
      trim: true,
    },
    betSet: {
      type: Schema.Types.ObjectId,
      ref: 'BetSet',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'betrows',
  }
)

BetRowSchema.index({ betSet: 1, rowNumber: 1 })

export const BetRow: Model<IBetRow> = mongoose.models.BetRow || mongoose.model<IBetRow>('BetRow', BetRowSchema)

/**
 * VakioData Schema for imported JSON data
 * Stores the complete imported Veikkaus data
 */
export interface IVakioData extends Document {
  gameName: string
  sport: string
  closingTime?: string
  poolSize?: string
  url?: string
  matches: Array<{
    matchNumber: string
    homeTeam: string
    awayTeam: string
    percentage1: number
    percentageX: number
    percentage2: number
    total: number
  }>
  createdAt: Date
}

const VakioDataSchema = new Schema<IVakioData>(
  {
    gameName: {
      type: String,
      required: true,
    },
    sport: {
      type: String,
      default: 'Jalkapallo',
    },
    closingTime: {
      type: String,
    },
    poolSize: {
      type: String,
    },
    url: {
      type: String,
    },
    matches: [{
      matchNumber: String,
      homeTeam: String,
      awayTeam: String,
      percentage1: Number,
      percentageX: Number,
      percentage2: Number,
      total: Number,
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'vakiodata',
  }
)

VakioDataSchema.index({ createdAt: -1 })

export const VakioData: Model<IVakioData> = mongoose.models.VakioData || mongoose.model<IVakioData>('VakioData', VakioDataSchema)

/**
 * VakioScore Schema for Vakioveikkaus
 * Stores actual vakio results and scoring
 */
export interface IVakioScore extends Document {
  gameName: string
  poolSize?: string
  date: Date
  scores: string
  hitCount: number
  totalPossible: number
  correctCount: number
  percentage: number
  createdAt: Date
  updatedAt: Date
}

const VakioScoreSchema = new Schema<IVakioScore>(
  {
    gameName: {
      type: String,
      required: true,
    },
    poolSize: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    scores: {
      type: String,
      required: true,
    },
    hitCount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPossible: {
      type: Number,
      required: true,
      default: 13,
    },
    correctCount: {
      type: Number,
      required: true,
      default: 0,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'vakioscores',
  }
)

VakioScoreSchema.index({ createdAt: -1 })

export const VakioScore: Model<IVakioScore> = mongoose.models.VakioScore || mongoose.model<IVakioScore>('VakioScore', VakioScoreSchema)
