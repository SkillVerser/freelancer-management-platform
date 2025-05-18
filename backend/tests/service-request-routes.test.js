const request = require("supertest");
const express = require("express");
const router = require("../routes/service-request-routes");

const ServiceRequest = require("../models/ServiceRequest");
const User = require("../models/User");
const Application = require("../models/Application");

jest.mock("../models/ServiceRequest");
jest.mock("../models/User");
jest.mock("../models/Application");

const app = express();
app.use(express.json());
app.use("/api/service-requests", router);

//group of tests for Service Request Routes
describe("Service Request Routes", () => {
  //after each test, clear any mock call history
  afterEach(() => {
    jest.clearAllMocks();
  });

  //group of tests for creating a service request
  describe("POST /create", () => {
    //tests successful service request creation
    it("should create a new service request for valid client", async () => {
      const mockClient = { _id: "client123", role: "client" }; // Mock client user
      const mockRequest = {
        save: jest.fn(),
        clientId: "client123",
        serviceType: "web",
      }; // Mock request object (not actually used directly)

      User.findOne.mockResolvedValue(mockClient); // Mock finding a valid client
      ServiceRequest.mockImplementation(() => ({
        // Mock ServiceRequest constructor to return a mock object with a save() method
        save: jest.fn().mockResolvedValue({}),
      }));

      //make a post req to create a service request
      const res = await request(app)
        .post("/api/service-requests/create")
        .send({ clientId: "client123", serviceType: "web" });

      expect(res.statusCode).toBe(201); //should return 201 if its created
      expect(res.body.message).toBe("Service request created successfully"); //should return a success message
      expect(mockRequest.save).toHaveBeenCalled(); //tests correct 'save' (idk if it works)
    });

    //test error when client is not found
    it("should return 400 if client is not found", async () => {
      User.findOne.mockResolvedValue(null); //mock no client found

      const res = await request(app)
        .post("/api/service-requests/create")
        .send({ clientId: "invalidId", serviceType: "design" });

      expect(res.statusCode).toBe(400); //should return 400 Bad Request
      expect(res.body.message).toBe("Client not found"); //should return appropriate error message
    });
  });

  //group of tests for fetching all available service requests
  describe("GET /all", () => {
    //this tests successful retrieval of service requests
    it("should return all pending, unassigned service requests", async () => {
      const mockServiceRequests = [
        {
          _id: "req123",
          serviceType: "web",
          freelancerId: null,
          status: "pending",
          clientId: "client123",
        },
        {
          _id: "req124",
          serviceType: "app",
          freelancerId: null,
          status: "pending",
          clientId: "client124",
        },
      ]; //mock list of service requests

      ServiceRequest.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(), //mock chaining of populate
        exec: jest.fn().mockResolvedValue(mockServiceRequests), //mock result of the query
      });

      const res = await request(app).get("/api/service-requests/all"); //make GET request

      // Assert expectations
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(2); //return 2 service requests
      expect(res.body[0].serviceType).toBe("web");
      expect(res.body[1].serviceType).toBe("app");
    });

    //test server error when fetching service requests
    it("should return 500 if there is a server error", async () => {
      ServiceRequest.find.mockRejectedValue(new Error("Database error")); //this simulates database error

      const res = await request(app).get("/api/service-requests/all");

      expect(res.statusCode).toBe(500); //should return 500 server error
      expect(res.body.message).toBe(
        "Error fetching available service requests"
      );
    });

    // Test when no service requests are found
    it("should return an empty array if no requests are found", async () => {
      ServiceRequest.find.mockResolvedValue([]); // No requests in database

      const res = await request(app).get("/api/service-requests/all");

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(0); //return an empty array (no reqs)
    });
  });

  // Group of tests for submitting applications for service requests
  describe("POST /applications", () => {
    //test successful application submission
    it("should successfully submit an application for a valid freelancer and job", async () => {
      const mockFreelancer = { _id: "freelancer123", role: "freelancer" }; // Mock freelancer user
      const mockJob = { _id: "job123", freelancerId: null }; // Mock service request with no assigned freelancer
      const mockApplication = {
        jobId: "job123",
        freelancerId: "freelancer123",
        coverLetter: "My cover letter",
      }; // Mock application

      User.findOne.mockResolvedValue(mockFreelancer); //mock finding the freelancer
      ServiceRequest.findById.mockResolvedValue(mockJob); //mock finding the service request
      Application.findOne.mockResolvedValue(null); //mock no previous application exists
      Application.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockApplication), //mock saving new application
      }));

      const res = await request(app)
        .post("/api/service-requests/applications")
        .send({
          jobId: "job123",
          freelancerId: "freelancer123",
          coverLetter: "My cover letter",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Application submitted successfully");
      expect(res.body.newApplication.jobId).toBe("job123");
      expect(res.body.newApplication.freelancerId).toBe("freelancer123");
      expect(res.body.newApplication.coverLetter).toBe("My cover letter");
    });

    //test error when freelancer is not found
    it("should return 400 if freelancer is not found", async () => {
      User.findOne.mockResolvedValue(null); //no freelancer is found here

      const res = await request(app)
        .post("/api/service-requests/applications")
        .send({
          jobId: "job123",
          freelancerId: "invalidFreelancerId",
          coverLetter: "My cover letter",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Freelancer not found");
    });

    //test error when service request (job) is not found
    it("should return 400 if service request is not found", async () => {
      const mockFreelancer = { _id: "freelancer123", role: "freelancer" };
      User.findOne.mockResolvedValue(mockFreelancer);
      ServiceRequest.findById.mockResolvedValue(null); //return null, no req(job) found

      const res = await request(app)
        .post("/api/service-requests/applications")
        .send({
          jobId: "invalidJobId",
          freelancerId: "freelancer123",
          coverLetter: "My cover letter",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Service request not found");
    });

    //checks when a job has already been assigned(already taken)
    it("should return 400 if service request is already taken", async () => {
      const mockFreelancer = { _id: "freelancer123", role: "freelancer" };
      const mockJob = { _id: "job123", freelancerId: "freelancer456" }; //already assigned

      User.findOne.mockResolvedValue(mockFreelancer);
      ServiceRequest.findById.mockResolvedValue(mockJob);

      const res = await request(app)
        .post("/api/service-requests/applications")
        .send({
          jobId: "job123",
          freelancerId: "freelancer123",
          coverLetter: "My cover letter",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("This service request is already taken");
    });

    //tests when a freelancer already applied for the job
    it("should return 400 if freelancer has already applied for the job", async () => {
      const mockFreelancer = { _id: "freelancer123", role: "freelancer" };
      const mockJob = { _id: "job123", freelancerId: null };
      const mockExistingApplication = {
        jobId: "job123",
        freelancerId: "freelancer123",
        coverLetter: "Existing application",
      };

      User.findOne.mockResolvedValue(mockFreelancer);
      ServiceRequest.findById.mockResolvedValue(mockJob);
      Application.findOne.mockResolvedValue(mockExistingApplication); //already applied

      const res = await request(app)
        .post("/api/service-requests/applications")
        .send({
          jobId: "job123",
          freelancerId: "freelancer123",
          coverLetter: "My cover letter",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("You have already applied for this job");
    });

    //test server error when applying
    it("should return 500 if there is a server error", async () => {
      User.findOne.mockRejectedValue(new Error("Database error")); //simulates database failuree

      const res = await request(app)
        .post("/api/service-requests/applications")
        .send({
          jobId: "job123",
          freelancerId: "freelancer123",
          coverLetter: "My cover letter",
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Error applying for service request");
    });
  });
});
