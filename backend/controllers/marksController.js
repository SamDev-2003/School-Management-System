const Marks = require("../models/Marks");
const Teacher = require("../models/Teacher");

exports.enter = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user:req.user._id });
    const { student, course, examType, totalMarks, obtainedMarks, academicYear, term, remarks } = req.body;
    const existing = await Marks.findOne({ student, course, examType, academicYear, term });
    let record;
    if (existing) {
      existing.totalMarks = totalMarks; existing.obtainedMarks = obtainedMarks;
      existing.remarks = remarks||"";
      await existing.save(); record = existing;
    } else {
      record = await Marks.create({ student, course, teacher:teacher?._id, examType, totalMarks, obtainedMarks, academicYear, term, remarks });
    }
    res.status(201).json({ success:true, data:record });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};

exports.update = async (req, res) => {
  try {
    const mark = await Marks.findById(req.params.id);
    if (!mark) return res.status(404).json({ success:false, message:"Not found" });
    Object.assign(mark, req.body);
    await mark.save();
    res.json({ success:true, data:mark });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Marks.findByIdAndDelete(req.params.id);
    res.json({ success:true, message:"Deleted" });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};

exports.getByStudent = async (req, res) => {
  try {
    const { academicYear, term } = req.query;
    const q = { student:req.params.studentId };
    if (academicYear) q.academicYear = academicYear;
    if (term) q.term = term;
    const data = await Marks.find(q)
      .populate("course","name code credits")
      .populate({ path:"teacher", populate:{ path:"user", select:"name" } })
      .sort({ examDate:-1 });
    const gpa = data.length
      ? (data.reduce((s,m) => s + ({"A+":4,A:4,B:3,C:2,D:1,F:0}[m.grade]||0), 0) / data.length).toFixed(2)
      : "0.00";
    res.json({ success:true, data, gpa });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};

exports.getByCourse = async (req, res) => {
  try {
    const { examType, term, academicYear } = req.query;
    const q = { course:req.params.courseId };
    if (examType) q.examType = examType;
    if (term) q.term = term;
    if (academicYear) q.academicYear = academicYear;
    const data = await Marks.find(q)
      .populate({ path:"student", populate:{ path:"user", select:"name" } })
      .sort({ percentage:-1 });
    res.json({ success:true, data });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};
