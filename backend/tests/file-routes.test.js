
const request = require('supertest');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

jest.mock('multer');
jest.mock('fs'); 
jest.mock('../models/File');
jest.mock('../models/ServiceRequest');

// mocked versions of our modules
const File = require('../models/File');
const ServiceRequest = require('../models/ServiceRequest');
const fileRoutes = require('./file-routes');

describe('File Routes API', () => {
  let app;
  const mockUserId = 'user123';
  const mockJobId = 'job123';
  const mockFileId = 'file123';
  
  // sample mock file data that will be used across tests
  const mockFile = {
    _id: mockFileId,
    jobId: mockJobId,
    filename: 'test-file.txt',
    originalName: 'test-file.txt',
    fileSize: 1024,
    contentType: 'text/plain',
    storagePath: '/uploads/test-file.txt',
    save: jest.fn().mockResolvedValue(true),
    createdAt: new Date()
  };

  // express app setup with routes before all tests
  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // mock authentication middleware that adds a user to the request
    app.use((req, res, next) => {
      req.user = { _id: mockUserId };
      next();
    });
    
    app.use(fileRoutes);
  });

  // Reset all mocks between tests to ensure clean state
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations:
    
    // ServiceRequest.findById - returns job only if ID matches mockJobId
    ServiceRequest.findById.mockImplementation((id) => {
      return id === mockJobId ? { _id: mockJobId } : null;
    });

    // file.findById - returns file only if ID matches mockFileId
    File.findById.mockImplementation((id) => {
      return id === mockFileId ? mockFile : null;
    });

    // file.find - returns array with our mock file
    File.find.mockResolvedValue([mockFile]);

    // fs.existsSync - by default returns true (file exists)
    fs.existsSync.mockReturnValue(true);
    
    // fs.mkdirSync - empty implementation
    fs.mkdirSync.mockImplementation(() => {});
    
    // fs.unlinkSync - empty implementation
    fs.unlinkSync.mockImplementation(() => {});
  });

  // file upload endpoinnt
  describe('POST /upload/:jobId', () => {
    it('should successfully upload a file when valid job and file provided', async () => {
      // multer mock to simulate successful file upload
      const mockUpload = {
        single: jest.fn().mockImplementation((fieldName) => (req, res, next) => {
          req.file = {
            filename: 'test-file.txt',
            originalname: 'test-file.txt',
            size: 1024,
            mimetype: 'text/plain',
            path: '/uploads/test-file.txt'
          };
          next();
        })
      };
      multer.mockReturnValue(mockUpload);

      // make request to upload endpoint with mock file
      const response = await request(app)
        .post(`/upload/${mockJobId}`)
        .attach('file', Buffer.from('test content'), 'test-file.txt');

      // response check
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('File uploaded successully');
      
      // check file was created with correct data
      expect(File).toHaveBeenCalledWith({
        jobId: mockJobId,
        filename: 'test-file.txt',
        originalName: 'test-file.txt',
        fileSize: 1024,
        uploadedBy: mockUserId,
        contentType: 'text/plain',
        storagePath: '/uploads/test-file.txt'
      });
      
      // check file was saved to database
      expect(mockFile.save).toHaveBeenCalled();
    });

    it('should return 404 when uploading to non-existent job', async () => {
      const invalidJobId = 'invalidJob123';
      
      const response = await request(app)
        .post(`/upload/${invalidJobId}`)
        .attach('file', Buffer.from('test content'), 'test-file.txt');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Job not found');
      
      // file cleanup was attempted if file was uploaded
      expect(fs.unlinkSync).toHaveBeenCalledTimes(0);
    });

    it('should return 400 when no file is provided', async () => {
      const response = await request(app)
        .post(`/upload/${mockJobId}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('File not uploaded');
    });

    it('should clean up uploaded file and return 500 on database error', async () => {
      // multer mock setup
      const mockUpload = {
        single: jest.fn().mockImplementation((fieldName) => (req, res, next) => {
          req.file = {
            filename: 'test-file.txt',
            path: '/uploads/test-file.txt'
          };
          next();
        })
      };
      multer.mockReturnValue(mockUpload);
      
      // force save to fail
      File.prototype.save.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post(`/upload/${mockJobId}`)
        .attach('file', Buffer.from('test content'), 'test-file.txt');

      expect(response.status).toBe(500);
      expect(fs.unlinkSync).toHaveBeenCalledWith('/uploads/test-file.txt');
    });
  });

  // get files for job eendpoint
  describe('GET /job/:jobId', () => {
    it('should return all files for a valid job', async () => {
      const response = await request(app)
        .get(`/job/${mockJobId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([expect.objectContaining({
        id: mockFileId,
        filename: 'test-file.txt'
      })]);
      
      // correct query made
      expect(File.find).toHaveBeenCalledWith({ jobId: mockJobId });
    });

    it('should return 404 when job does not exist', async () => {
      const invalidJobId = 'invalidJob123';
      
      const response = await request(app)
        .get(`/job/${invalidJobId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Job not found');
    });

    it('should return 500 when database query fails', async () => {
      File.find.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get(`/job/${mockJobId}`);

      expect(response.status).toBe(500);
    });
  });

  // file download endpoint
  describe('GET /download/:fileId', () => {
    it('should successfully download an existing file', async () => {
      // file stream mock
      const mockFileStream = {
        pipe: jest.fn()
      };
      fs.createReadStream.mockReturnValue(mockFileStream);

      const response = await request(app)
        .get(`/download/${mockFileId}`);

      expect(response.status).toBe(200);
      
      // correct file was accessed
      expect(fs.createReadStream).toHaveBeenCalledWith('/uploads/test-file.txt');
    });

    it('should return 404 when file does not exist in database', async () => {
      const invalidFileId = 'invalidFile123';
      
      const response = await request(app)
        .get(`/download/${invalidFileId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('File not found');
    });

    it('should return 404 when corresponding job does not exist', async () => {
      // file with invalid job ID
      File.findById.mockResolvedValueOnce({ 
        ...mockFile, 
        jobId: 'invalidJob123' 
      });

      const response = await request(app)
        .get(`/download/${mockFileId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Corresponding Job Not Found');
    });

    it('should return 404 when file does not exist on filesystem', async () => {
      fs.existsSync.mockReturnValueOnce(false);

      const response = await request(app)
        .get(`/download/${mockFileId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('File not found on server');
    });
  });

  // file delete endpoint
  describe('DELETE /delete/:fileId', () => {
    it('should successfully delete an existing file', async () => {
      const response = await request(app)
        .delete(`/delete/${mockFileId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('File deleted successfully');
      
      // file was deleted from filesystem check
      expect(fs.unlinkSync).toHaveBeenCalledWith('/uploads/test-file.txt');
      
      // file deleted from database check
      expect(File.findByIdAndDelete).toHaveBeenCalledWith(mockFileId);
    });

    it('should return 404 when file does not exist', async () => {
      const invalidFileId = 'invalidFile123';
      
      const response = await request(app)
        .delete(`/delete/${invalidFileId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('File Not Found');
    });

    it('should return 404 when corresponding job does not exist', async () => {
      // file with invalid job ID mock
      File.findById.mockResolvedValueOnce({ 
        ...mockFile, 
        jobId: 'invalidJob123' 
      });

      const response = await request(app)
        .delete(`/delete/${mockFileId}`);

      expect(response.status).toBe(404);
    });

    it('should return 500 when file deletion fails', async () => {
      File.findByIdAndDelete.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .delete(`/delete/${mockFileId}`);

      expect(response.status).toBe(500);
    });
  });
});

