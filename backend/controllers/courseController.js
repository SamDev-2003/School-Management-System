const Course   = require("../models/Course");
const Teacher  = require("../models/Teacher");
const Student  = require("../models/Student");

const pop = [
  { path: "teacher", populate: { path: "user", select: "name email" } },
  { path: "students", populate: { path: "user", select: "name email" } }
];

// Helper: always get students from BOTH sources and merge
async function getCourseWithStudents(courseId) {
  const course = await Course.findById(courseId).populate(pop);
  if (!course) return null;

  // Primary: find all students whose grade matches this course's grade
  const byGrade = await Student.find({ grade: course.grade, isActive: true })
    .populate("user", "name email");

  // Merge: include any manually enrolled students too
  const manualIds = (course.students || []).map(s => String(s._id || s));
  const gradeIds  = byGrade.map(s => String(s._id));

  // All unique students = grade match + manually enrolled
  const allIds = [...new Set([...gradeIds, ...manualIds])];

  // Build final list preferring grade-based (already populated)
  const gradeMap = {};
  byGrade.forEach(s => { gradeMap[String(s._id)] = s; });

  const manualStudents = (course.students || []).filter(
    s => !gradeMap[String(s._id || s)]
  );

  const allStudents = [...byGrade, ...manualStudents];

  // Keep Course.students in sync silently
  if (allIds.length !== manualIds.length) {
    await Course.findByIdAndUpdate(courseId, { students: allIds });
  }

  return { ...course.toObject(), students: allStudents };
}

exports.getAll = async (req, res) => {
  try {
    const { search = "", grade = "" } = req.query;
    let list = await Course.find({ isActive: true }).populate(pop).sort({ createdAt: -1 });
    if (grade)  list = list.filter(c => c.grade === grade);
    if (search) list = list.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    );
    // For each course also count students by grade
    const result = await Promise.all(list.map(async c => {
      const count = await Student.countDocuments({ grade: c.grade, isActive: true });
      return { ...c.toObject(), studentCount: count };
    }));
    res.json({ success: true, count: result.length, data: result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const data = await getCourseWithStudents(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Course not found" });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    if (course.teacher)
      await Teacher.findByIdAndUpdate(course.teacher, { $addToSet: { courses: course._id } });
    // Auto-enroll all students of matching grade
    const students = await Student.find({ grade: course.grade, isActive: true });
    if (students.length > 0) {
      const ids = students.map(s => s._id);
      await Course.findByIdAndUpdate(course._id, { students: ids });
      for (const s of students)
        await Student.findByIdAndUpdate(s._id, { $addToSet: { courses: course._id } });
    }
    const full = await getCourseWithStudents(course._id);
    res.status(201).json({ success: true, data: full });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const old = await Course.findById(req.params.id);
    if (!old) return res.status(404).json({ success: false, message: "Not found" });
    if (req.body.teacher && String(req.body.teacher) !== String(old.teacher)) {
      if (old.teacher) await Teacher.findByIdAndUpdate(old.teacher, { $pull: { courses: old._id } });
      await Teacher.findByIdAndUpdate(req.body.teacher, { $addToSet: { courses: old._id } });
    }
    await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    const updated = await getCourseWithStudents(req.params.id);
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Course.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: "Course deleted" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.assignTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (course.teacher) await Teacher.findByIdAndUpdate(course.teacher, { $pull: { courses: course._id } });
    await Teacher.findByIdAndUpdate(teacherId, { $addToSet: { courses: course._id } });
    await Course.findByIdAndUpdate(req.params.id, { teacher: teacherId });
    const updated = await getCourseWithStudents(req.params.id);
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Enroll a student manually into a course
exports.enrollStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    await Course.findByIdAndUpdate(req.params.id, { $addToSet: { students: studentId } });
    await Student.findByIdAndUpdate(studentId, { $addToSet: { courses: req.params.id } });
    res.json({ success: true, message: "Student enrolled" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Unenroll a student from a course
exports.unenrollStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    await Course.findByIdAndUpdate(req.params.id, { $pull: { students: studentId } });
    await Student.findByIdAndUpdate(studentId, { $pull: { courses: req.params.id } });
    res.json({ success: true, message: "Student removed" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
