import { register, login, verifyToken, findUserById } from '../services/auth.service.js';
import userModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../models/user.model.js');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup proper mocks for mongoose methods
    userModel.create = jest.fn();
    userModel.findOne = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      exec: jest.fn()
    }));
    userModel.findById = jest.fn(() => ({
      exec: jest.fn()
    }));
  });

  describe('register', () => {
    it('should throw error if password is too short', async () => {
      await expect(register({
        name: 'John',
        email: 'john@example.com',
        password: '123'
      })).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should throw error if password is missing', async () => {
      await expect(register({
        name: 'John',
        email: 'john@example.com'
      })).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should hash password and create user', async () => {
      const mockUser = {
        _id: '123456',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER'
      };

      userModel.create.mockResolvedValue(mockUser);

      const result = await register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      expect(userModel.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: expect.any(String)
      });

      const hashedPassword = userModel.create.mock.calls[0][0].password;
      expect(await bcrypt.compare('password123', hashedPassword)).toBe(true);

      expect(result).toEqual({
        id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role
      });
    });
  });

  describe('login', () => {
    it('should throw error if email is missing', async () => {
      await expect(login(null, 'password123'))
        .rejects.toThrow('Email and password are required');
    });

    it('should throw error if password is missing', async () => {
      await expect(login('john@example.com', null))
        .rejects.toThrow('Email and password are required');
    });

    it('should throw error if user not found', async () => {
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(login('notfound@example.com', 'password123'))
        .rejects.toThrow('Invalid email');
    });

    it('should throw error if password is invalid', async () => {
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

      await expect(login('john@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid password');
    });

    it('should return token and user on successful login', async () => {
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

      const result = await login('john@example.com', 'password123');

      expect(result).toHaveProperty('token');
      expect(jwt.verify(result.token, process.env.JWT_SECRET || 'test-secret')).toBeDefined();
      expect(result.user).toEqual({
        id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role
      });
    });
  });

  describe('verifyToken', () => {
    it('should return decoded payload for valid token', () => {
      const payload = { id: '123456', name: 'John', email: 'john@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

      const result = verifyToken(token);

      expect(result.id).toBe(payload.id);
      expect(result.name).toBe(payload.name);
      expect(result.email).toBe(payload.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token'))
        .toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { id: '123456' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      expect(() => verifyToken(expiredToken))
        .toThrow('Invalid or expired token');
    });
  });

  describe('findUserById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        _id: '123456',
        name: 'John Doe',
        email: 'john@example.com'
      };

      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await findUserById('123456');

      expect(userModel.findById).toHaveBeenCalledWith('123456');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      const result = await findUserById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
