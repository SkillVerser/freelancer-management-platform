const request = require('supertest');
const mongoose = require('mongoose');

// mock passport
jest.mock('passport', () => ({
  initialize: jest.fn(() => (req, res, next) => next()),
  session: jest.fn(() => (req, res, next) => next()),
  authenticate: jest.fn(() => (req, res, next) => next()),
  serializeUser: jest.fn((fn) => fn({ id: 'mock-user' }, (err, id) => {})),
  deserializeUser: jest.fn((fn) => fn('mock-user', (err, user) => {})),
  use: jest.fn()
}));

// mock passport-google-oauth20
jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn()
}));

// mock passport-setup
jest.mock('../configs/passport-setup', () => jest.fn());

// mock database connection
jest.mock('../configs/db-conn', () => ({
  connectDB: jest.fn().mockResolvedValue()
}));

// mock express-session
jest.mock('express-session', () => {
  return jest.fn(() => (req, res, next) => next());
});

// mock connect-mongo with create method
jest.mock('connect-mongo', () => {
  const mockMongoStore = {
    get: jest.fn(),
    set: jest.fn(),
    destroy: jest.fn(),
    clear: jest.fn(),
    length: jest.fn(),
    all: jest.fn()
  };
  
  return {
    create: jest.fn(() => mockMongoStore)
  };
});

// import the app after all mocks are in place
const app = require('../server');

let server;

beforeAll((done) => {
  server = app.listen(0, () => done());
});

afterAll((done) => {
  server.close(() => {
    mongoose.disconnect().then(() => done());
  });
});

describe('Server Basics', () => {
  it('should start without errors', () => {
    expect(server.listening).toBeTruthy();
  });

  it('should respond to root route', async () => {
    const response = await request(app).get('/');
    expect(response.status).not.toBe(404);
  });
});

describe('Middleware', () => {
  it('should parse JSON bodies', async () => {
    const testData = { test: 'value' };
    app.post('/test-json', (req, res) => res.send(req.body));
    const response = await request(app)
      .post('/test-json')
      .send(testData);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(testData);
  });

  it('should have CORS enabled', async () => {
    const origin = process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : 'http://localhost:3000';
    
    const response = await request(app)
      .get('/')
      .set('Origin', origin);
    
    expect(response.headers['access-control-allow-origin']).toBe(origin);
  });
});

describe('Routes', () => {
  const testRoutes = [
    { path: '/auth', method: 'get' },
    { path: '/users', method: 'get' },
    { path: '/payments', method: 'get' },
    { path: '/api/service-requests', method: 'get' },
    { path: '/api/applications', method: 'get' }
  ];

  testRoutes.forEach(route => {
    it(`should have ${route.method.toUpperCase()} ${route.path} route`, async () => {
      const response = await request(app)[route.method](route.path);
      expect(response.status).not.toBe(404);
    });
  });
});