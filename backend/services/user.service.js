import userModel from '../models/user.model.js';

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object|null>} User data or null
 */
export async function getUserById(id) {
    if (!id) {
        throw new Error('User ID is required');
    }

    const user = await userModel.findById(id).exec();

    if (!user) {
        return null;
    }

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
    };
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User data or null
 */
export async function getUserByEmail(email) {
    if (!email) {
        throw new Error('Email is required');
    }

    return userModel.findOne({ email }).exec();
}

/**
 * Update user by ID
 * @param {string} id - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>} Updated user or null
 */
export async function updateUser(id, updateData) {
    if (!id) {
        throw new Error('User ID is required');
    }

    const user = await userModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).exec();

    return user;
}

/**
 * Delete user by ID
 * @param {string} id - User ID
 * @returns {Promise<boolean>} True if deleted, false otherwise
 */
export async function deleteUser(id) {
    if (!id) {
        throw new Error('User ID is required');
    }

    const result = await userModel.findByIdAndDelete(id).exec();

    return !!result;
}
