const request = require('supertest');
const express = require('express');
const adminRoutes = require('../routes/admin-routes');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const RoleChange = require('../models/RoleChange');

// Mock the models
jest.mock('../models/User');
jest.mock('../models/ServiceRequest');
jest.mock('../models/RoleChange');

describe('Admin Routes', () => {
  let app;

  beforeAll(() => {
    // create express app and use admin routes
    app = express();
    app.use(express.json());
    app.use('/', adminRoutes);
  });

  beforeEach(() => {
    // clear all mocks between tests
    jest.clearAllMocks();
  });

  describe('GET /stats', () => {
    it('should return admin dashboard statistics', async () => {
      // database counts mock
      User.countDocuments.mockResolvedValue(42);
      ServiceRequest.countDocuments.mockResolvedValue(100);
      RoleChange.countDocuments.mockResolvedValue(5);

      const response = await request(app).get('/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        numUsers: 42,
        numServiceReqs: 100,
        numRoleChangeReqs: 5
      });

      // correct queries check
      expect(User.countDocuments).toHaveBeenCalledWith({ role: { $ne: 'admin' } });
      expect(ServiceRequest.countDocuments).toHaveBeenCalledWith();
      expect(RoleChange.countDocuments).toHaveBeenCalledWith({ status: 'pending' });
    });

    it('should handle database errors', async () => {
      // database error mock
      User.countDocuments.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/stats');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: 'Error fetching info'
      });
    });

    it('should only count non-admin users', async () => {
      // counts with specific user count verification 
      User.countDocuments.mockImplementation((query) => {
        // query excludes admin users check
        expect(query).toEqual({ role: { $ne: 'admin' } });
        return Promise.resolve(42);
      });
      ServiceRequest.countDocuments.mockResolvedValue(100);
      RoleChange.countDocuments.mockResolvedValue(5);

      await request(app).get('/stats');

      // query verification happens in the mock implementation above
    });

    it('should only count pending role change requests', async () => {
      User.countDocuments.mockResolvedValue(42);
      ServiceRequest.countDocuments.mockResolvedValue(100);
      RoleChange.countDocuments.mockImplementation((query) => {
        // only counting pending requests check
        expect(query).toEqual({ status: 'pending' });
        return Promise.resolve(5);
      });

      await request(app).get('/stats');

      // query verification happens in the mock implementation above
    });
  });
});