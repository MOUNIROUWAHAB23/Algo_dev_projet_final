import request from 'supertest';
import app from '../app.js';
import userModel from '../models/user.model.js';
import jwt from 'jsonwebtoken';

jest.mock('../models/user.model.js');

describe('User Routes', () => {
  const generateToken = (payload = {}) => {
    return jwt.sign(
      {
        id: '123456',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        ...payload
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup proper mocks for mongoose methods
    userModel.findById = jest.fn(() => ({
      exec: jest.fn()
    }));
  });

  describe('POST /api/users/getuser', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post('/api/users/getuser')
        .send({ id: '123456' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Token required');
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .post('/api/users/getuser')
        .set('Authorization', 'Bearer invalid-token')
        .send({ id: '123456' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Invalid or expired token');
    });

    it('should return 404 if user not found', async () => {
      const token = generateToken();
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app)
        .post('/api/users/getuser')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: '123456' });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should return user data successfully', async () => {
      const token = generateToken();
      const mockUser = {
        _id: '123456',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        isVerified: true,
        createdAt: new Date()
      };

      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      const res = await request(app)
        .post('/api/users/getuser?id=123456')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('200');
      expect(res.body.data).toEqual({
        id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        isVerified: mockUser.isVerified,
        createdAt: mockUser.createdAt.toISOString()
      });
    });

    it('should return 400 if user ID is missing', async () => {
      const token = generateToken();
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app)
        .post('/api/users/getuser')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    it('should return 500 on server error', async () => {
      const token = generateToken();
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const res = await request(app)
        .post('/api/users/getuser')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: '123456' });

      expect(res.statusCode).toBe(500);
      expect(res.body.code).toBe('500');
    });
  });
});
