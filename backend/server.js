require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.use("/api/auth",       require("./routes/auth"));
app.use("/api/students",   require("./routes/students"));
app.use("/api/teachers",   require("./routes/teachers"));
app.use("/api/courses",    require("./routes/courses"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/marks",      require("./routes/marks"));
app.use("/api/dashboard",  require("./routes/dashboard"));

app.get("/", (req, res) => res.json({ message: "SMS API running" }));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ success: false, message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
