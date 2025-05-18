const request = require('supertest');
const express = require('express');
const axios = require('axios');
const ServiceRequest = require('../models/ServiceRequest');
const paymentRoutes = require('../routes/payment-routes');

// Mock all external dependencies
jest.mock('axios');
jest.mock('../models/ServiceRequest');

describe('Payment Routes', () => {
  let app;
  const mockServiceRequest = {
    _id: 'job123',
    price: 10000, // $100.00
    progressActual: 50,
    progressPaid: 30,
    save: jest.fn()
  };

  // Setup test environment before all tests
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(paymentRoutes);
    
    // Set required environment variables
    process.env.PAYSTACK_SECRET_KEY = 'test_secret_key';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.NODE_ENV = 'test';
  });

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for ServiceRequest
    ServiceRequest.findById.mockResolvedValue(mockServiceRequest);
  });

  describe('POST /create-checkout-session', () => {
    it('should return checkout URL for valid payment request', async () => {
      // Paystack API response mock
      axios.post.mockResolvedValue({
        data: {
          status: true,
          data: {
            authorization_url: 'https://paystack.com/checkout/123'
          }
        }
      });

      const response = await request(app)
        .post('/create-checkout-session')
        .send({
          email: 'client@example.com',
          jobId: 'job123'
        });

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('checkoutUrl');
      
      // Verify Paystack was called correctly
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.paystack.co/transaction/initialize',
        expect.objectContaining({
          email: 'client@example.com',
          amount: 200000, 
          metadata: expect.objectContaining({
            serviceRequestId: 'job123'
          })
        }),
        expect.any(Object)
      );
    });

    it('should return 400 if email or jobId is missing', async () => {
      const response = await request(app)
        .post('/create-checkout-session')
        .send({}); // request body empty

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and amount are required');
    });

    it('should return 400 if no payment is due', async () => {
      // service request with no progress difference mock
      ServiceRequest.findById.mockResolvedValueOnce({
        ...mockServiceRequest,
        progressActual: 30,
        progressPaid: 30
      });

      const response = await request(app)
        .post('/create-checkout-session')
        .send({
          email: 'client@example.com',
          jobId: 'job123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No payment due');
    });

    it('should return 500 if Paystack API fails', async () => {
      // Paystack API failure mock
      axios.post.mockResolvedValue({
        data: {
          status: false,
          message: 'API error'
        }
      });

      const response = await request(app)
        .post('/create-checkout-session')
        .send({
          email: 'client@example.com',
          jobId: 'job123'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error initializing Paystack transaction');
    });

    it('should return 500 if database lookup fails', async () => {
      // database failure mock
      ServiceRequest.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/create-checkout-session')
        .send({
          email: 'client@example.com',
          jobId: 'job123'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal Server Error');
    });

    it('should use production frontend URL in production environment', async () => {
      // switch to production environment
      process.env.NODE_ENV = 'production';
      process.env.FRONTEND_URL = 'https://production.example.com';
      
      axios.post.mockResolvedValue({
        data: {
          status: true,
          data: {
            authorization_url: 'https://paystack.com/checkout/123'
          }
        }
      });

      await request(app)
        .post('/create-checkout-session')
        .send({
          email: 'client@example.com',
          jobId: 'job123'
        });

      // Paystack callback URL uses production frontend check
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          callback_url: 'https://production.example.com/client/home'
        }),
        expect.any(Object)
      );
      
      // rest to test environment
      process.env.NODE_ENV = 'test';
    });
  });
});
