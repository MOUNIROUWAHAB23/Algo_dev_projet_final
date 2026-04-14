import request from 'supertest';
import app from '../app.js';
import userModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';

jest.mock('../models/user.model.js');

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup proper mocks for mongoose methods
    userModel.create = jest.fn();
    userModel.findOne = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      exec: jest.fn()
    }));
  });

  describe('POST /api/auth/sign-up', () => {
    it('should return 400 if password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/sign-up')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('400');
      expect(res.body.message).toContain('Password must be at least');
    });

    it('should return 400 if email or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/sign-up')
        .send({
          name: 'John Doe',
          email: 'john@example.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should create user successfully', async () => {
      const mockUser = {
        _id: '123456',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER'
      };

      userModel.create.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/sign-up')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.code).toBe('201');
      expect(res.body.data).toEqual({
        id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role
      });
    });

    it('should return 500 on server error', async () => {
      userModel.create.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/api/auth/sign-up')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.code).toBe('500');
    });
  });

  describe('POST /api/auth/sign-in', () => {
    it('should return 400 if email or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/sign-in')
        .send({
          email: 'john@example.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should return 400 if user not found', async () => {
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app)
        .post('/api/auth/sign-in')
        .send({
          email: 'notfound@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid email');
    });

    it('should return 400 if password is invalid', async () => {
      const mockUser = {
        _id: '123456',
        name: 'John Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('correctpassword', 10),
        role: 'USER'
      };

      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      const res = await request(app)
        .post('/api/auth/sign-in')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid password');
    });

    it('should authenticate successfully and return token', async () => {
      const mockUser = {
        _id: '123456',
        name: 'John Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'USER'
      };

      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      const res = await request(app)
        .post('/api/auth/sign-in')
        .send({
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe('200');
      expect(res.body.message).toBe('Authentication successful');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toEqual({
        id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role
      });
    });

    it('should return 500 on server error', async () => {
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const res = await request(app)
        .post('/api/auth/sign-in')
        .send({
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.code).toBe('500');
    });
  });
});
