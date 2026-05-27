const Student    = require("../models/Student");
const Teacher    = require("../models/Teacher");
const Course     = require("../models/Course");
const User       = require("../models/User");
const Attendance = require("../models/Attendance");
const Marks      = require("../models/Marks");

exports.admin = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalCourses, totalUsers] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Teacher.countDocuments({ isActive: true }),
      Course.countDocuments({ isActive: true }),
      User.countDocuments()
    ]);
    const recentStudents = await Student.find({ isActive: true })
      .populate("user", "name email createdAt").sort({ createdAt: -1 }).limit(5);
    const gradeDist = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$grade", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, data: { totalStudents, totalTeachers, totalCourses, totalUsers, recentStudents, gradeDist } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.teacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id })
      .populate("courses", "name code grade");
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher profile not found" });

    // Count students across all courses by grade
    let totalStudents = 0;
    for (const course of teacher.courses) {
      const count = await Student.countDocuments({ grade: course.grade, isActive: true });
      totalStudents += count;
    }

    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todayAtt = await Attendance.countDocuments({
      teacher: teacher._id, date: { $gte: today, $lte: todayEnd }
    });

    res.json({ success: true, data: {
      teacher,
      stats: { totalCourses: teacher.courses.length, totalStudents, todayAtt }
    }});
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.student = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate({ path: "courses", populate: { path: "teacher", populate: { path: "user", select: "name" } } });
    if (!student) return res.status(404).json({ success: false, message: "Student profile not found" });

    const marks = await Marks.find({ student: student._id }).populate("course", "name code");
    const att   = await Attendance.find({ student: student._id });
    const present = att.filter(a => a.status === "Present").length;
    const attPct  = att.length ? Math.round((present / att.length) * 100) : 0;
    const avgPct  = marks.length ? Math.round(marks.reduce((s, m) => s + m.percentage, 0) / marks.length) : 0;

    res.json({ success: true, data: {
      student,
      stats: { courses: student.courses.length, attPct, avgPct, totalExams: marks.length },
      recentMarks: marks.slice(0, 5)
    }});
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
