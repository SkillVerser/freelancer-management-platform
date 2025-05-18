const request = require("supertest");
const express = require("express");
const serviceRequestRoutes = require("../routes/service-request-routes");
const User = require("../models/User");
const ServiceRequest = require("../models/ServiceRequest");
//using imports wont work bc its not ES recognisable

//this mocks the models
//mocking creates simulated versions of functions, objects or modules
jest.mock("../models/User");
jest.mock("../models/ServiceRequest");

//this basically creates an express app so that it can be tested
const app = express();
app.use(express.json());
app.use("/api/service-requests", serviceRequestRoutes); //register the servreq toute so that the api endpoint can be tested

describe("POST /api/service-requests/create", () => {
  const mockClientId = "64fabc1234567890abcd1234";

  // Clear mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });
  //this first test case checks if a clients request is being created correctly. if it actually happens
  //This test will simulate a successful service request creation when a valid client is provided
  it("should create a new service request for a valid client", async () => {
    //what test should do
    // Mock User.findOne to return a fake client (with given mockID and role)
    //this simulates a valid client being found in the db
    User.findOne.mockResolvedValue({ _id: mockClientId, role: "client" });

    //jest.fn(): Creates a mock function for save, which is the method used to save the new ServiceRequest to the database.
    //mockResolvedValue({}): This simulates a successful call to save() that doesn't return anything (an empty object).
    const mockSave = jest.fn().mockResolvedValue({});
    ServiceRequest.mockImplementation(() => ({
      //Mocks the ServiceRequest constructor so that when it is called, it uses the mock save function.
      save: mockSave,
    }));
    //Uses supertest to send a POST request to the /api/service-requests/create endpoint
    //with a JSON body containing the clientId and serviceType
    const res = await request(app).post("/api/service-requests/create").send({
      clientId: mockClientId,
      serviceType: "web development",
    });

    expect(res.statusCode).toBe(201); //make sure resp code is 201 meaning resource is successful
    expect(res.body).toHaveProperty(
      "message",
      "Service request created successfully"
    ); //make sure resbody has correct message
    expect(mockSave).toHaveBeenCalled(); //Verifies that the save method of the ServiceRequest model was called.
    //Verifies that the ServiceRequest constructor was called with the
    // expected parameters (i.e., the client ID and service type).
    expect(ServiceRequest).toHaveBeenCalledWith({
      clientId: mockClientId,
      serviceType: "web development",
    });
  });
  //this test case simulates when no client is found in the database
  it("should return 400 if client is not found", async () => {
    User.findOne.mockResolvedValue(null); //simulate no client basically
    //basically send same post request but with a client ID that DNE in the database
    const res = await request(app).post("/api/service-requests/create").send({
      clientId: "nonexistent-client-id",
      serviceType: "web development",
    });

    expect(res.statusCode).toBe(400); //verify response code is 400(dne) meaning bad request
    expect(res.body).toHaveProperty("message", "Client not found"); //Verifies that the response body contains the appropriate error message
  });
  //Simulates a server error by causing User.findOne to throw an error (using mockRejectedValue)
  it("should return 500 if there is a server error", async () => {
    User.findOne.mockRejectedValue(new Error("DB error"));
    //send same request but now expect a server error
    const res = await request(app).post("/api/service-requests/create").send({
      clientId: "any-client-id",
      serviceType: "web development",
    });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/Error creating service request/i);
  });
});
