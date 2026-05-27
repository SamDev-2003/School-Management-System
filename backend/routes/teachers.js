const r = require("express").Router();
const c = require("../controllers/teacherController");
const { protect, authorize } = require("../middleware/auth");
r.get("/",    protect, authorize("admin"), c.getAll);
r.get("/:id", protect, c.getOne);
r.post("/",   protect, authorize("admin"), c.create);
r.put("/:id", protect, authorize("admin"), c.update);
r.delete("/:id", protect, authorize("admin"), c.remove);
module.exports = r;
