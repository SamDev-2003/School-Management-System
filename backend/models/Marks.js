const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  course:        { type: mongoose.Schema.Types.ObjectId, ref: "Course",  required: true },
  teacher:       { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  examType:      { type: String, enum: ["Quiz","Midterm","Final","Assignment","Project"], required: true },
  totalMarks:    { type: Number, required: true },
  obtainedMarks: { type: Number, required: true },
  percentage:    { type: Number },
  grade:         { type: String },
  remarks:       { type: String, default: "" },
  examDate:      { type: Date, default: Date.now },
  academicYear:  { type: String, default: "2024-2025" },
  term:          { type: String, enum: ["Term 1","Term 2","Term 3"], default: "Term 1" },
}, { timestamps: true });

schema.pre("save", function(next) {
  this.percentage = Math.round((this.obtainedMarks / this.totalMarks) * 100);
  const p = this.percentage;
  if (p >= 90) this.grade = "A+";
  else if (p >= 80) this.grade = "A";
  else if (p >= 70) this.grade = "B";
  else if (p >= 60) this.grade = "C";
  else if (p >= 50) this.grade = "D";
  else this.grade = "F";
  next();
});
module.exports = mongoose.model("Marks", schema);
