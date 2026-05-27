const r = require("express").Router();
const c = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/auth");
r.post("/",                    protect, authorize("teacher","admin"), c.record);
r.get("/course/:courseId",     protect, c.getByCourse);
r.get("/student/:studentId",   protect, c.getByStudent);
r.get("/report",               protect, authorize("admin","teacher"), c.getReport);
module.exports = r;
