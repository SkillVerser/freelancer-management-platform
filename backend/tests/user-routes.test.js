const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const userRoutes = require("../routes/user-routes");
const User = require("../models/User");
const ChangeRequest = require("../models/RoleChange");

// models and authentication middleware mock
jest.mock("../models/User");
jest.mock("../models/RoleChange");
jest.mock("jsonwebtoken");

// controllers implementations mock
jest.mock("../controllers/user_controller", () => ({
  addUser: jest.fn((req, res) => res.status(201).json({ success: true })),
  updateUser: jest.fn((req, res) => res.status(200).json({ success: true })),
  logIn: jest.fn((req, res) =>
    res.status(200).send("you are logged in, redirected to home page")
  ),
  authCheck: jest.fn((req, res, next) => {
    req.user = {
      _id: "507f1f77bcf86cd799439011",
      googleID: "google123",
      role: "client",
    };
    next();
  }),
  getFreelancerInfo: jest.fn((req, res) =>
    res.status(200).json({
      _id: "freelancer123",
      username: "testfreelancer",
      role: "freelancer",
    })
  ),
}));

const app = express();
app.use(express.json());
app.use("/users", userRoutes); // the base path for user routes

describe("User Routes", () => {
  let mockUser;
  let mockRequest;

  beforeEach(() => {
    // mock data
    mockUser = {
      _id: "507f1f77bcf86cd799439011",
      googleID: "google123",
      username: "testuser",
      role: "client",
      save: jest.fn().mockResolvedValue(true),
    };

    mockRequest = {
      _id: "req123",
      user: mockUser._id,
      currentRole: "client",
      requestedRole: "freelancer",
      status: "pending",
      save: jest.fn().mockResolvedValue(true),
    };

    // user model methods mock
    User.findById.mockResolvedValue(mockUser);
    User.findByIdAndUpdate.mockResolvedValue(mockUser);
    User.findOne.mockResolvedValue(mockUser);
    User.mockImplementation(() => mockUser);

    // change request model methods mock
    ChangeRequest.findOne.mockResolvedValue(null);
    ChangeRequest.findById.mockResolvedValue(mockRequest);
    ChangeRequest.mockImplementation(() => mockRequest);

    // find().populate().exec() chain mock
    ChangeRequest.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockRequest]),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /users/homepage", () => {
    it("should allow access for authenticated users", async () => {
      const response = await request(app)
        .get("/users/homepage")
        .set("Authorization", "Bearer validtoken");

      expect(response.status).toBe(200);
      expect(response.text).toBe("you are logged in, redirected to home page");
    }, 10000); // increased timeout
  });

  describe("POST /users/", () => {
    it("should create a new user", async () => {
      const response = await request(app).post("/users/").send({
        googleID: "newGoogleId",
        username: "newuser",
        role: "client",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe("PUT /users/:id", () => {
    it("should update user information", async () => {
      const response = await request(app)
        .put("/users/507f1f77bcf86cd799439011")
        .send({ username: "updateduser" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /users/set-role", () => {
    it("should update user role when valid role provided", async () => {
      const response = await request(app)
        .post("/users/set-role")
        .set("Authorization", "Bearer validtoken")
        .send({ role: "freelancer" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Role set successfully");
    });

    it("should reject invalid roles", async () => {
      const response = await request(app)
        .post("/users/set-role")
        .set("Authorization", "Bearer validtoken")
        .send({ role: "invalid-role" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid role");
    });
  });

  describe("POST /users/request-role-change", () => {
    it("should create a new role change request", async () => {
      const response = await request(app)
        .post("/users/request-role-change")
        .set("Authorization", "Bearer validtoken")
        .send({
          requestedRole: "freelancer",
          message: "I want to switch roles",
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Request submitted");
    });

    it("should reject if user already has the requested role", async () => {
      User.findOne.mockResolvedValue({ ...mockUser, role: "freelancer" });

      const response = await request(app)
        .post("/users/request-role-change")
        .set("Authorization", "Bearer validtoken")
        .send({
          requestedRole: "freelancer",
          message: "I want to switch roles",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("already a freelancer");
    });

    it("should reject if pending request already exists", async () => {
      ChangeRequest.findOne.mockResolvedValue(mockRequest);

      const response = await request(app)
        .post("/users/request-role-change")
        .set("Authorization", "Bearer validtoken")
        .send({
          requestedRole: "freelancer",
          message: "I want to switch roles",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Pending request already exists");
    });
  });

  describe("GET /users/alltickets", () => {
    it("should fetch all pending requests", async () => {
      const response = await request(app)
        .get("/users/alltickets")
        .set("Authorization", "Bearer validtoken");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 500 if database error occurs", async () => {
      ChangeRequest.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      const response = await request(app)
        .get("/users/alltickets")
        .set("Authorization", "Bearer validtoken");

      expect(response.status).toBe(500);
    });
  });

  describe("POST /users/process-request", () => {
    it("should approve request and update user role", async () => {
      const response = await request(app)
        .post("/users/process-request")
        .set("Authorization", "Bearer validtoken")
        .send({ ticketId: "req123", decision: "approve" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Request approved successfully");
    });

    it("should reject request without changing role", async () => {
      const response = await request(app)
        .post("/users/process-request")
        .set("Authorization", "Bearer validtoken")
        .send({ ticketId: "req123", decision: "reject" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Request rejected successfully");
    });

    it("should return error for already processed request", async () => {
      ChangeRequest.findById.mockResolvedValue({
        ...mockRequest,
        status: "approved",
      });

      const response = await request(app)
        .post("/users/process-request")
        .set("Authorization", "Bearer validtoken")
        .send({ ticketId: "req123", decision: "approve" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Request already processed");
    });
  });

  describe("GET /users/freelancer/:freelancerId", () => {
    it("should return freelancer info", async () => {
      const response = await request(app)
        .get("/users/freelancer/freelancer123")
        .set("Authorization", "Bearer validtoken");

      expect(response.status).toBe(200);
      expect(response.body.username).toBe("testfreelancer");
    });
  });
});

describe("GET /users/", () => {
  it("should return all users", async () => {
    const mockUsers = [
      { _id: "user1", username: "test1" },
      { _id: "user2", username: "test2" }
    ];

    User.find.mockResolvedValue(mockUsers);

    const response = await request(app).get("/users/");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
  });
    it("should return empty array when no users exist", async () => {
    User.find.mockResolvedValue([]);
    const response = await request(app).get("/users/");
    expect(response.body).toEqual([]);
  });

  it("should handle database errors", async () => {
    User.find.mockRejectedValue(new Error("DB Error"));

    const response = await request(app).get("/users/");

    expect(response.status).toBe(500);
  });
});

describe("GET /users/profile/:userId", () => {
  it("should return profile details", async () => {
    const mockProfile = {
      user: { _id: "user123", username: "testuser" },
      skills: ["JavaScript"]
    };

    ProfileDetails.findOne = jest.fn()
      .mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProfile)
      });

    const response = await request(app)
      .get("/users/profile/user123");

    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe("testuser");
  });

  it("should return 404 if profile not found", async () => {
    ProfileDetails.findOne = jest.fn()
      .mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

    const response = await request(app)
      .get("/users/profile/nonexistent");

    expect(response.status).toBe(404);
  });
    let populateMock;
  
  beforeEach(() => {
    populateMock = jest.fn().mockResolvedValue(mockProfile);
    ProfileDetails.findOne.mockReturnValue({
    populate: populateMock
    });
  });

  it("should return profile details", async () => {
    const response = await request(app)
      .get("/users/profile/user123");

    expect(response.status).toBe(200);
    expect(ProfileDetails.findOne).toHaveBeenCalled();
    expect(populateMock).toHaveBeenCalledWith("user");
  });
});

describe("POST /users/create-user", () => {
  const mockProfile = {
    user: "507f1f77bcf86cd799439011",
    location: "Test City",
    skills: ["JavaScript", "Testing"]
  };

  it("should create new profile", async () => {
    ProfileDetails.findOneAndUpdate = jest.fn()
      .mockResolvedValue(mockProfile);

    const response = await request(app)
      .post("/users/create-user")
      .send(mockProfile)
      .set("Authorization", "Bearer validtoken");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Profile details saved successfully");
  });
    
  it("should reject invalid profile data", async () => {
    const response = await request(app)
      .post("/users/create-user")
      .send({ invalid: "data" });
    expect(response.status).toBe(400);
  });

  it("should return 404 if user not found", async () => {
    User.findById.mockResolvedValueOnce(null);

    const response = await request(app)
      .post("/users/create-user")
      .send(mockProfile)
      .set("Authorization", "Bearer validtoken");

    expect(response.status).toBe(404);
  });
});

describe("DELETE /users/:id", () => {
  it("should delete user when admin makes request", async () => {
    // Mock admin user
    User.findById.mockResolvedValueOnce({ 
      _id: "admin123", 
      role: "admin" 
    });
    
    const response = await request(app)
      .delete("/users/507f1f77bcf86cd799439011")
      .set("Authorization", "Bearer admintoken");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User deleted successfully");
  });

  it("should return 403 when non-admin tries to delete", async () => {
    const response = await request(app)
      .delete("/users/507f1f77bcf86cd799439011")
      .set("Authorization", "Bearer regulartoken");

    expect(response.status).toBe(403);
  });

  it("should return 404 when user not found", async () => {
    User.findByIdAndDelete.mockResolvedValueOnce(null);
    
    const response = await request(app)
      .delete("/users/nonexistentid")
      .set("Authorization", "Bearer admintoken");

    expect(response.status).toBe(404);
  });
    it("should reject unauthenticated requests", async () => {
    const response = await request(app)
      .delete("/users/507f1f77bcf86cd799439011");
    expect(response.status).toBe(401);
  });
});
