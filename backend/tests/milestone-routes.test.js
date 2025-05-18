const request = require('supertest');
const express = require('express');
const milestoneRouter = require('../routes/milestone-routes'); // router file import
const milestoneController = require('../controllers/milestoneController');

// controller functions mock
jest.mock('../controllers/milestoneController');

describe('Milestone Routes', () => {
  let app;

  beforeAll(() => {
    // create express app and use router
    app = express();
    app.use(express.json());
    app.use('/milestones', milestoneRouter); // mount the router
  });

  beforeEach(() => {
    // clear all mock calls between tests
    jest.clearAllMocks();
  });

  describe('POST /milestones/:jobId', () => {
    it('should route to createMilestones controller', async () => {
      const testJobId = '123';
      const testMilestones = [{ description: 'Test', dueDate: '2023-12-31' }];

      // controller response mock
      milestoneController.createMilestones.mockImplementation((req, res) => {
        res.status(201).json({ message: 'Created' });
      });

      const response = await request(app)
        .post(`/milestones/${testJobId}`)
        .send({ milestones: testMilestones })
        .set('Accept', 'application/json');

      expect(response.statusCode).toBe(201);
      expect(milestoneController.createMilestones).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({ message: 'Created' });
    });

    it('should pass correct parameters to controller', async () => {
      const testJobId = '456';
      const testMilestones = [{ description: 'Test 2', dueDate: '2023-11-30' }];

      let receivedReq;
      milestoneController.createMilestones.mockImplementation((req, res) => {
        receivedReq = req;
        res.status(201).send();
      });

      await request(app)
        .post(`/milestones/${testJobId}`)
        .send({ milestones: testMilestones });

      // route parameters and body passed correctly check
      expect(receivedReq.params.jobId).toBe(testJobId);
      expect(receivedReq.body.milestones).toEqual(testMilestones);
    });
  });

  describe('GET /milestones/job/:jobId', () => {
    it('should route to getMilestones controller', async () => {
      const testJobId = '789';

      // controller response
      milestoneController.getMilestones.mockImplementation((req, res) => {
        res.status(200).json([{ milestone: 'test' }]);
      });

      const response = await request(app)
        .get(`/milestones/job/${testJobId}`)
        .set('Accept', 'application/json');

      expect(response.statusCode).toBe(200);
      expect(milestoneController.getMilestones).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual([{ milestone: 'test' }]);
    });

    it('should pass jobId parameter to controller', async () => {
      const testJobId = '101112';

      let receivedReq;
      milestoneController.getMilestones.mockImplementation((req, res) => {
        receivedReq = req;
        res.status(200).send();
      });

      await request(app)
        .get(`/milestones/job/${testJobId}`);

      expect(receivedReq.params.jobId).toBe(testJobId);
    });
  });

  describe('PUT /milestones/complete/:milestoneId', () => {
    it('should route to markMilestoneAsCompleted controller', async () => {
      const testMilestoneId = '131415';

      // controller response mock
      milestoneController.markMilestoneAsCompleted.mockImplementation((req, res) => {
        res.status(200).json({ message: 'Completed' });
      });

      const response = await request(app)
        .put(`/milestones/complete/${testMilestoneId}`)
        .set('Accept', 'application/json');

      expect(response.statusCode).toBe(200);
      expect(milestoneController.markMilestoneAsCompleted).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({ message: 'Completed' });
    });

    it('should pass milestoneId parameter to controller', async () => {
      const testMilestoneId = '161718';

      let receivedReq;
      milestoneController.markMilestoneAsCompleted.mockImplementation((req, res) => {
        receivedReq = req;
        res.status(200).send();
      });

      await request(app)
        .put(`/milestones/complete/${testMilestoneId}`);

      expect(receivedReq.params.milestoneId).toBe(testMilestoneId);
    });
  });

  describe('Error Handling', () => {
    it('should handle controller errors', async () => {
      // controller to throw error
      milestoneController.getMilestones.mockImplementation(() => {
        throw new Error('Test error');
      });

      const response = await request(app)
        .get('/milestones/job/123');

      expect(response.statusCode).toBe(500);
    });
  });
});