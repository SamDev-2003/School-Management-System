const User = require("../models/User");
const Teacher = require("../models/Teacher");

const pop = [{ path:"user", select:"name email phone address" }, { path:"courses", select:"name code grade" }];

exports.getAll = async (req, res) => {
  try {
    const { search="" } = req.query;
    let list = await Teacher.find({ isActive:true }).populate(pop).sort({ createdAt:-1 });
    if (search) list = list.filter(t =>
      t.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.teacherId?.toLowerCase().includes(search.toLowerCase())
    );
    res.json({ success:true, count:list.length, data:list });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const t = await Teacher.findById(req.params.id).populate(pop);
    if (!t) return res.status(404).json({ success:false, message:"Not found" });
    res.json({ success:true, data:t });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password="teacher123", phone, address, subject, department, qualification, experience } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ success:false, message:"Email already exists" });
    const count = await Teacher.countDocuments();
    const user = await User.create({ name, email, password, phone, address, role:"teacher" });
    const teacher = await Teacher.create({ user:user._id, teacherId:"TCH"+String(count+1).padStart(4,"0"), subject, department, qualification, experience });
    await teacher.populate(pop);
    res.status(201).json({ success:true, data:teacher });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, phone, address, subject, department, qualification, experience } = req.body;
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success:false, message:"Not found" });
    await User.findByIdAndUpdate(teacher.user, { name, phone, address });
    const updated = await Teacher.findByIdAndUpdate(req.params.id, { subject, department, qualification, experience }, { new:true }).populate(pop);
    res.json({ success:true, data:updated });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success:false, message:"Not found" });
    await Teacher.findByIdAndUpdate(req.params.id, { isActive:false });
    await User.findByIdAndUpdate(teacher.user, { isActive:false });
    res.json({ success:true, message:"Teacher deleted" });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
};
