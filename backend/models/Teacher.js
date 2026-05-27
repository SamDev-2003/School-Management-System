const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  teacherId:     { type: String, unique: true, sparse: true },
  subject:       { type: String, required: true },
  department:    { type: String, default: "" },
  qualification: { type: String, default: "" },
  experience:    { type: Number, default: 0 },
  courses:       [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model("Teacher", schema);
