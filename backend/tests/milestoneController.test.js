const httpMocks = require('node-mocks-http');
const Milestone = require('../models/Milestone');
const ServiceRequest = require('../models/ServiceRequest');
const {
  createMilestones,
  getMilestones,
  markMilestoneAsCompleted
} = require('../controllers/milestoneController');

// mock mongoose models
jest.mock('../models/Milestone');
jest.mock('../models/ServiceRequest');

// main test suite
describe('Milestone Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


// test suite for createMilestones
  describe('createMilestones', () => {
    it('should create milestones for a valid job', async () => {
        // set up mock request with job Id and milestone data
      const req = httpMocks.createRequest({
        params: { jobId: '123' },
        body: {
          milestones: [
            { description: 'Design phase', dueDate: '2023-12-01' },
            { description: 'Development phase', dueDate: '2023-12-15' }
          ]
        }
      });
      const res = httpMocks.createResponse();
      // mock database response
      ServiceRequest.findById.mockResolvedValue({ _id: '123' }); // mock job exist
      Milestone.insertMany.mockResolvedValue([ // successful milestone creation mock
        { _id: '1', description: 'Design phase', status: 'Pending' },
        { _id: '2', description: 'Development phase', status: 'Pending' }
      ]);


      // execute controller function
      await createMilestones(req, res);

      expect(ServiceRequest.findById).toHaveBeenCalledWith('123'); // job lookup
      expect(Milestone.insertMany).toHaveBeenCalled(); // milestone creation
      expect(res.statusCode).toBe(201); // verify success status code
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Milestones created successfully',
        milestones: expect.any(Array)
      });
    });

    //  request with invalid job ID

    it('should return 404 if job not found', async () => {
      const req = httpMocks.createRequest({
        params: { jobId: 'invalid' },
        body: { milestones: [] }
      });
      const res = httpMocks.createResponse();

      // job not found
      ServiceRequest.findById.mockResolvedValue(null);

      await createMilestones(req, res);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Job not found'
      });
    });

    it('should handle errors during milestone creation', async () => {
      // setup valid request
      const req = httpMocks.createRequest({
        params: { jobId: '123' },
        body: { milestones: [] }
      });
      const res = httpMocks.createResponse();

      // database error mock
      ServiceRequest.findById.mockResolvedValue({ _id: '123' });
      Milestone.insertMany.mockRejectedValue(new Error('Database error'));

      await createMilestones(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Error creating milestones',
        error: 'Database error'
      });
    });
  });

  // get milestones test suite
  describe('getMilestones', () => {
    it('should fetch milestones for a job', async () => {
      // setup request with job Id
      const req = httpMocks.createRequest({
        params: { jobId: '123' }
      });
      const res = httpMocks.createResponse();

      // milestones mock data
      const mockMilestones = [
        { _id: '1', description: 'Design', dueDate: new Date(), status: 'Pending' },
        { _id: '2', description: 'Development', dueDate: new Date(), status: 'Pending' }
      ];

      // chained mongoose calls mock
      Milestone.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockMilestones)
        })
      });

      await getMilestones(req, res);

      expect(Milestone.find).toHaveBeenCalledWith({ jobId: '123' });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockMilestones);
    });

    it('should handle errors when fetching milestones', async () => {
      // setup request
      const req = httpMocks.createRequest({
        params: { jobId: '123' }
      });
      const res = httpMocks.createResponse();

      // database error in chain mock
      Milestone.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      await getMilestones(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Error fetching milestones',
        error: 'Database error'
      });
    });
  });


  // test suite for marking milestones as complete
  describe('markMilestoneAsCompleted', () => {
    it('should mark a milestone as completed and update job progress', async () => {

      // request set up with milestone Id
      const req = httpMocks.createRequest({
        params: { milestoneId: '1' }
      });
      const res = httpMocks.createResponse();

      // milestone data mock with save function
      const mockMilestone = {
        _id: '1',
        jobId: '123',
        status: 'Pending',
        save: jest.fn().mockResolvedValue(true)
      };

      // job data mock
      const mockJob = {
        _id: '123',
        progressActual: 0,
        status: 'In Progress',
        save: jest.fn().mockResolvedValue(true)
      };

      Milestone.findById.mockResolvedValue(mockMilestone);
      Milestone.find.mockResolvedValue([
        { _id: '1', status: 'Completed' },
        { _id: '2', status: 'Pending' }
      ]);
      ServiceRequest.findById.mockResolvedValue(mockJob);

      await markMilestoneAsCompleted(req, res);

      expect(Milestone.findById).toHaveBeenCalledWith('1');
      expect(mockMilestone.status).toBe('Completed'); // status update
      expect(mockMilestone.save).toHaveBeenCalled();
      expect(ServiceRequest.findById).toHaveBeenCalledWith('123');
      expect(mockJob.progressActual).toBe(50); // progress calculation 
      expect(mockJob.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });

    it('should mark job as completed when all milestones are done', async () => {
      const req = httpMocks.createRequest({
        params: { milestoneId: '1' }
      });
      const res = httpMocks.createResponse();

      // mock data where all milestones will be completed

      const mockMilestone = {
        _id: '1',
        jobId: '123',
        status: 'Pending',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockJob = {
        _id: '123',
        progressActual: 50,
        status: 'In Progress',
        save: jest.fn().mockResolvedValue(true)
      };

      // completed state
      Milestone.findById.mockResolvedValue(mockMilestone);
      Milestone.find.mockResolvedValue([
        { _id: '1', status: 'Completed' },
        { _id: '2', status: 'Completed' }
      ]);
      ServiceRequest.findById.mockResolvedValue(mockJob);
      ServiceRequest.findByIdAndUpdate.mockResolvedValue({
        ...mockJob,
        status: 'Completed'
      });

      await markMilestoneAsCompleted(req, res);

      // job completion update
      expect(ServiceRequest.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { status: 'Completed' },
        { new: true }
      );
      expect(res.statusCode).toBe(200);
    });

    it('should return 404 if milestone not found', async () => {
      // request with invalid milestone Id
      const req = httpMocks.createRequest({
        params: { milestoneId: 'invalid' }
      });
      const res = httpMocks.createResponse();

      // milestone not found
      Milestone.findById.mockResolvedValue(null);

      await markMilestoneAsCompleted(req, res);

      // 404 ressponse 
      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Milestone not found'
      });
    });

    it('should handle errors during milestone completion', async () => {
      const req = httpMocks.createRequest({
        params: { milestoneId: '1' }
      });
      const res = httpMocks.createResponse();

      Milestone.findById.mockRejectedValue(new Error('Database error'));

      await markMilestoneAsCompleted(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Error marking milestone as completed',
        error: 'Database error'
      });
    });
  });
});