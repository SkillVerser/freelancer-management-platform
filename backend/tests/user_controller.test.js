const {
  addUser,
  logIn,
  authCheck,
  updateUser,
} = require("../controllers/user_controller");
const User = require("../models/User");
const mongoose = require("mongoose");

// Correct mock setup - separate static and instance methods
jest.mock("../models/User", () => {
  // Mock instance methods
  const mockUser = function (data) {
    this.data = data;
    this.save = jest.fn().mockResolvedValue(this);
  };

  // Mock static methods
  mockUser.findByIdAndUpdate = jest.fn();
  mockUser.findOne = jest.fn();

  return mockUser;
});

describe("addUser controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if required fields are missing", async () => {
    const req = {
      body: {
        username: "testUser",
        role: "client",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await addUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Provide all fields",
    });
  });

  it("Should return 201 if user added successfully", async () => {
    const req = {
      body: {
        googleID: "123",
        username: "testUser",
        role: "freelancer",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await addUser(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "New User Added Successfully",
    });
  });
});

describe("updateUser controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 for successful update", async () => {
    const validId = new mongoose.Types.ObjectId().toString();

    // Mock the updated user data that matches your controller's return structure
    const mockUpdatedUser = {
      _id: validId,
      googleID: "123",
      username: "testUser",
      role: "client",
    };

    const req = {
      params: { id: validId },
      body: {
        googleID: "123",
        username: "testUser",
        role: "client",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock to return the full user object (matching { new: true } behavior)
    User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockUpdatedUser,
    });
  });

  it("should return 500 for internal error", async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const req = {
      params: { id: validId },
      body: { username: "testUser" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // 1. Create the mock error
    const mockError = new Error("Database failure");

    // 2. Set up console spy BEFORE mocking the database call
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // 3. Properly mock the rejected promise
    User.findByIdAndUpdate.mockImplementationOnce(() => {
      return Promise.reject(mockError);
    });

    // 4. Run the controller
    await updateUser(req, res);

    // 5. Verify the HTTP response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error",
    });

    // 6. Verify the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error Creating User: Database failure")
    );

    // 7. Clean up
    consoleSpy.mockRestore();
  });

  it("Should output 404 if ObjectId is invalid", async () => {
    const req = {
      params: { id: "invalid-key" },
      body: { googleID: "123", username: "testUser" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User Not Found",
    });
  });
});

describe("authCheck controller", () => {
  it("No req.user", () => {
    const req = {
      // no req.user
    };

    const res = {
      redirect: jest.fn(),
    };

    const next = jest.fn();

    authCheck(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith("/login");
  });
});

describe("authCheck controller", () => {
  it("User is already logged in", () => {
    const req = {
      user: {
        id: "123",
      },
    };

    const res = {
      redirect: jest.fn(),
    };

    const next = jest.fn();

    authCheck(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe("logIn controller", () => {
  it("Should output, you are logged in", () => {
    const req = {};

    const res = {
      send: jest.fn(),
    };

    logIn(req, res);

    expect(res.send).toHaveBeenCalledWith(
      "you are logged in, redirected to home page"
    );
  });
});
