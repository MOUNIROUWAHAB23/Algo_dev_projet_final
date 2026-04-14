// routes/favorite.route.js
import express from 'express';
import {
    addFavoriteHandler,
    removeFavoriteHandler,
    getUserFavoritesHandler,
    checkFavoriteHandler
} from '../controllers/favorite.controller.js';
import { authenticateToken, loadUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken, loadUser);

// POST /api/favorites - Ajouter un favori
router.post('/', addFavoriteHandler);

// GET /api/favorites - Récupérer tous les favoris de l'utilisateur
router.get('/', getUserFavoritesHandler);

// GET /api/favorites/check/:hebergementId - Vérifier si un hébergement est en favori
router.get('/check/:hebergementId', checkFavoriteHandler);

// DELETE /api/favorites/:hebergementId - Supprimer un favori
router.delete('/:hebergementId', removeFavoriteHandler);

export default router;
