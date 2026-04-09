import jwt from 'jsonwebtoken';
import userModel from '../models/user.model';

export async function verifyToken(req, res, next) {
    try {
        const token = req.header("Authorization")?.replace('Bearer', '');
        if (!token) {
            return res.status(401).json({ message: 'Accès refusé. Token requis.' })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id)
        if (!user){
            return res.status(404).json({ message: 'Utilisateur non retrouvé' })
        }
        req.user=user
        next()

    }
    catch {
        res.status(500).json({ message: 'Error system' })
    }

}