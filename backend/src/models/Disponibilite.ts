import mongoose, { Document, Schema } from 'mongoose'

export interface IDisponibilite extends Document {
  hebergement: mongoose.Types.ObjectId
  dateDebut: Date
  dateFin: Date
  prixParNuit: number
  disponible: boolean
  typeDisponibilite: 'INSTANTANEE' | 'SUR_DEMANDE' | 'INDISPONIBLE'
  source: string
  dernieresMiseAJour: Date
}

const DisponibiliteSchema: Schema = new Schema({
  hebergement: {
    type: Schema.Types.ObjectId,
    ref: 'Hebergement',
    required: true,
    index: true
  },
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  prixParNuit: Number,
  disponible: { type: Boolean, default: true },
  typeDisponibilite: {
    type: String,
    enum: ['INSTANTANEE', 'SUR_DEMANDE', 'INDISPONIBLE'],
    default: 'SUR_DEMANDE'
  },
  source: {
    type: String,
    required: true,
    enum: ['API_EXTERNE', 'EMAIL', 'TELEPHONE', 'DATA_GOUV', 'MANUEL']
  },
  dernieresMiseAJour: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Index pour les recherches par date
DisponibiliteSchema.index({ hebergement: 1, dateDebut: 1, dateFin: 1 })

// Index pour les recherches de disponibilités à une date donnée
DisponibiliteSchema.index({ dateDebut: 1, dateFin: 1, disponible: 1 })

// TTL index - expire old availability data after 1 year
DisponibiliteSchema.index({ dernieresMiseAJour: 1 }, { expireAfterSeconds: 31536000 })

export default mongoose.model<IDisponibilite>('Disponibilite', DisponibiliteSchema)
