import mongoose from 'mongoose'

export async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tourisme'

    await mongoose.connect(mongoUri)

    console.log('✅ MongoDB connected successfully')

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected')
    })

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    throw error
  }
}
