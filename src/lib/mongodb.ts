import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable')
}

/**
 * MongoDB Connection Options
 * Optimized for MongoDB Atlas
 */
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
}

/**
 * Global Mongoose Connection
 * Mongoose will create a default connection
 */
let connection: typeof mongoose | null = null

/**
 * Connect to MongoDB Atlas
 */
export async function connectDB() {
  if (connection) {
    console.log('MongoDB already connected')
    return connection
  }

  try {
    connection = await mongoose.connect(MONGODB_URI, options)
    console.log('MongoDB connected successfully to Atlas')

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected')
      connection = null
    })

    return connection
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    throw error
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB() {
  if (connection) {
    await connection.disconnect()
    connection = null
    console.log('MongoDB disconnected')
  }
}

/**
 * Get current connection status
 */
export function isConnected() {
  return mongoose.connection.readyState === 1 // 1 = connected
}

export default connectDB
