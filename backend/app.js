import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import auth from './routes/auth.route.js';
import hebergementModel from './models/hebergement.model.js';
import userModel from './models/user.model.js';



const app = express();

app.use(cors());

app.use(express.json());
mongoose.connect(process.env.MONGO_URI)
app.use('/api/auth/',auth)

const PORT = process.env.PORT || 3500;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})