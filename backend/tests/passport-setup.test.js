const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const User = require('../models/User');
require('../configs/passport-setup'); // loads the file we're testing

// mock all dependencies
jest.mock('passport');
jest.mock('passport-google-oauth20');
jest.mock('../models/User');

describe('Passport Setup', () => {
  beforeEach(() => {
    // clear all mocks between tests
    jest.clearAllMocks();
  });

  describe('serializeUser', () => {
    it('should serialize user by id', () => {
      // get serializeUser function that was registered
      const serializeFn = passport.serializeUser.mock.calls[0][0];
      const mockUser = { id: '123' };
      const mockDone = jest.fn();

      serializeFn(mockUser, mockDone);

      expect(mockDone).toHaveBeenCalledWith(null, '123');
    });
  });

  describe('deserializeUser', () => {
    it('should deserialize user by id', async () => {
      // get deserializeUser function that was registered
      const deserializeFn = passport.deserializeUser.mock.calls[0][0];
      const mockUser = { id: '123', name: 'Test User' };
      const mockDone = jest.fn();

      // User.findById mock
      User.findById.mockResolvedValue(mockUser);

      await deserializeFn('123', mockDone);

      expect(User.findById).toHaveBeenCalledWith('123');
      expect(mockDone).toHaveBeenCalledWith(null, mockUser);
    });

    it('should handle errors during deserialization', async () => {
      const deserializeFn = passport.deserializeUser.mock.calls[0][0];
      const mockError = new Error('Database error');
      const mockDone = jest.fn();

      User.findById.mockRejectedValue(mockError);

      await deserializeFn('123', mockDone);

      expect(mockDone).toHaveBeenCalledWith(mockError, null);
    });
  });

  describe('Google Strategy', () => {
    let googleStrategyConfig;
    let verifyCallback;

    beforeEach(() => {
      // get the Google Strategy configuration
      googleStrategyConfig = GoogleStrategy.mock.calls[0][0];
      verifyCallback = GoogleStrategy.mock.calls[0][1];
    });

    it('should be configured with correct client ID and secret', () => {
      expect(googleStrategyConfig.clientID).toBe(process.env.GOOGLE_CLIENT_ID);
      expect(googleStrategyConfig.clientSecret).toBe(process.env.GOOGLE_CLIENT_SECRET);
    });

    it('should use correct callback URL based on environment', () => {
      const expectedUrl = process.env.NODE_ENV === 'production'
        ? 'https://skillverse-backend.azurewebsites.net/auth/google/callback'
        : 'http://localhost:5000/auth/google/callback';
      
      expect(googleStrategyConfig.callbackURL).toBe(expectedUrl);
    });

    describe('verify callback', () => {
      const mockProfile = {
        id: 'google123',
        displayName: 'Test User'
      };
      const mockDone = jest.fn();

      it('should return existing user if found', async () => {
        const existingUser = { googleID: 'google123', username: 'Existing User' };
        User.findOne.mockResolvedValue(existingUser);

        await verifyCallback('accessToken', 'refreshToken', mockProfile, mockDone);

        expect(User.findOne).toHaveBeenCalledWith({ googleID: 'google123' });
        expect(mockDone).toHaveBeenCalledWith(null, existingUser);
      });

      it('should create new user if not found', async () => {
        User.findOne.mockResolvedValue(null);
        const newUser = { googleID: 'google123', username: 'Test User', save: jest.fn().mockResolvedValue(true) };
        User.mockImplementation(() => newUser);

        await verifyCallback('accessToken', 'refreshToken', mockProfile, mockDone);

        expect(User).toHaveBeenCalledWith({
          googleID: 'google123',
          username: 'Test User'
        });
        expect(newUser.save).toHaveBeenCalled();
        expect(mockDone).toHaveBeenCalledWith(null, newUser);
      });

      it('should handle errors during user lookup/creation', async () => {
        const mockError = new Error('Database error');
        User.findOne.mockRejectedValue(mockError);

        await verifyCallback('accessToken', 'refreshToken', mockProfile, mockDone);

        expect(mockDone).toHaveBeenCalledWith(mockError, null);
      });
    });
  });

  // cleanup
  afterAll(() => {
    jest.restoreAllMocks();
  });
});