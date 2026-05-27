const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  studentId:   { type: String, unique: true, sparse: true },
  grade:       { type: String, required: true },
  section:     { type: String, default: "A" },
  gender:      { type: String, enum: ["Male","Female","Other"], default: "Male" },
  dateOfBirth: { type: Date },
  parentName:  { type: String, default: "" },
  parentPhone: { type: String, default: "" },
  courses:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model("Student", schema);
