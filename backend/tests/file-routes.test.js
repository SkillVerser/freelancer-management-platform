const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const ServiceRequest = require('../models/ServiceRequest');
const fileRoutes = require('../routes/file-routes');

// 1. Complete multer mock implementation
jest.mock('multer', () => {
  const mockDiskStorage = {
    destination: (req, file, cb) => cb(null, '/uploads'),
    filename: (req, file, cb) => cb(null, 'mock-file.txt')
  };

  const mockMulter = {
    single: jest.fn().mockImplementation(() => (req, res, next) => {
      req.file = {
        filename: 'mock-file.txt',
        originalname: 'original-name.txt',
        size: 1024,
        mimetype: 'text/plain',
        path: '/uploads/mock-file.txt',
        fieldname: 'file'
      };
      next();
    }),
    diskStorage: jest.fn(() => mockDiskStorage),
    limits: jest.fn()
  };

  return jest.fn(() => mockMulter);
});

// 2. Mock File model
jest.mock('../models/File', () => {
  const mockFile = {
    _id: 'mock-file-id',
    jobId: 'mock-job-id',
    filename: 'mock-file.txt',
    originalName: 'original-name.txt',
    fileSize: 1024,
    contentType: 'text/plain',
    storagePath: '/uploads/mock-file.txt',
    createdAt: new Date(),
    save: jest.fn().mockImplementation(function() {
      return Promise.resolve(this);
    })
  };
  
  return {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    prototype: {
      save: jest.fn()
    },
    ...mockFile
  };
});

// 3. Mock ServiceRequest model
jest.mock('../models/ServiceRequest', () => ({
  findById: jest.fn()
}));

// 4. Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  createReadStream: jest.fn(() => ({
    pipe: jest.fn()
  }))
}));

describe('File Routes', () => {
  let app;
  const mockJobId = '507f1f77bcf86cd799439011';
  const mockFileId = '5f8d04b3ab35b2d3c8d4f5e6';
  const mockUserId = '60d21b4667d0d8992e610c85';

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = { _id: mockUserId };
      next();
    });
    app.use(fileRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default ServiceRequest mock
    ServiceRequest.findById.mockResolvedValue({ 
      _id: mockJobId,
      title: 'Test Job'
    });
    
    // Default File mock
    File.findById.mockResolvedValue({
      _id: mockFileId,
      jobId: mockJobId,
      filename: 'test-file.txt',
      originalName: 'original-name.txt',
      fileSize: 1024,
      contentType: 'text/plain',
      storagePath: '/uploads/test-file.txt',
      uploadedBy: mockUserId
    });
    
    // Default File.find mock
    File.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([{
          _id: mockFileId,
          filename: 'test-file.txt',
          originalName: 'original-name.txt',
          fileSize: 1024,
          uploadedAt: new Date()
        }])
      })
    });
  });

  describe('POST /upload/:jobId', () => {
    it('should upload a file successfully', async () => {
      const response = await request(app)
        .post(`/upload/${mockJobId}`)
        .attach('file', Buffer.from('test content'), 'test-file.txt');

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'File uploaded successully',
        file: {
          id: 'mock-file-id',
          filename: 'mock-file.txt',
          originalName: 'original-name.txt',
          fileSize: 1024,
          uploadedAt: expect.any(String)
        }
      });
      expect(ServiceRequest.findById).toHaveBeenCalledWith(mockJobId);
    });

    it('should return 404 if job not found', async () => {
      ServiceRequest.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .post(`/upload/${mockJobId}`)
        .attach('file', Buffer.from('test content'), 'test-file.txt');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Job not found' });
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should return 400 if no file uploaded', async () => {
      // Override multer single mock to not add file
      const multer = require('multer');
      multer().single.mockImplementationOnce(() => (req, res, next) => next());

      const response = await request(app)
        .post(`/upload/${mockJobId}`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'File not uploaded' });
    });

    it('should handle database errors', async () => {
      File.prototype.save.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post(`/upload/${mockJobId}`)
        .attach('file', Buffer.from('test content'), 'test-file.txt');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Internal server error' });
      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('GET /job/:jobId', () => {
    it('should return files for a job', async () => {
      const mockFiles = [
        { _id: mockFileId, filename: 'file1.txt', originalName: 'file1.txt' },
        { _id: 'another-file-id', filename: 'file2.txt', originalName: 'file2.txt' }
      ];

      File.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockFiles)
        })
      });

      const response = await request(app)
        .get(`/job/${mockJobId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFiles);
      expect(File.find).toHaveBeenCalledWith({ jobId: mockJobId });
    });

    it('should return 404 if job not found', async () => {
      ServiceRequest.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get(`/job/${mockJobId}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Job not found' });
    });

    it('should handle database errors', async () => {
      File.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      const response = await request(app)
        .get(`/job/${mockJobId}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Internal server error' });
    });
  });

  describe('GET /download/:fileId', () => {
    it('should download a file', async () => {
      const response = await request(app)
        .get(`/download/${mockFileId}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/plain');
      expect(response.headers['content-disposition'])
        .toBe('attachment; filename="original-name.txt"');
    });

    it('should return 404 if file not found', async () => {
      File.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get(`/download/${mockFileId}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'File not found' });
    });

    it('should return 404 if job not found', async () => {
      ServiceRequest.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get(`/download/${mockFileId}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Corresponding Job Not Found' });
    });

    it('should return 404 if file missing from filesystem', async () => {
      fs.existsSync.mockReturnValueOnce(false);

      const response = await request(app)
        .get(`/download/${mockFileId}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'File not found on server' });
    });
  });

  describe('DELETE /delete/:fileId', () => {
    it('should delete a file successfully', async () => {
      const response = await request(app)
        .delete(`/delete/${mockFileId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'File deleted successfully' });
      expect(fs.unlinkSync).toHaveBeenCalledWith('/uploads/test-file.txt');
      expect(File.findByIdAndDelete).toHaveBeenCalledWith(mockFileId);
    });

    it('should return 404 if file not found', async () => {
      File.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete(`/delete/${mockFileId}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'File Not Found' });
    });

    it('should return 404 if job not found', async () => {
      ServiceRequest.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete(`/delete/${mockFileId}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ 
        message: 'Corresponding Service Request Not Found' 
      });
    });

    it('should handle filesystem errors', async () => {
      fs.unlinkSync.mockImplementationOnce(() => {
        throw new Error('Filesystem error');
      });

      const response = await request(app)
        .delete(`/delete/${mockFileId}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('Error deleting file');
    });
  });
});