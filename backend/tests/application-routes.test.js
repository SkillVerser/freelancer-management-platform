const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());

// mock application and service request models
jest.mock("../models/Application");
jest.mock("../models/ServiceRequest");

// import mocked models
const Application = require("../models/Application");
const ServiceRequest = require("../models/ServiceRequest");

// import and use the application routes we want to test
const applicationRoutes = require("../routes/application-routes");
app.use("/api/applications", applicationRoutes);

// group all application routes tests together
describe("Application Routes", () => {
  // clean up mocks after each test to prevent interference
  afterEach(() => {
    jest.clearAllMocks();
  });

  // testing GET /api/applications/jobs/:jobId routes
  describe("GET /api/applications/jobs/:jobId", () => {
    // successful GET request
    it("should return applications for a specific job", async () => {
      // fake application data
      const mockApps = [
        {
          _id: "1",
          jobId: "job1",
          freelancerId: "f1",
          coverLetter: "cover letter 1",
          price: 100,
          status: "Pending",
        },
      ];

      // mock the Application model's find method to return the fake data
      Application.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockApps),
      });

      // simulate a GET request to the endpoint with a specific jobId
      const res = await request(app).get("/api/applications/jobs/job1");
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockApps);
    });

    // internal server error during request
    it("should return 500 if an error occurs", async () => {
      // mock a failure
      Application.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      const res = await request(app).get("/api/applications/jobs/job1");
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Error fetching applications");
    });
  });

  // testing POST /api/applications/jobs/accept/:applicationId routes
  describe("POST /api/applications/jobs/accept/:applicationId", () => {
    // successful POST request
    it("should accept an application and update the respesctive fields and collections", async () => {
      // mock applciation and serive request data
      const mockApp = {
        _id: "1",
        jobId: "job1",
        freelancerId: "f1",
        coverLetter: "cover letter 1",
        price: 100,
        status: "Pending",
        save: jest.fn().mockResolvedValue(true),
      };

      const mockServiceRequest = {
        _id: "job1",
        freelancerId: null,
        status: "Pending",
        save: jest.fn().mockResolvedValue(true),
      };

      // mock fetches to the database
      Application.findById.mockResolvedValue(mockApp);
      ServiceRequest.findById.mockResolvedValue(mockServiceRequest);

      // post request
      const res = await request(app).post("/api/applications/jobs/accept/1");

      expect(Application.findById).toHaveBeenCalledWith("1");
      expect(ServiceRequest.findById).toHaveBeenCalledWith("job1");
      expect(mockApp.save).toHaveBeenCalled();
      expect(mockServiceRequest.save).toHaveBeenCalled();

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Application Accepted");
    });

    // application not found
    it("should return 404 if application is not found", async () => {
      // mock database fetch to return null (no application)
      Application.findById.mockResolvedValue(null);

      const res = await request(app).post("/api/applications/jobs/accept/1");

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Application Not Found");
    });

    // service request not found
    it("should return 404 if service request is not found", async () => {
      const mockApp = {
        _id: "1",
        jobId: "job1",
        freelancerId: "f1",
        coverLetter: "cover letter 1",
        price: 100,
        status: "Pending",
        save: jest.fn(),
      };

      Application.findById.mockResolvedValue(mockApp);
      ServiceRequest.findById.mockResolvedValue(null); // mock service request not found

      const res = await request(app).post("/api/applications/jobs/accept/1");

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Service Request Not Found");
    });

    // application already accepted
    it("should return 400 if application is already accepted", async () => {
      const mockApp = {
        _id: "1",
        jobId: "job1",
        freelancerId: "f1",
        coverLetter: "cover letter 1",
        price: 100,
        status: "Accepted", // already accepted
        save: jest.fn(),
      };

      Application.findById.mockResolvedValue(mockApp);

      const res = await request(app).post("/api/applications/jobs/accept/1");

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Application Already Accepted");
    });

    // internal server error during request
    it("should return 500 if an error occurs", async () => {
      //mock a failure
      Application.findById.mockRejectedValue(new Error("Internal Error"));

      const res = await request(app).post("/api/applications/jobs/accept/1");

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Error Accepting Application");
    });
  });
});
