const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, required: true, unique: true, uppercase: true },
  description: { type: String, default: "" },
  grade:       { type: String, required: true },
  credits:     { type: Number, default: 3 },
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  students:    [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model("Course", schema);
