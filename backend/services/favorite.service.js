// services/favorite.service.js
import Favorite from '../models/favorite.model.js';

/**
 * Add a favorite for a user
 * @param {string} userId - User ID
 * @param {string} hebergementId - Hebergement ID
 * @returns {Promise<Object>} Created favorite
 */
export async function addFavorite(userId, hebergementId) {
    if (!userId) {
        throw new Error('User ID is required');
    }
    if (!hebergementId) {
        throw new Error('Hebergement ID is required');
    }

    const favorite = await Favorite.create({
        user: userId,
        hebergement: hebergementId
    });

    return favorite;
}

/**
 * Remove a favorite for a user
 * @param {string} userId - User ID
 * @param {string} hebergementId - Hebergement ID
 * @returns {Promise<boolean>} True if removed, false otherwise
 */
export async function removeFavorite(userId, hebergementId) {
    if (!userId) {
        throw new Error('User ID is required');
    }
    if (!hebergementId) {
        throw new Error('Hebergement ID is required');
    }

    const result = await Favorite.findOneAndDelete({
        user: userId,
        hebergement: hebergementId
    }).exec();

    return !!result;
}

/**
 * Get all favorites for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of favorites
 */
export async function getUserFavorites(userId) {
    if (!userId) {
        throw new Error('User ID is required');
    }

    const favorites = await Favorite.find({ user: userId })
        .populate('hebergement')
        .exec();

    return favorites;
}

/**
 * Check if a hebergement is in user's favorites
 * @param {string} userId - User ID
 * @param {string} hebergementId - Hebergement ID
 * @returns {Promise<boolean>} True if favorite exists
 */
export async function isFavorite(userId, hebergementId) {
    if (!userId) {
        throw new Error('User ID is required');
    }
    if (!hebergementId) {
        throw new Error('Hebergement ID is required');
    }

    const favorite = await Favorite.findOne({
        user: userId,
        hebergement: hebergementId
    }).exec();

    return !!favorite;
}
