import express from 'express';
import { getUser } from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protected route: requires authentication
router.post('/getuser', requireAuth, getUser);

export default router;
