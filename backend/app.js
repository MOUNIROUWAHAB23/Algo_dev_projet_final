import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.json' with { type: 'json' };

import user from './routes/user.route.js';
import auth from './routes/auth.route.js';
import hebergement from './routes/hebergement.route.js';
import favorite from './routes/favorite.route.js';
import rateLimiter from './middlewares/rate-limiter.js';
import {db} from './config/db.js';


const app = express();

app.use(cors());

app.use(rateLimiter);

app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
    db();
}
app.use('/api/auth/',auth)
app.use('/api/users/',user)
app.use('/api/hebergement/',hebergement)
app.use('/api/favorites/',favorite)

// Swagger UI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app