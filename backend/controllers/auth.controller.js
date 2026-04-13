import { register, login } from '../services/auth.service.js';

export async function signUp(req, res) {
    try {
        const user = await register(req.body);

        return res.status(201).json({
            code: '201',
            message: 'User created successfully',
            data: user
        });

    } catch (error) {
        if (error.message.includes('Password') || error.message.includes('required')) {
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

export async function signIn(req, res) {
    try {
        const { email, password } = req.body;
        const { token, user } = await login(email, password);

        return res.status(200).json({
            code: '200',
            message: 'Authentication successful',
            data: { token, user }
        });

    } catch (error) {
        if (error.message.includes('Invalid') || error.message.includes('required')) {
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