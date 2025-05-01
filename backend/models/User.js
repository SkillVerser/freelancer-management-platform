const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleID: {
      //google ID returned from Google during OAuth authentication
      type: String,
      required: true,
      unique: true,
    },
    username: {
      //will be created on first login (sign up)
      type: String,
      required: true,
      unique: false,
    },
    role: {
      //will be chosen on first login (signup)
      type: String,
      enum: ["client", "freelancer", "admin"], //value must be one of these options
    },
  },
  {
    timestamps: true, //stores created at, updated at information (maybe not necessary)
  }
);

//tells mongoose to create a new collection called "users", and to use the previously defined schema
module.exports = mongoose.model("User", userSchema);
