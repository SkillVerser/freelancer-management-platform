
const request = require('supertest'); // making HTTP requests in test
const express = require('express');
const passport = require('passport'); 
const authRoutes = require('../routes/auth-routes'); // routes we're testing

// passport mock to isolate our tests from actual authentication
jest.mock('passport', () => ({
  // authenticate method mock to simulate passport behavior
  authenticate: jest.fn().mockImplementation((strategy, options, callback) => {
    return (req, res, next) => {
      // a logged-in user simulation by attaching to request
      req.user = { _id: 'test123' }; 
      next();
    };
  })
}));

describe('Auth Routes', () => {
  let app;
  const mockUser = {
    _id: '123',
    role: 'client',
    googleID: 'google123'
  };

  // test environment setup before all tests run
  beforeAll(() => {
    app = express();
    app.use(express.json()); 
    
    // middleware to simulate authenticated requests
    app.use((req, res, next) => {
      req.session = {}; // Mock session object
      req.user = mockUser; // authenticated user mock
      req.logout = jest.fn((cb) => cb(null)); // logout function mock
      req.session.destroy = jest.fn((cb) => cb(null)); // session destruction mock
      next();
    });
    
    app.use(authRoutes); // auth routes we're testing mounting
  });

  // reset mocks and test environment before each test
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mock call histories
    process.env.NODE_ENV = 'test'; // Set test environment
    process.env.FRONTEND_URL = 'http://localhost:3000'; // Mock frontend URL
  });

  // logout functionality
  describe('GET /logout', () => {
    it('should logout successfully', async () => {
      // Make request to logout endpoint
      const response = await request(app).get('/logout');
      
      // response check
      expect(response.status).toBe(200);
      expect(response.text).toBe('Logout successful');
      
      // session destroyed check
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should handle logout errors', async () => {
      // middleware to simulate logout error check
      app.use((req, res, next) => {
        req.logout = jest.fn((cb) => cb(new Error('Logout failed')));
        next();
      });

      const response = await request(app).get('/logout');
      
      // error response check
      expect(response.status).toBe(500);
      expect(response.text).toBe('Error logging out');
    });
  });

  // Google authentication initiation test suite
  describe('GET /google', () => {
    it('should initiate Google authentication', async () => {
      await request(app).get('/google');
      
      // passport called correctly check
      expect(passport.authenticate).toHaveBeenCalledWith('google', {
        scope: ['profile'] // request profile scope
      });
    });
  });

  // Google OAuth callback test suite
  describe('GET /google/callback', () => {
    it('should redirect new users to role selection', async () => {
      // middleware to simulate new user (no role) setup
      app.use((req, res, next) => {
        req.user = { _id: 'new123', role: undefined };
        next();
      });

      const response = await request(app).get('/google/callback');
      
      // redirect to role selection
      expect(response.status).toBe(302); // Redirect status
      expect(response.headers.location).toContain('/roles?userId=new123');
    });

    it('should redirect existing users to their home page', async () => {
      // middleware to simulate existing user
      app.use((req, res, next) => {
        req.user = { _id: 'existing123', role: 'freelancer' };
        next();
      });

      const response = await request(app).get('/google/callback');
      
      // redirect to role-specific home check
      expect(response.headers.location).toBe('http://localhost:3000/freelancer/home');
    });
  });

  // current user endpoint test suite
  describe('GET /me', () => {
    it('should return current user when authenticated', async () => {
      const response = await request(app).get('/me');
      
      // successful response with user data 
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });

    it('should return 401 when not authenticated', async () => {
      // middleware to simulate unauthenticated request setup
      app.use((req, res, next) => {
        req.user = null;
        next();
      });

      const response = await request(app).get('/me');
      
      // unauthorized response
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Not authenticated' });
    });
  });
});