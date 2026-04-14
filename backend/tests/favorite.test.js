import request from 'supertest';
import app from '../app.js';
import favoriteModel from '../models/favorite.model.js';
import userModel from '../models/user.model.js';
import hebergementModel from '../models/hebergement.model.js';
import jwt from 'jsonwebtoken';

jest.mock('../models/favorite.model.js');
jest.mock('../models/user.model.js');
jest.mock('../models/hebergement.model.js');
jest.mock('../services/auth.service.js', () => ({
  verifyToken: jest.fn(),
  findUserById: jest.fn()
}));

import { verifyToken, findUserById } from '../services/auth.service.js';

describe('Favorite Routes', () => {
  let authToken;
  const mockUserId = '64a1234567890abcdef12345';
  const mockHebergementId = '64b1234567890abcdef12345';

  beforeEach(() => {
    jest.clearAllMocks();

    // Generate a mock JWT token
    authToken = jwt.sign({ id: mockUserId, email: 'test@example.com' }, process.env.JWT_SECRET || 'test-secret');

    // Mock auth service functions


  });

  describe('POST /api/favorites/', () => {
    it('should return 400 if hebergementId is missing', async () => {
      // verifyToken.mockReturnValue({ id: mockUserId, email: 'test@example.com' });
      // findUserById.mockResolvedValue({
      //   _id: mockUserId,
      //   email: 'test@example.com',
      //   name: 'Test User',
      //   role: 'USER'
      // });
      const res = await request(app)
        .post('/api/favorites/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('400');
      expect(res.body.message).toContain('required');
    });

    it('should add a favorite successfully', async () => {
      const mockFavorite = {
        _id: '64c1234567890abcdef12345',
        user: mockUserId,
        hebergement: mockHebergementId,
        addedAt: new Date()
      };

      favoriteModel.create = jest.fn().mockResolvedValue(mockFavorite);

      const res = await request(app)
        .post('/api/favorites/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ hebergementId: mockHebergementId });

      expect(res.statusCode).toBe(201);
      expect(res.body.code).toBe('201');
      expect(res.body.data).toEqual(mockFavorite);
    });

    it('should return 409 if favorite already exists', async () => {
      const duplicateError = new Error('Duplicate key');
      duplicateError.code = 11000;

      favoriteModel.create = jest.fn().mockRejectedValue(duplicateError);

      const res = await request(app)
        .post('/api/favorites/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ hebergementId: mockHebergementId });

      expect(res.statusCode).toBe(409);
      expect(res.body.code).toBe('409');
      expect(res.body.message).toContain('already in your favorites');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/favorites/')
        .send({ hebergementId: mockHebergementId });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/favorites/', () => {
    it('should return all favorites for the user', async () => {
      const mockFavorites = [
        {
          _id: '64c1234567890abcdef12345',
          user: mockUserId,
          hebergement: { _id: mockHebergementId, nom: 'Test Hebergement' },
          addedAt: new Date()
        }
      ];

      favoriteModel.find = jest.fn(() => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockFavorites)
      }));

      const res = await request(app)
        .get('/api/favorites/')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe('200');
      expect(res.body.data).toEqual(mockFavorites);
    });

    it('should return empty array if no favorites', async () => {
      favoriteModel.find = jest.fn(() => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      }));

      const res = await request(app)
        .get('/api/favorites/')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe('200');
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/favorites/check/:hebergementId', () => {
    it('should return true if hebergement is in favorites', async () => {
      favoriteModel.findOne = jest.fn(() => ({
        exec: jest.fn().mockResolvedValue({ _id: '64c1234567890abcdef12345' })
      }));

      const res = await request(app)
        .get(`/api/favorites/check/${mockHebergementId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe('200');
      expect(res.body.data.isFavorite).toBe(true);
    });

    it('should return false if hebergement is not in favorites', async () => {
      favoriteModel.findOne = jest.fn(() => ({
        exec: jest.fn().mockResolvedValue(null)
      }));

      const res = await request(app)
        .get(`/api/favorites/check/${mockHebergementId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe('200');
      expect(res.body.data.isFavorite).toBe(false);
    });
  });

  describe('DELETE /api/favorites/:hebergementId', () => {
    it('should remove a favorite successfully', async () => {
      favoriteModel.findOneAndDelete = jest.fn(() => ({
        exec: jest.fn().mockResolvedValue({ _id: '64c1234567890abcdef12345' })
      }));

      const res = await request(app)
        .delete(`/api/favorites/${mockHebergementId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe('200');
      expect(res.body.message).toBe('Favorite removed successfully');
    });

    it('should return 404 if favorite not found', async () => {
      favoriteModel.findOneAndDelete = jest.fn(() => ({
        exec: jest.fn().mockResolvedValue(null)
      }));

      const res = await request(app)
        .delete(`/api/favorites/${mockHebergementId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.code).toBe('404');
      expect(res.body.message).toBe('Favorite not found');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .delete(`/api/favorites/${mockHebergementId}`);

      expect(res.statusCode).toBe(401);
    });
  });
});
