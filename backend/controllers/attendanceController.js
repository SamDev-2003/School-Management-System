const Attendance = require("../models/Attendance");
const Teacher = require("../models/Teacher");

exports.record = async (req, res) => {
  try {
    const { courseId, date, records } = req.body;
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) return res.status(403).json({ success:false, message:"Teacher profile not found" });
    const ops = records.map(r => ({
      updateOne: {
        filter: { student:r.studentId, course:courseId, date:new Date(date) },
        update: { $set:{ status:r.status, remarks:r.remarks||"", teacher:teacher._id } },
        upsert: true
      }
    }));
    await Attendance.bulkWrite(ops);
    res.json({ success:true, message:`Attendance saved for ${records.length} students` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};

exports.getByCourse = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const q = { course:req.params.courseId };
    if (date) q.date = new Date(date);
    if (startDate && endDate) q.date = { $gte:new Date(startDate), $lte:new Date(endDate) };
    const data = await Attendance.find(q)
      .populate({ path:"student", populate:{ path:"user", select:"name" } })
      .populate("course","name code")
      .sort({ date:-1 });
    res.json({ success:true, data });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};

exports.getByStudent = async (req, res) => {
  try {
    const records = await Attendance.find({ student:req.params.studentId })
      .populate("course","name code grade").sort({ date:-1 });
    const byCourse = {};
    records.forEach(r => {
      const k = String(r.course?._id);
      if (!k) return;
      if (!byCourse[k]) byCourse[k] = { course:r.course, total:0, present:0, absent:0, late:0, excused:0, records:[] };
      byCourse[k].total++;
      byCourse[k][r.status.toLowerCase()]++;
      byCourse[k].records.push({ date:r.date, status:r.status, remarks:r.remarks });
    });
    const summary = Object.values(byCourse).map(c => ({
      ...c, percentage: c.total > 0 ? Math.round((c.present/c.total)*100) : 0
    }));
    res.json({ success:true, data:summary });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};

exports.getReport = async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.query;
    const q = {};
    if (courseId) q.course = courseId;
    if (startDate && endDate) q.date = { $gte:new Date(startDate), $lte:new Date(endDate) };
    const data = await Attendance.find(q)
      .populate({ path:"student", populate:{ path:"user", select:"name" } })
      .populate("course","name code").sort({ date:-1 }).limit(500);
    res.json({ success:true, data });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};
