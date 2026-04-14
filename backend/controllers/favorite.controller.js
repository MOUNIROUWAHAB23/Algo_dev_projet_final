// controllers/favorite.controller.js
import {
    addFavorite,
    removeFavorite,
    getUserFavorites,
    isFavorite
} from '../services/favorite.service.js';

export async function addFavoriteHandler(req, res) {
    try {
        const { hebergementId } = req.body;
        const userId = req.user.id;

        if (!hebergementId) {
            return res.status(400).json({
                code: '400',
                message: 'Hebergement ID is required'
            });
        }

        const favorite = await addFavorite(userId, hebergementId);

        return res.status(201).json({
            code: '201',
            data: favorite
        });

    } catch (error) {
        if (error.message.includes('required')) {
            return res.status(400).json({
                code: '400',
                message: error.message
            });
        }
        if (error.code === 11000) {
            return res.status(409).json({
                code: '409',
                message: 'This hebergement is already in your favorites'
            });
        }
        return res.status(500).json({
            code: '500',
            message: error.message
        });
    }
}

export async function removeFavoriteHandler(req, res) {
    try {
        const { hebergementId } = req.params;
        const userId = req.user.id;

        if (!hebergementId) {
            return res.status(400).json({
                code: '400',
                message: 'Hebergement ID is required'
            });
        }

        const removed = await removeFavorite(userId, hebergementId);

        if (!removed) {
            return res.status(404).json({
                code: '404',
                message: 'Favorite not found'
            });
        }

        return res.status(200).json({
            code: '200',
            message: 'Favorite removed successfully'
        });

    } catch (error) {
        if (error.message.includes('required')) {
            return res.status(400).json({
                code: '400',
                message: error.message
            });
        }
        return res.status(500).json({
            code: '500',
            message: error.message
        });
    }
}

export async function getUserFavoritesHandler(req, res) {
    try {
        const userId = req.user.id;

        const favorites = await getUserFavorites(userId);

        return res.status(200).json({
            code: '200',
            data: favorites
        });

    } catch (error) {
        if (error.message.includes('required')) {
            return res.status(400).json({
                code: '400',
                message: error.message
            });
        }
        return res.status(500).json({
            code: '500',
            message: error.message
        });
    }
}

export async function checkFavoriteHandler(req, res) {
    try {
        const { hebergementId } = req.params;
        const userId = req.user.id;

        if (!hebergementId) {
            return res.status(400).json({
                code: '400',
                message: 'Hebergement ID is required'
            });
        }

        const isFav = await isFavorite(userId, hebergementId);

        return res.status(200).json({
            code: '200',
            data: { isFavorite: isFav }
        });

    } catch (error) {
        if (error.message.includes('required')) {
            return res.status(400).json({
                code: '400',
                message: error.message
            });
        }
        return res.status(500).json({
            code: '500',
            message: error.message
        });
    }
}
