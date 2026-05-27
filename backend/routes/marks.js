const r = require("express").Router();
const c = require("../controllers/marksController");
const { protect, authorize } = require("../middleware/auth");
r.post("/",                    protect, authorize("teacher","admin"), c.enter);
r.put("/:id",                  protect, authorize("teacher","admin"), c.update);
r.delete("/:id",               protect, authorize("teacher","admin"), c.remove);
r.get("/student/:studentId",   protect, c.getByStudent);
r.get("/course/:courseId",     protect, c.getByCourse);
module.exports = r;
