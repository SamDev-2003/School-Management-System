const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  course:  { type: mongoose.Schema.Types.ObjectId, ref: "Course",  required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  date:    { type: Date, required: true },
  status:  { type: String, enum: ["Present","Absent","Late","Excused"], required: true },
  remarks: { type: String, default: "" },
}, { timestamps: true });
schema.index({ student: 1, course: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("Attendance", schema);
