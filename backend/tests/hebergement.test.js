import request from 'supertest';
import app from '../app.js';
import hebergementModel from '../models/hebergement.model.js';

jest.mock('../models/hebergement.model.js');

describe('Hebergement Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup proper mocks for mongoose methods
    hebergementModel.find = jest.fn(() => ({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn()
    }));
    hebergementModel.findById = jest.fn(() => ({
      exec: jest.fn()
    }));
  });

  describe('GET /api/hebergement/', () => {
    it('should return 400 if limit > 100', async () => {
      const res = await request(app).get('/api/hebergement/?limit=150');

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Limit cannot exceed 100');
    });

    it('should return 400 for invalid type', async () => {
      const res = await request(app).get('/api/hebergement/?type=invalid');

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid type');
    });

    it('should apply q filter (text search)', async () => {
      hebergementModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ _id: '1', nom: 'Hotel Paris' }])
      });

      const res = await request(app).get('/api/hebergement/?q=paris');

      expect(res.statusCode).toBe(200);
      expect(hebergementModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.any(Array)
        })
      );
    });

    it('should apply region filter', async () => {
      hebergementModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
      { _id: "1", nom: "Hôtel Paris Luxe", type: "Hôtel" },
      { _id: "2", nom: "Appartement Paris Centre", type: "Appartement" }
    ])
      });

      const res = await request(app).get('/api/hebergement/?region=ile');

      expect(res.statusCode).toBe(200);
      expect(hebergementModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'localisation.region': { $regex: 'ile', $options: 'i' }
        })
      );
    });

    it('should apply classification filter', async () => {
      hebergementModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
      { _id: "1", nom: "Hôtel Paris Luxe", type: "Hôtel" },
      { _id: "2", nom: "Appartement Paris Centre", type: "Appartement" }
    ])
      });

      const res = await request(app).get('/api/hebergement/?classification=4');

      expect(res.statusCode).toBe(200);
      expect(hebergementModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          classification: '4'
        })
      );
    });

    it('should apply geolocation filter', async () => {
      hebergementModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
      { _id: "1", nom: "Hôtel Paris Luxe", type: "Hôtel" },
      { _id: "2", nom: "Appartement Paris Centre", type: "Appartement" }
    ])
      });

      const res = await request(app).get('/api/hebergement/?lat=48.85&long=2.35&radius=10');

      expect(res.statusCode).toBe(200);
      expect(hebergementModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'localisation.coordinates': expect.objectContaining({
            $near: expect.any(Object)
          })
        })
      );
    });

    it('should return 200 and data on success', async () => {
      const mockData = [{ _id: '1', nom: 'Hotel Paris', type: 'HOTEL' }];
      hebergementModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockData)
      });

      const res = await request(app).get('/api/hebergement/');

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe('200');
      expect(res.body.data).toEqual(mockData);
    });

    it('should return 400 when no data found', async () => {
      hebergementModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });

      const res = await request(app).get('/api/hebergement/');

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Data not found');
    });

    it('should return 500 on server error', async () => {
      hebergementModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const res = await request(app).get('/api/hebergement/');

      expect(res.statusCode).toBe(500);
      expect(res.body.code).toBe('500');
    });
  });

  describe('GET /api/hebergement/getById', () => {
    it('should return 400 if id is missing', async () => {
      const res = await request(app).get('/api/hebergement/getById');

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Id is required');
    });

    it('should return 404 if hebergement not found', async () => {
      hebergementModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app).get('/api/hebergement/getById?id=123456');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Hebergement not found');
    });

    it('should return hebergement data on success', async () => {
      const mockData = {
        _id: '123456',
        nom: 'Hotel Paris',
        type: 'HOTEL',
        localisation: {
          adresse: '123 Rue de Paris',
          code_postal: '75001',
          commune: 'Paris',
          departement: 'Paris',
          region: 'Ile-de-France'
        }
      };

      hebergementModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockData)
      });

      const res = await request(app).get('/api/hebergement/getById?id=123456');

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe('200');
      expect(res.body.data).toEqual(mockData);
    });

    it('should return 500 on server error', async () => {
      hebergementModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const res = await request(app).get('/api/hebergement/getById?id=123456');

      expect(res.statusCode).toBe(500);
      expect(res.body.code).toBe('500');
    });
  });
});
