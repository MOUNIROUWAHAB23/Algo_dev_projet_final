import mongoose, { Document, Schema } from 'mongoose'

export interface IHebergement extends Document {
  source: string
  nom: string
  type: string
  adresse?: string
  codePostal?: string
  commune: string
  departement?: string
  region?: string
  latitude?: number
  longitude?: number
  capacite?: number
  classement?: string
  equipements?: string[]
  telephone?: string
  email?: string
  url?: string
  prixMoyen?: number
  importedAt: Date
  updatedAt: Date
}

const HebergementSchema: Schema = new Schema({
  source: { type: String, required: true },
  nom: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['HOTEL', 'CAMPING', 'RESIDENCE', 'MEUBLE', 'AUBERGE', 'VILLAGE_VACANCES', 'AUTRE'], index: true },
  adresse: String,
  codePostal: String,
  commune: { type: String, required: true, index: true },
  departement: { type: String, index: true },
  region: { type: String, index: true },
  latitude: Number,
  longitude: Number,
  capacite: Number,
  classement: String,
  equipements: [String],
  telephone: String,
  email: String,
  url: String,
  prixMoyen: Number
}, {
  timestamps: {
    createdAt: 'importedAt',
    updatedAt: 'updatedAt'
  }
})

// 2dsphere index for geospatial queries
HebergementSchema.index({ location: '2dsphere' })

// Text index for search
HebergementSchema.index({ nom: 'text', commune: 'text' })

// Compound index for filtering
HebergementSchema.index({ type: 1, region: 1, commune: 1 })

export default mongoose.model<IHebergement>('Hebergement', HebergementSchema)
