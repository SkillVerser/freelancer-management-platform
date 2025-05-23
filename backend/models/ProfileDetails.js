const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      default: null,
    },
    occupation: {
      type: String,
      default: null,
    },
    skills: {
      type: [String],
      default: null,
    },
    about: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

//tells mongoose to create a new collection called "profiledetails", and to use the previously defined schema
module.exports = mongoose.model("ProfileDetails", profileSchema);