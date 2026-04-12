import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import auth from './routes/auth.route.js';
import hebergementModel from './models/hebergement.model.js';
import userModel from './models/user.model.js';
import hebergement from './routes/hebergement.route.js';
import rateLimiter from './middlewares/rate-limiter.js';


const app = express();

app.use(cors());

app.use(rateLimiter);

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)

app.use('/api/auth/',auth)
app.use('/api/hebergement/',hebergement)

export default app