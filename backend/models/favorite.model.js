// models/favorite.model.js
import mongoose from 'mongoose';

const FavoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  hebergement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'hebergement',
    required: true
  },

  addedAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});


FavoriteSchema.index({ user: 1, hebergement: 1 }, { unique: true });

export default mongoose.model('Favorite', FavoriteSchema);
