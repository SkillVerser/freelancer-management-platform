const httpMocks = require('node-mocks-http');
const crypto = require('crypto');
const ServiceRequest = require('../models/ServiceRequest');
const { handlePaystackWebhook } = require('../controllers/webhookController');

// ServiceRequest model mock
jest.mock('../models/ServiceRequest');

// crypto module mock
jest.mock('crypto');

describe('Webhook Controller', () => {
  beforeEach(() => {
    // clear all mocks between tests
    jest.clearAllMocks();
  });

  describe('handlePaystackWebhook', () => {
    it('should reject requests with invalid signature', async () => {
      // invalid signature mock request setup
      const req = httpMocks.createRequest({
        headers: {
          'x-paystack-signature': 'invalid-signature'
        },
        body: { event: 'charge.success' }
      });
      const res = httpMocks.createResponse();

      // return a different hash crypto mock
      crypto.createHmac.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid-hash')
      });

      await handlePaystackWebhook(req, res);

      // response 
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Invalid signature'
      });
    });

    it('should handle charge.success event and update service request', async () => {
      // valid signature and charge.success event mock request
      const mockServiceRequestId = '12345';
      const mockProgressDelta = 25;
      const mockAmountDue = 5000;
      const mockAmount = 5000;

      const req = httpMocks.createRequest({
        headers: {
          'x-paystack-signature': 'valid-signature'
        },
        body: {
          event: 'charge.success',
          data: {
            amount: mockAmount,
            metadata: {
              serviceRequestId: mockServiceRequestId,
              progressDelta: mockProgressDelta,
              amountDue: mockAmountDue
            }
          }
        }
      });
      const res = httpMocks.createResponse();

      // return matching hash crypto mock
      crypto.createHmac.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid-signature')
      });

      // service request data
      const mockServiceRequest = {
        _id: mockServiceRequestId,
        paymentsPending: 10000,
        progressPaid: 25,
        paymentsMade: 5000,
        save: jest.fn().mockResolvedValue(true)
      };

      ServiceRequest.findById.mockResolvedValue(mockServiceRequest);

      await handlePaystackWebhook(req, res);

      // database operations
      expect(ServiceRequest.findById).toHaveBeenCalledWith(mockServiceRequestId);
      expect(mockServiceRequest.paymentsPending).toBe(10000 - mockAmountDue);
      expect(mockServiceRequest.progressPaid).toBe(25 + mockProgressDelta);
      expect(mockServiceRequest.paymentsMade).toBe(5000 + mockAmountDue);
      expect(mockServiceRequest.save).toHaveBeenCalled();

      // response
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Payment successful - database updated'
      });
    });

    it('should return 404 if service request not found', async () => {
      // valid request but with non-existent service request setup
      const req = httpMocks.createRequest({
        headers: {
          'x-paystack-signature': 'valid-signature'
        },
        body: {
          event: 'charge.success',
          data: {
            metadata: {
              serviceRequestId: 'non-existent-id'
            }
          }
        }
      });
      const res = httpMocks.createResponse();

      // return matching hash
      crypto.createHmac.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid-signature')
      });

      // service request not found mock
      ServiceRequest.findById.mockResolvedValue(null);

      await handlePaystackWebhook(req, res);

      // response check
      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Service request not found'
      });
    });

    it('should handle database errors during update', async () => {
      // valid request setup
      const req = httpMocks.createRequest({
        headers: {
          'x-paystack-signature': 'valid-signature'
        },
        body: {
          event: 'charge.success',
          data: {
            metadata: {
              serviceRequestId: '12345',
              progressDelta: 25,
              amountDue: 5000
            },
            amount: 5000
          }
        }
      });
      const res = httpMocks.createResponse();

      // return matching hash
      crypto.createHmac.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid-signature')
      });

      // service request with save error mock
      const mockServiceRequest = {
        _id: '12345',
        paymentsPending: 10000,
        progressPaid: 25,
        paymentsMade: 5000,
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      ServiceRequest.findById.mockResolvedValue(mockServiceRequest);

      await handlePaystackWebhook(req, res);

      // response check
      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Error updating service request'
      });
    });

    it('should return 200 for non-charge.success events', async () => {
      // request with different event type 
      const req = httpMocks.createRequest({
        headers: {
          'x-paystack-signature': 'valid-signature'
        },
        body: {
          event: 'subscription.create'
        }
      });
      const res = httpMocks.createResponse();

      // return matching hash
      crypto.createHmac.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid-signature')
      });

      await handlePaystackWebhook(req, res);

      // response check
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Webhook received'
      });
    });
  });
});