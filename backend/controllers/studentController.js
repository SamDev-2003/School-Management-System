const User    = require("../models/User");
const Student = require("../models/Student");
const Course  = require("../models/Course");

const pop = [
  { path: "user",    select: "name email phone address isActive" },
  { path: "courses", select: "name code grade" }
];

exports.getAll = async (req, res) => {
  try {
    const { search = "", grade = "" } = req.query;
    let list = await Student.find({ isActive: true }).populate(pop).sort({ createdAt: -1 });
    if (grade)  list = list.filter(s => s.grade === grade);
    if (search) list = list.filter(s =>
      s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(search.toLowerCase())
    );
    res.json({ success: true, count: list.length, data: list });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const s = await Student.findById(req.params.id).populate(pop);
    if (!s) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: s });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password = "student123", phone, address,
            grade, section, gender, dateOfBirth, parentName, parentPhone } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "Email already exists" });

    const count = await Student.countDocuments();
    const user  = await User.create({ name, email, password, phone, address, role: "student" });

    // Find all courses that match this student's grade — auto-enroll
    const gradeCourses = await Course.find({ grade, isActive: true });
    const courseIds    = gradeCourses.map(c => c._id);

    const student = await Student.create({
      user: user._id,
      studentId: "STU" + String(count + 1).padStart(4, "0"),
      grade, section, gender, dateOfBirth, parentName, parentPhone,
      courses: courseIds
    });

    // Add student to each matching course
    for (const cId of courseIds)
      await Course.findByIdAndUpdate(cId, { $addToSet: { students: student._id } });

    await student.populate(pop);
    res.status(201).json({ success: true, data: student });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, phone, address, grade, section, gender, dateOfBirth, parentName, parentPhone } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Not found" });

    await User.findByIdAndUpdate(student.user, { name, phone, address });

    // If grade changed, update course enrollments
    if (grade && grade !== student.grade) {
      // Remove from old grade courses
      for (const cId of student.courses)
        await Course.findByIdAndUpdate(cId, { $pull: { students: student._id } });

      // Enroll in new grade courses
      const newCourses = await Course.find({ grade, isActive: true });
      const newIds = newCourses.map(c => c._id);
      for (const cId of newIds)
        await Course.findByIdAndUpdate(cId, { $addToSet: { students: student._id } });

      await Student.findByIdAndUpdate(req.params.id,
        { grade, section, gender, dateOfBirth, parentName, parentPhone, courses: newIds },
        { new: true }
      );
    } else {
      await Student.findByIdAndUpdate(req.params.id,
        { grade, section, gender, dateOfBirth, parentName, parentPhone },
        { new: true }
      );
    }

    const updated = await Student.findById(req.params.id).populate(pop);
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Not found" });
    // Remove from all courses
    for (const cId of student.courses)
      await Course.findByIdAndUpdate(cId, { $pull: { students: student._id } });
    await Student.findByIdAndUpdate(req.params.id, { isActive: false });
    await User.findByIdAndUpdate(student.user, { isActive: false });
    res.json({ success: true, message: "Student deleted" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    await Student.findByIdAndUpdate(req.params.id, { $addToSet: { courses: courseId } });
    await Course.findByIdAndUpdate(courseId, { $addToSet: { students: req.params.id } });
    res.json({ success: true, message: "Enrolled" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.unenrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    await Student.findByIdAndUpdate(req.params.id, { $pull: { courses: courseId } });
    await Course.findByIdAndUpdate(courseId, { $pull: { students: req.params.id } });
    res.json({ success: true, message: "Unenrolled" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
