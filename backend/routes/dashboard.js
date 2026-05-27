const r = require("express").Router();
const c = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/auth");
r.get("/admin",   protect, authorize("admin"),   c.admin);
r.get("/teacher", protect, authorize("teacher"), c.teacher);
r.get("/student", protect, authorize("student"), c.student);
module.exports = r;
