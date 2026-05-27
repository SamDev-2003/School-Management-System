const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB:", mongoose.connection.name);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("   Make sure MongoDB is running and MONGO_URI in .env is correct");
    process.exit(1);
  }

  const User       = require("../models/User");
  const Student    = require("../models/Student");
  const Teacher    = require("../models/Teacher");
  const Course     = require("../models/Course");
  const Attendance = require("../models/Attendance");
  const Marks      = require("../models/Marks");

  // Clear all collections
  await Promise.all([
    User.deleteMany(), Student.deleteMany(), Teacher.deleteMany(),
    Course.deleteMany(), Attendance.deleteMany(), Marks.deleteMany()
  ]);
  console.log("🗑  Cleared old data");

  // ─────────────────────────────────────────────
  // 1. Admin
  // ─────────────────────────────────────────────
  await User.create({ name: "Admin User", email: "admin@sms.com", password: "admin123", role: "admin" });
  console.log("👤 Admin created");

  // ─────────────────────────────────────────────
  // 2. Teachers
  // ─────────────────────────────────────────────
  const teacherDefs = [
    { name: "Dr. Sarah Johnson", email: "sarah@sms.com", subject: "Mathematics",    dept: "Science",    qual: "PhD Mathematics", exp: 10 },
    { name: "Mr. James Wilson",  email: "james@sms.com", subject: "English",        dept: "Arts",       qual: "MA English",      exp: 7  },
    { name: "Ms. Emily Chen",    email: "emily@sms.com", subject: "Physics",        dept: "Science",    qual: "MSc Physics",     exp: 5  },
    { name: "Mr. Robert Brown",  email: "robert@sms.com",subject: "Computer Science",dept:"Technology", qual: "BSc CS",          exp: 8  },
  ];

  const teachers = [];
  for (const t of teacherDefs) {
    const user = await User.create({ name: t.name, email: t.email, password: "teacher123", role: "teacher" });
    const teacher = await Teacher.create({
      user: user._id, subject: t.subject, department: t.dept,
      qualification: t.qual, experience: t.exp
    });
    teachers.push(teacher);
  }
  console.log(`👩‍🏫 ${teachers.length} teachers created`);

  // ─────────────────────────────────────────────
  // 3. Courses (with teacher assignment)
  //    Grade 10 → teachers[0] (Math) + teachers[1] (English)
  //    Grade 11 → teachers[2] (Physics) + teachers[3] (CS)
  //    Grade 12 → teachers[0] (Calc) + teachers[3] (Web Dev)
  // ─────────────────────────────────────────────
  const courseDefs = [
    { name: "Advanced Mathematics", code: "MATH101", grade: "Grade 10", credits: 4, ti: 0 },
    { name: "English Literature",   code: "ENG101",  grade: "Grade 10", credits: 3, ti: 1 },
    { name: "Physics Fundamentals", code: "PHY101",  grade: "Grade 11", credits: 4, ti: 2 },
    { name: "Computer Science",     code: "CS101",   grade: "Grade 11", credits: 3, ti: 3 },
    { name: "Calculus",             code: "MATH201", grade: "Grade 12", credits: 4, ti: 0 },
    { name: "Web Development",      code: "CS201",   grade: "Grade 12", credits: 3, ti: 3 },
  ];

  const courses = [];
  for (const c of courseDefs) {
    const course = await Course.create({
      name: c.name, code: c.code, grade: c.grade,
      credits: c.credits, teacher: teachers[c.ti]._id,
      students: []          // will fill after students are created
    });
    // Add course to teacher profile
    await Teacher.findByIdAndUpdate(teachers[c.ti]._id, { $push: { courses: course._id } });
    courses.push(course);
  }
  console.log(`📚 ${courses.length} courses created`);

  // ─────────────────────────────────────────────
  // 4. Students — auto-enrolled by grade
  // ─────────────────────────────────────────────
  const studentDefs = [
    { name: "Alice Thompson", email: "alice@sms.com",  grade: "Grade 10", gender: "Female", dob: "2008-03-12", parent: "Mr. Thompson",  pph: "0788001001" },
    { name: "Bob Martinez",   email: "bob@sms.com",    grade: "Grade 10", gender: "Male",   dob: "2008-07-22", parent: "Mrs. Martinez", pph: "0788001002" },
    { name: "Carol Davis",    email: "carol@sms.com",  grade: "Grade 10", gender: "Female", dob: "2008-01-05", parent: "Mr. Davis",     pph: "0788001003" },
    { name: "David Lee",      email: "david@sms.com",  grade: "Grade 11", gender: "Male",   dob: "2007-09-18", parent: "Mrs. Lee",      pph: "0788001004" },
    { name: "Eva Rodriguez",  email: "eva@sms.com",    grade: "Grade 11", gender: "Female", dob: "2007-04-30", parent: "Mr. Rodriguez", pph: "0788001005" },
    { name: "Frank Wilson",   email: "frank@sms.com",  grade: "Grade 11", gender: "Male",   dob: "2007-11-14", parent: "Mrs. Wilson",   pph: "0788001006" },
    { name: "Grace Kim",      email: "grace@sms.com",  grade: "Grade 12", gender: "Female", dob: "2006-06-25", parent: "Mr. Kim",       pph: "0788001007" },
    { name: "Henry Brown",    email: "henry@sms.com",  grade: "Grade 12", gender: "Male",   dob: "2006-02-08", parent: "Mrs. Brown",    pph: "0788001008" },
  ];

  const students = [];
  for (let i = 0; i < studentDefs.length; i++) {
    const s = studentDefs[i];
    const user = await User.create({ name: s.name, email: s.email, password: "student123", role: "student" });

    // Find ALL courses matching student grade
    const gradeCourses = courses.filter(c => c.grade === s.grade);
    const courseIds    = gradeCourses.map(c => c._id);

    const student = await Student.create({
      user:        user._id,
      studentId:   "STU" + String(i + 1).padStart(4, "0"),
      grade:       s.grade,
      section:     "A",
      gender:      s.gender,
      dateOfBirth: new Date(s.dob),
      parentName:  s.parent,
      parentPhone: s.pph,
      courses:     courseIds      // student knows their courses
    });

    // Each course knows this student ← THIS IS THE CRITICAL STEP
    for (const cId of courseIds) {
      await Course.findByIdAndUpdate(cId, { $addToSet: { students: student._id } });
    }

    students.push(student);
  }
  console.log(`🎓 ${students.length} students created`);

  // Verify enrollment
  console.log("\n📋 Enrollment verification:");
  for (const course of courses) {
    const c = await Course.findById(course._id);
    console.log(`   ${c.name} (${c.grade}): ${c.students.length} students`);
  }

  // ─────────────────────────────────────────────
  // 5. Attendance (last 15 school days)
  // ─────────────────────────────────────────────
  const statusPool = ["Present", "Present", "Present", "Present", "Absent", "Late"];
  const today = new Date();
  let daysDone = 0;
  for (let i = 1; daysDone < 15; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends
    daysDone++;
    for (const student of students) {
      const gradeCourses = courses.filter(c => c.grade === student.grade);
      for (const course of gradeCourses) {
        try {
          await Attendance.create({
            student: student._id,
            course:  course._id,
            teacher: course.teacher,
            date:    d,
            status:  statusPool[Math.floor(Math.random() * statusPool.length)]
          });
        } catch (_) {} // skip duplicate index errors
      }
    }
  }
  console.log("✅ Attendance records created");

  // ─────────────────────────────────────────────
  // 6. Marks
  // ─────────────────────────────────────────────
  for (const student of students) {
    const gradeCourses = courses.filter(c => c.grade === student.grade);
    for (const course of gradeCourses) {
      for (const [et, tm] of [["Quiz", 20], ["Midterm", 50], ["Final", 100], ["Assignment", 30]]) {
        const obtained = Math.floor(tm * 0.5 + Math.random() * tm * 0.5);
        await Marks.create({
          student:       student._id,
          course:        course._id,
          teacher:       course.teacher,
          examType:      et,
          totalMarks:    tm,
          obtainedMarks: obtained,
          academicYear:  "2024-2025",
          term:          "Term 1"
        });
      }
    }
  }
  console.log("✅ Marks records created");

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  DATABASE SEEDED SUCCESSFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ROLE      EMAIL                  PASSWORD
  ────────  ─────────────────────  ───────────
  Admin     admin@sms.com          admin123
  Teacher   sarah@sms.com          teacher123   (Math  → Grade 10 & 12)
  Teacher   james@sms.com          teacher123   (Eng   → Grade 10)
  Teacher   emily@sms.com          teacher123   (Phys  → Grade 11)
  Teacher   robert@sms.com         teacher123   (CS    → Grade 11 & 12)
  Student   alice@sms.com          student123   (Grade 10)
  Student   bob@sms.com            student123   (Grade 10)
  Student   david@sms.com          student123   (Grade 11)
  Student   grace@sms.com          student123   (Grade 12)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  HOW THE SYSTEM WORKS:
  • Students are automatically enrolled in ALL courses
    of their grade (Grade 10 students → MATH101 + ENG101)
  • Teachers see only students enrolled in THEIR course
  • Admin can manually enroll/unenroll from Courses page
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seeder failed:", err.message);
  process.exit(1);
});
