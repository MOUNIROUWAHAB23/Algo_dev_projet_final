import { getUserById } from '../services/user.service.js';

export async function getUser(req, res) {
    try {
        const { id } = req.query;
        const user = await getUserById(id);

        if (!user) {
            return res.status(404).json({
                code: '404',
                message: 'User not found'
            });
        }

        return res.status(200).json({
            code: '200',
            data: user
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