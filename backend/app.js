import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import user from './routes/user.route.js';
import auth from './routes/auth.route.js';
import hebergement from './routes/hebergement.route.js';
import rateLimiter from './middlewares/rate-limiter.js';
import {db} from './config/db.js';


const app = express();

app.use(cors());

app.use(rateLimiter);

app.use(express.json());
db();
app.use('/api/auth/',auth)
app.use('/api/users/',user)
app.use('/api/hebergement/',hebergement)

export default app