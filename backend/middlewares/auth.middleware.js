import { verifyToken, findUserById } from '../services/auth.service.js';

/**
 * Middleware to verify JWT token
 * Decodes token and attaches payload to req.tokenPayload
 * Does NOT load user from database (use loadUser if needed)
 */
export async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                code: '401',
                message: 'Access denied. Token required.'
            });
        }

        const decoded = verifyToken(token);
        req.tokenPayload = decoded;
        next();

    } catch (error) {
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
            return res.status(401).json({
                code: '401',
                message: 'Invalid or expired token'
            });
        }
        return res.status(500).json({
            code: '500',
            message: 'Authentication error'
        });
    }
}

/**
 * Middleware to load user from database
 * Must be used after authenticateToken (requires req.tokenPayload)
 */
export async function loadUser(req, res, next) {
    try {
        if (!req.tokenPayload) {
            return res.status(401).json({
                code: '401',
                message: 'Token not verified. Call authenticateToken first.'
            });
        }

        const user = await findUserById(req.tokenPayload.id);

        if (!user) {
            return res.status(404).json({
                code: '404',
                message: 'User not found'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(500).json({
            code: '500',
            message: 'Error loading user'
        });
    }
}

/**
 * Combined middleware: authenticate + load user
 * For routes that need both
 */
export async function requireAuth(req, res, next) {
    await authenticateToken(req, res, (err) => {
        if (err) return;
        loadUser(req, res, next);
    });
}

/**
 * Middleware to check user role
 * Must be used after requireAuth or loadUser
 */
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                code: '401',
                message: 'User not loaded'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                code: '403',
                message: 'Insufficient permissions'
            });
        }

        next();
    };
}