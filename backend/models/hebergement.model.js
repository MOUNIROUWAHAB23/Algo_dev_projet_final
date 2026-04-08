// models/etablissement.model.js
import mongoose from 'mongoose';


const HebergementSchema = new mongoose.Schema({

  hash_record: {
    type: String,
    required: true
  },

  capacite: {
    chambres: {
      type: Number,
      default: null
    },
    lits: {
      type: Number,
      required: true
    }
  },

  classification: {
    type: Number,
    default: null
  },

  contact: {
    telephone: {
      type: String,
      default: null
    },
    email: {
      type: String,
      default: null
    },
    site_web: {
      type: String,
      default: null
    }
  },

  equipements: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },

  identifiant_atout: {
    type: String,
    default: null
  },

  localisation: {
    adresse: {
      type: String,
      required: true
    },
    code_postal: {
      type: String,
      required: true
    },
    commune: {
      type: String,
      required: true,
      index: true
    },
    departement: {
      type: String,
      required: true
    },
    region: {
      type: String,
      required: true
    },

    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      }
    }
  },

  metadata: {
    source: {
      type: String,
      required: true
    },
    date_classement: {
      type: Date,
      required: true
    },
    imported_at: {
      type: Date,
      required: true
    }
  },

  nom: {
    type: String,
    required: true,
    index: true
  },

  type: {
    type: String,
    required: true,
    enum: ['HOTEL', 'APPARTEMENT', 'MAISON', 'AUTRE']
  }

}, {
  timestamps: true
});

export default mongoose.model('hebergement', HebergementSchema);