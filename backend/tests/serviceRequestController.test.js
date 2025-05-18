const mongoose = require("mongoose");
const { createServiceRequest } = require("../controllers/serviceRequestController");
const ServiceRequest = require("../models/ServiceRequest");

// service request model mock
jest.mock("../models/ServiceRequest");

describe("ServiceRequestController", () => {
  // clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // test data for the service request
  const mockRequestData = {
    clientId: "507f1f77bcf86cd799439011",
    serviceType: "web development",
    status: "pending",
  };

  // mock response object
  const mockRes = {
    status: jest.fn().mockReturnThis(), // allows chaining .json()
    json: jest.fn(),
  };

  describe("createServiceRequest", () => {
    it("should successfully create a service request and return 201 status", async () => {
      //create a mock request object
      const mockReq = {
        body: {
          clientId: mockRequestData.clientId,
          serviceType: mockRequestData.serviceType,
        },
      };

      //mock the save function to resolve successfully
      const mockSave = jest.fn().mockResolvedValue(mockRequestData);
      ServiceRequest.mockImplementation(() => ({
        save: mockSave,
      }));

      //call the controller function
      await createServiceRequest(mockReq, mockRes);

      //verify response
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Service request created successfully",
        request: mockRequestData,
      });

      //verify the save called
      expect(mockSave).toHaveBeenCalled();
    });

    it("should return 500 status when database save fails", async () => {
      //create a mock request object
      const mockReq = {
        body: {
          clientId: mockRequestData.clientId,
          serviceType: mockRequestData.serviceType,
        },
      };

      //mock save function to reject (DB error simulation)
      const mockSave = jest.fn().mockRejectedValue(new Error("Database error"));
      ServiceRequest.mockImplementation(() => ({
        save: mockSave,
      }));

      //call controller function
      await createServiceRequest(mockReq, mockRes);

      // 4. Verify the error response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Error creating service request",
        error: expect.any(Error), //expect an Error object
      });
    });

    it("should require clientId and serviceType in request body", async () => {
      //test cases for missing fields
      const testCases = [
        { body: {}, description: "completely empty body" },
        { body: { clientId: "123" }, description: "missing serviceType" },
        { body: { serviceType: "web dev" }, description: "missing clientId" },
      ];

      for (const testCase of testCases) {
        //reset mock calls before each sub-test
        mockRes.status.mockClear();
        mockRes.json.mockClear();

        //mock request with incomplete data creation
        const mockReq = { body: testCase.body };

        //call controller function
        await createServiceRequest(mockReq, mockRes);

        //verify the validation failed
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: "Client ID and service type are required",
        });
      }
    });
  });
});
