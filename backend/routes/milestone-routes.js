const express = require("express");
const router = express.Router();
const {
  createMilestones,
  getMilestones,
  markMilestoneAsCompleted,
} = require("../controllers/milestoneController");

// create milestones route
router.post("/:jobId", createMilestones);

//get milestones route
router.get("/job/:jobId", getMilestones);

//mark milestone as completed route
router.put("/complete/:milestoneId", markMilestoneAsCompleted);

router.post("/milestone/enable");

module.exports = router;
