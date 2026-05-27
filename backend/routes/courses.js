const r = require("express").Router();
const c = require("../controllers/courseController");
const { protect, authorize } = require("../middleware/auth");

r.get("/",    protect, c.getAll);
r.get("/:id", protect, c.getOne);
r.post("/",   protect, authorize("admin"), c.create);
r.put("/:id", protect, authorize("admin"), c.update);
r.delete("/:id", protect, authorize("admin"), c.remove);
r.put("/:id/assign-teacher", protect, authorize("admin"), c.assignTeacher);
r.put("/:id/enroll",   protect, authorize("admin"), c.enrollStudent);
r.put("/:id/unenroll", protect, authorize("admin"), c.unenrollStudent);
module.exports = r;
