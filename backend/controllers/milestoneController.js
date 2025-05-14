const Milestone = require("../models/Milestone");
const ServiceRequest = require("../models/ServiceRequest");

const createMilestones = async (req, res) => {
  const { jobId } = req.params;
  const { milestones } = req.body;

  try {
    const job = await ServiceRequest.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const createdMilestones = await Milestone.insertMany(
      milestones.map((milestone) => ({
        jobId,
        description: milestone.description,
        dueDate: new Date(milestone.dueDate),
        status: "Pending",
      }))
    );

    res.status(201).json({
      message: "Milestones created successfully",
      milestones: createdMilestones,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating milestones",
      error: error.message,
    });
  }
};

const getMilestones = async (req, res) => {
  const { jobId } = req.params;

  try {
    const milestones = await Milestone.find({ jobId })
      .sort({ dueDate: 1 }) //sort by ascending order of dueDate
      .exec();

    res.status(200).json(milestones);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching milestones", error: error.message });
  }
};

const markMilestoneAsCompleted = async (req, res) => {
  const { milestoneId } = req.params;

  try {
    const milestone = await Milestone.findById(milestoneId);

    if (!milestone) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    milestone.status = "Completed";
    await milestone.save();

    //Handle notification logic
    await axios.post(`${API_URL}/api/milestone/enable`, {
      jobId: milestone.jobId,
      milestoneId: milestoneId
    });
    //

    //check if all milestones are completed
    const allMilestones = await Milestone.find({ jobId: milestone.jobId });
    const allCompleted = allMilestones.every((m) => m.status === "Completed");

    if (allCompleted) {
      //update overall job status
      const job = await ServiceRequest.findByIdAndUpdate(
        milestone.jobId,
        { status: "Completed" },
        { new: true }
      );
    }

    res
      .status(200)
      .json({ message: "Milestone marked as completed", milestone });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error marking milestone as completed",
      error: error.message,
    });
  }
};

module.exports = { createMilestones, getMilestones, markMilestoneAsCompleted };
