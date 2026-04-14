import userModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const PASSWORD_MIN_LENGTH = 8;
const TOKEN_EXPIRATION = '3h';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Created user data
 */
export async function register(userData) {
    // //Missing email or password
    if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
    }
    // Validate password length
    if (!userData.password || userData.password.length < PASSWORD_MIN_LENGTH) {
        throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = await userModel.create({
        ...userData,
        password: hashedPassword
    });

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };
}

/**
 * Authenticate user and generate token
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Token and user info
 */
export async function login(email, password) {
    if (!email || !password) {
        throw new Error('Email and password are required');
    }

    // Find user with password (select: false in schema, so we need to explicitly request it)
    const user = await userModel.findOne({ email }).select('+password').exec();

    if (!user) {
        throw new Error('Invalid email');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error('Invalid password');
    }

    // Generate token
    const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: TOKEN_EXPIRATION
    });

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Find user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object|null>} User or null
 */
export async function findUserById(id) {
    return userModel.findById(id).exec();
}
