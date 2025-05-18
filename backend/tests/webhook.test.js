const request = require('supertest');
const express = require('express');
const webhookRouter = require('../routes/webhook'); // Import your router file
const webhookController = require('../controllers/webhookController');

// Mock the controller to isolate router testing
jest.mock('../controllers/webhookController');

describe('Webhook Router', () => {
  let app;

  beforeAll(() => {
    // creat an express app and use our router
    app = express();
    app.use(express.json()); // parsing application/json
    app.use('/webhooks', webhookRouter); // mount router @ /webhooks
  });

  beforeEach(() => {
    // clear all mock calls between tests
    jest.clearAllMocks();
  });

  describe('POST /webhooks/paystack', () => {
    it('should route to handlePaystackWebhook controller', async () => {
      // controller function mock
      webhookController.handlePaystackWebhook.mockImplementation((req, res) => {
        res.status(200).json({ message: 'Mock response' });
      });

      // test request to the route
      const response = await request(app)
        .post('/webhooks/paystack')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');

      // tresponse check
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ message: 'Mock response' });

      // controller was called check
      expect(webhookController.handlePaystackWebhook).toHaveBeenCalledTimes(1);
    });

    it('should pass the request body to the controller', async () => {
      const testBody = { event: 'charge.success', data: { amount: 5000 } };

      // controller verify the request body
      webhookController.handlePaystackWebhook.mockImplementation((req, res) => {
        expect(req.body).toEqual(testBody);
        res.status(200).send();
      });

      await request(app)
        .post('/webhooks/paystack')
        .send(testBody)
        .set('Content-Type', 'application/json');

      expect(webhookController.handlePaystackWebhook).toHaveBeenCalledTimes(1);
    });

    it('should pass headers to the controller', async () => {
      const testHeaders = {
        'x-paystack-signature': 'test-signature',
        'content-type': 'application/json'
      };

      // controller to verify headers
      webhookController.handlePaystackWebhook.mockImplementation((req, res) => {
        expect(req.headers['x-paystack-signature']).toBe('test-signature');
        res.status(200).send();
      });

      await request(app)
        .post('/webhooks/paystack')
        .send({})
        .set(testHeaders);

      expect(webhookController.handlePaystackWebhook).toHaveBeenCalledTimes(1);
    });

    it('should handle errors thrown by the controller', async () => {
      // controller to throw an error 
      webhookController.handlePaystackWebhook.mockImplementation(() => {
        throw new Error('Test error');
      });

      const response = await request(app)
        .post('/webhooks/paystack')
        .send({})
        .set('Content-Type', 'application/json');

      // error is handled check (Express will send 500 by default)
      expect(response.statusCode).toBe(500);
    });
  });
});