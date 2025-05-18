const mongoose = require('mongoose');
const { connectDB } = require('../configs/db-conn'); // Changed to named import

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    host: 'localhost'
  }
}));

describe('Database Connection', () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalProcessExit = process.exit;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MONGO_URI = 'mongodb://test-uri';
    console.log = jest.fn();
    console.error = jest.fn();
    process.exit = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  it('should connect successfully and log connection', async () => {
    mongoose.connect.mockResolvedValueOnce({ 
      connection: { host: 'localhost' } 
    });

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
    expect(console.log).toHaveBeenCalledWith('MongoDB Connected: localhost');
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should handle connection errors and exit process', async () => {
    const testError = new Error('Connection failed');
    mongoose.connect.mockRejectedValueOnce(testError);

    await connectDB();

    expect(console.error).toHaveBeenCalledWith('Error:', testError);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});