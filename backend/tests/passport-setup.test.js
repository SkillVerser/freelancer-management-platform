
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const User = require('../models/User');

jest.mock('passport');
jest.mock('passport-google-oauth20');
jest.mock('../models/User');

describe('Passport Configuration', () => {
  // mock data that will be used across tests
  const mockUserId = 'user123';
  const mockGoogleId = 'google123';
  const mockUser = {
    id: mockUserId,
    googleID: mockGoogleId,
    username: 'Test User',
    save: jest.fn().mockResolvedValue(true)
  };
  const mockProfile = {
    id: mockGoogleId,
    displayName: 'Test User'
  };

  // environment variables needed for the tests
  const originalEnv = process.env;

  beforeAll(() => {
    // environment variables setup
    process.env = {
      ...originalEnv,
      FRONTEND_URL: 'http://test-frontend',
      NODE_ENV: 'test',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret'
    };
  });

  // reset all mocks and restore original environment after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // serialize user test
  describe('serializeUser', () => {
    it('should serialize user by their id', () => {
      // require the passport setup after mocks are in place
      require('../configs/passport-setup');
      
      // verify passport.serializeUser was called
      expect(passport.serializeUser).toHaveBeenCalled();
      
      // get the actual serialization function that was registered
      const serializeFn = passport.serializeUser.mock.calls[0][0];
      const mockDone = jest.fn();
      
      // call the serialization function with a mock user
      serializeFn(mockUser, mockDone);
      
      // verify it calls done with the user's id
      expect(mockDone).toHaveBeenCalledWith(null, mockUserId);
    });
  });

  // deserialize user test
  describe('deserializeUser', () => {
    it('should deserialize user by their id', async () => {
      // require the passport setup after mocks are in place
      require('../configs/passport-setup');
      
      // verify passport.deserializeUser was called
      expect(passport.deserializeUser).toHaveBeenCalled();
      
      // get the actual deserialization function that was registered
      const deserializeFn = passport.deserializeUser.mock.calls[0][0];
      const mockDone = jest.fn();
      
      // mock User.findById to return our mock user
      User.findById.mockResolvedValue(mockUser);
      
      // call the deserialization function
      await deserializeFn(mockUserId, mockDone);
      
      // verify correct user lookup and done callback
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockDone).toHaveBeenCalledWith(null, mockUser);
    });

    it('should handle errors during deserialization', async () => {
      require('../configs/passport-setup');
      
      const deserializeFn = passport.deserializeUser.mock.calls[0][0];
      const mockDone = jest.fn();
      const mockError = new Error('Database error');
      
      // force User.findById to fail
      User.findById.mockRejectedValue(mockError);
      
      await deserializeFn(mockUserId, mockDone);
      
      // verify error handling
      expect(mockDone).toHaveBeenCalledWith(mockError, null);
    });
  });

  // google strategy test
  describe('Google OAuth Strategy', () => {
    let googleStrategy;
    let verifyCallback;

    beforeEach(() => {
      // clear require cache to get fresh module instance
      jest.resetModules();
      require('../configs/passport-setup');
      
      // get the GoogleStrategy instance that was created
      googleStrategy = GoogleStrategy.mock.calls[0][0];
      verifyCallback = GoogleStrategy.mock.calls[0][1];
    });

    it('should be configured with correct options', () => {
      // verify GoogleStrategy was called with correct configuration
      expect(GoogleStrategy).toHaveBeenCalled();
      
      // strategy configuration check
      expect(googleStrategy.callbackURL).toBe('http://localhost:5000/auth/google/callback');
      expect(googleStrategy.clientID).toBe('test-client-id');
      expect(googleStrategy.clientSecret).toBe('test-client-secret');
    });

    it('should use production callback URL in production environment', () => {
      // set NODE_ENV to production temporarily
      process.env.NODE_ENV = 'production';
      
      // clear require cache and require fresh
      jest.resetModules();
      require('../configs/passport-setup');
      
      // get the new GoogleStrategy instance
      const prodStrategy = GoogleStrategy.mock.calls[0][0];
      
      expect(prodStrategy.callbackURL).toBe(
        'https://skillverse-backend.azurewebsites.net/auth/google/callback'
      );
      
      // restore original NODE_ENV
      process.env.NODE_ENV = 'test';
    });

    describe('verify callback', () => {
      it('should return existing user if found', async () => {
        const mockDone = jest.fn();
        
        // mock User.findOne to return existing user
        User.findOne.mockResolvedValue(mockUser);
        
        await verifyCallback('token', 'refresh', mockProfile, mockDone);
        
        // verify correct user lookup
        expect(User.findOne).toHaveBeenCalledWith({ googleID: mockGoogleId });
        
        // verify done callback with existing user
        expect(mockDone).toHaveBeenCalledWith(null, mockUser);
      });

      it('should create new user if not found', async () => {
        const mockDone = jest.fn();
        
        // mock User.findOne to return null (user not found)
        User.findOne.mockResolvedValue(null);
        
        // mock User constructor
        User.mockImplementationOnce(() => mockUser);
        
        await verifyCallback('token', 'refresh', mockProfile, mockDone);
        
        // verify new user creation
        expect(User).toHaveBeenCalledWith({
          googleID: mockGoogleId,
          username: mockProfile.displayName
        });
        
        // verify user save and done callback
        expect(mockUser.save).toHaveBeenCalled();
        expect(mockDone).toHaveBeenCalledWith(null, mockUser);
      });

      it('should handle errors during user lookup/creation', async () => {
        const mockDone = jest.fn();
        const mockError = new Error('Database error');
        
        // force User.findOne to fail
        User.findOne.mockRejectedValue(mockError);
        
        await verifyCallback('token', 'refresh', mockProfile, mockDone);
        
        // error handling
        expect(mockDone).toHaveBeenCalledWith(mockError, null);
      });
    });
  });

  // environment test
  describe('Environment Configuration', () => {
    it('should use default FRONTEND_URL if not set', () => {
      // Temporarily remove FRONTEND_URL
      delete process.env.FRONTEND_URL;
      
      // clear require cache and require fresh
      jest.resetModules();
      require('../configs/passport-setup');
      
      // default is used check
      const googleStrategy = GoogleStrategy.mock.calls[0][0];
      expect(googleStrategy.callbackURL).toContain('http://localhost:5000');
      
      // restore FRONTEND_URL
      process.env.FRONTEND_URL = 'http://test-frontend';
    });

    it('should use default NODE_ENV if not set', () => {
      // remove NODE_ENV temporarily
      delete process.env.NODE_ENV;
      
      // clear require cache and require fresh
      jest.resetModules();
      require('../configs/passport-setup');
      
      // default is used check
      const googleStrategy = GoogleStrategy.mock.calls[0][0];
      expect(googleStrategy.callbackURL).toContain('http://localhost:5000');
      
      // restore NODE_ENV
      process.env.NODE_ENV = 'test';
    });
  });
});