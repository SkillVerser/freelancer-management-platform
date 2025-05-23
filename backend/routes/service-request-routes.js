const express = require("express");
const ServiceRequest = require("../models/ServiceRequest");
const User = require("../models/User");
const Application = require("../models/Application");
const router = express.Router();
const {
  createServiceRequest,
  getAllServiceRequests,
} = require("../controllers/serviceRequestController");
//http://localhost:5000/api/service-requests/create (postman check)
// Create a new service request (from client obs POST)
router.post("/create", async (req, res) => {
  const { clientId, serviceType } = req.body;

  try {
    //console.log("Received clientId:", clientId);

    const client = await User.findOne({ _id: clientId, role: "client" });
    //const allUsers = await User.find({});
    //console.log("All users in DB:", allUsers);
    //console.log("Sample user from DB:", user);
    //console.log("Client from findById:", client);
    if (!client) {
      return res.status(400).json({ message: "Client not found" }); //client DNE in database
    }
    //this creates a new service request
    const newServiceRequest = new ServiceRequest({
      clientId,
      serviceType,
    });

    await newServiceRequest.save();
    res.status(201).json({
      message: "Service request created successfully",
      newServiceRequest,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: `Error creating service request: ${error.message}` });
  }
});
//router.get("/all", getAllServiceRequests);
router.get("/all", async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      freelancerId: null,
      status: "Pending",
    })
      .populate("clientId", "username")
      .exec();

    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching available service requests" });
  }
});
// Freelancer applies to a service request
//http://localhost:5000/api/service-requests/applications test
router.post("/applications", async (req, res) => {
  const { jobId, freelancerId, coverLetter, price } = req.body; // <-- added price

  try {
    const freelancer = await User.findOne({
      _id: freelancerId,
      role: "freelancer",
    });
    if (!freelancer) {
      return res.status(400).json({ message: "Freelancer not found" });
    }

    const job = await ServiceRequest.findById(jobId);
    if (!job) {
      return res.status(400).json({ message: "Service request not found" });
    }

    if (job.freelancerId) {
      return res
        .status(400)
        .json({ message: "This service request is already taken" });
    }

    const existingApplication = await Application.findOne({
      jobId,
      freelancerId,
    });
    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "You have already applied for this job" });
    }

    const newApplication = new Application({
      jobId,
      freelancerId,
      coverLetter,
      price,
    });
    await newApplication.save();

    res
      .status(201)
      .json({ message: "Application submitted successfully", newApplication });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error applying for service request" });
  }
});

// Get all jobs a client has posted (so they can be applied to)
router.get("/client/jobs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const jobs = await ServiceRequest.find({ clientId: id })
      .populate("clientId", "username")
      .populate("freelancerId", "username")
      .exec();
    if (!jobs) {
      return res.status(404).json({ message: "Job not found" });
    }
    //console.log("Jobs fetched:", jobs); // Debugging line to check fetched jobs
    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching job details" });
  }
});
//this is for manage jobs on admin page, fetches a freel and client assigned to eachother
router.get("/manage-jobs", async (req, res) => {
  try {
    const serviceRequests = await ServiceRequest.find()
      .populate("clientId", "username") //show client name
      .populate("freelancerId", "username") //show freelancer name
      .exec();
    //console.log("Populated serviceRequests:", serviceRequests);
    // serviceRequests.forEach(req => {
    //   console.log({
    //    client: req.clientId,
    //    freelancer: req.freelancerId,
    //   });
    // });
    res.status(200).json(serviceRequests);
  } catch (error) {
    console.error("Error fetching service requests:", error);
    res.status(500).json({ message: "Failed to fetch service requests" });
  }
});

// Get all jobs a freelancer is working on
router.get("/freelancer/jobs/:id", async (req, res) => {
  //console.log("Received request to fetch freelancer jobs"); // Debugging line
  //console.log("Request params:", req.params); // Debugging line
  //console.log("Fetching freelancer jobs for ID:", req.params.id); // Debugging line
  const { id } = req.params;
  try {
    const freelancerJobs = await ServiceRequest.find({
      freelancerId: id,
    })
      .populate("clientId", "username")
      .populate("freelancerId", "username")
      .exec();

    res.status(200).json(freelancerJobs);
  } catch (error) {
    console.error("Error fetching freelancer jobs:", error);
    res.status(500).json({ message: "Error fetching assigned jobs" });
  }
});

// Get specific job details by ID
router.get("/job/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const job = await ServiceRequest.findById(id)
      .populate("clientId", "username email")
      .populate("freelancerId", "username email")
      .exec();

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json(job);
  } catch (error) {
    console.error("Error fetching job details:", error);
    res.status(500).json({ message: "Error fetching job details" });
  }
});

module.exports = router;
