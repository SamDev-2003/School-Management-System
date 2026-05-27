import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Modal, Confirm, Input, Select, Btn, Badge, PageHeader, EmptyState } from "../../components/UI";
import { Plus, Search, Edit2, Trash2, UserPlus, BookOpen, Users, X } from "lucide-react";

const EMPTY = { name: "", code: "", description: "", grade: "", credits: 3, teacher: "" };

export default function AdminCourses() {
  const [courses,   setCourses]   = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [gradeF,    setGradeF]    = useState("");
  const [modal,     setModal]     = useState(null);
  const [sel,       setSel]       = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]); // for enroll panel
  const [enrollSearch,   setEnrollSearch]   = useState("");

  async function fetchAll() {
    setLoading(true);
    try {
      const [cr, tr, sr] = await Promise.all([
        api.get("/courses", { params: { search, grade: gradeF } }),
        api.get("/teachers"),
        api.get("/students", { params: { limit: 200 } })
      ]);
      setCourses(cr.data.data);
      setTeachers(tr.data.data);
      setAllStudents(sr.data.data);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, [search, gradeF]);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function save() {
    if (!form.name || !form.code || !form.grade) return toast.error("Name, code and grade are required");
    setSaving(true);
    try {
      if (modal === "add") { await api.post("/courses", form); toast.success("Course created — students auto-enrolled!"); }
      else { await api.put("/courses/" + sel._id, form); toast.success("Course updated"); }
      setModal(null); fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  }

  async function del() {
    try { await api.delete("/courses/" + confirmId); toast.success("Course deleted"); fetchAll(); }
    catch { toast.error("Delete failed"); }
  }

  async function openEnroll(course) {
    setSel(course);
    // Load full course with students
    try {
      const { data } = await api.get("/courses/" + course._id);
      setCourseStudents(data.data.students || []);
    } catch { setCourseStudents([]); }
    setModal("enroll");
  }

  async function enrollStudent(studentId) {
    try {
      await api.put("/courses/" + sel._id + "/enroll", { studentId });
      toast.success("Student enrolled");
      const { data } = await api.get("/courses/" + sel._id);
      setCourseStudents(data.data.students || []);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  }

  async function unenrollStudent(studentId) {
    try {
      await api.put("/courses/" + sel._id + "/unenroll", { studentId });
      toast.success("Student removed");
      const { data } = await api.get("/courses/" + sel._id);
      setCourseStudents(data.data.students || []);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  }

  const enrolledIds = new Set(courseStudents.map(s => String(s._id)));
  const notEnrolled = allStudents.filter(s =>
    !enrolledIds.has(String(s._id)) &&
    (!enrollSearch || s.user?.name?.toLowerCase().includes(enrollSearch.toLowerCase()) ||
     s.studentId?.toLowerCase().includes(enrollSearch.toLowerCase()))
  );

  return (
    <div>
      <PageHeader title="Courses" sub="Manage academic courses and enrollments"
        action={<Btn icon={Plus} onClick={() => { setForm(EMPTY); setSel(null); setModal("add"); }}>Add Course</Btn>}
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Search size={14} className="text-slate-400" />
          <input className="bg-transparent text-sm outline-none w-40" placeholder="Search courses..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={gradeF} onChange={e => setGradeF(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 outline-none">
          <option value="">All Grades</option>
          {["Grade 9", "Grade 10", "Grade 11", "Grade 12"].map(g => <option key={g}>{g}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {["Course", "Code", "Grade", "Credits", "Teacher", "Students", "Actions"].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {courses.length === 0
                ? <tr><td colSpan={7}><EmptyState icon={BookOpen} message="No courses found" /></td></tr>
                : courses.map(c => (
                  <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.description?.slice(0, 45) || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{c.code}</code>
                    </td>
                    <td className="px-4 py-3"><Badge color="blue">{c.grade}</Badge></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.credits} hrs</td>
                    <td className="px-4 py-3 text-sm">
                      {c.teacher?.user?.name
                        ? <span className="text-emerald-700 font-semibold">{c.teacher.user.name}</span>
                        : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color="purple">{c.studentCount ?? c.students?.length ?? 0} enrolled</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEnroll(c)} title="Manage Students"
                          className="p-1.5 rounded-lg hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors">
                          <Users size={14} />
                        </button>
                        <button onClick={() => { setSel(c); setModal("assign"); }} title="Assign Teacher"
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">
                          <UserPlus size={14} />
                        </button>
                        <button onClick={() => { setSel(c); setForm({ name: c.name, code: c.code, description: c.description || "", grade: c.grade, credits: c.credits, teacher: c.teacher?._id || "" }); setModal("edit"); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setConfirmId(c._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modal === "add" || modal === "edit"} onClose={() => setModal(null)}
        title={modal === "add" ? "Create Course" : "Edit Course"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Course Name *" value={form.name} onChange={f("name")} placeholder="Advanced Mathematics" />
          <Input label="Code *" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="MATH101" />
          <Select label="Grade *" value={form.grade} onChange={f("grade")}>
            <option value="">Select grade</option>
            {["Grade 9", "Grade 10", "Grade 11", "Grade 12"].map(g => <option key={g}>{g}</option>)}
          </Select>
          <Input label="Credits" type="number" min={1} max={6} value={form.credits} onChange={f("credits")} />
          <Select label="Teacher" value={form.teacher} onChange={f("teacher")} className="sm:col-span-2">
            <option value="">No teacher assigned</option>
            {teachers.map(t => <option key={t._id} value={t._id}>{t.user?.name} ({t.subject})</option>)}
          </Select>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
          <textarea value={form.description} onChange={f("description")} rows={2}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            placeholder="Brief course description..." />
        </div>
        {modal === "add" && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 font-medium">
              ℹ️ Students with matching grade will be <strong>automatically enrolled</strong> when this course is created.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn loading={saving} onClick={save}>{modal === "add" ? "Create Course" : "Save Changes"}</Btn>
        </div>
      </Modal>

      {/* Assign Teacher Modal */}
      {modal === "assign" && sel && (
        <Modal open title={`Assign Teacher — ${sel.name}`} onClose={() => setModal(null)} size="sm">
          <p className="text-xs text-slate-400 mb-3">Click a teacher to assign them to this course</p>
          <div className="space-y-2">
            {teachers.map(t => (
              <button key={t._id} onClick={async () => {
                try {
                  await api.put("/courses/" + sel._id + "/assign-teacher", { teacherId: t._id });
                  toast.success("Teacher assigned"); setModal(null); fetchAll();
                } catch { toast.error("Failed"); }
              }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  String(sel.teacher?._id) === String(t._id)
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                }`}>
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {t.user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{t.user?.name}</p>
                  <p className="text-xs text-slate-400">{t.subject} · {t.department}</p>
                </div>
                {String(sel.teacher?._id) === String(t._id) && <Badge color="blue">Current</Badge>}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Enroll Students Modal */}
      {modal === "enroll" && sel && (
        <Modal open title={`Manage Students — ${sel.name}`} onClose={() => { setModal(null); fetchAll(); }} size="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Enrolled students */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Enrolled ({courseStudents.length})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                {courseStudents.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-8">No students enrolled</p>
                ) : courseStudents.map(s => (
                  <div key={String(s._id)} className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {s.user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{s.user?.name}</p>
                      <p className="text-xs text-slate-400">{s.studentId} · {s.grade}</p>
                    </div>
                    <button onClick={() => unenrollStudent(s._id)}
                      className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                      title="Remove">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Not enrolled students */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Add Students
              </h4>
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 mb-2 bg-slate-50">
                <Search size={13} className="text-slate-400 flex-shrink-0" />
                <input className="bg-transparent text-xs outline-none flex-1" placeholder="Search by name or ID..."
                  value={enrollSearch} onChange={e => setEnrollSearch(e.target.value)} />
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {notEnrolled.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-8">All students enrolled</p>
                ) : notEnrolled.map(s => (
                  <div key={String(s._id)} className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {s.user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{s.user?.name}</p>
                      <p className="text-xs text-slate-400">{s.studentId} · {s.grade}</p>
                    </div>
                    <button onClick={() => enrollStudent(s._id)}
                      className="text-xs font-semibold px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex-shrink-0">
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> Students are auto-enrolled by grade. Use this panel to manually add/remove students from specific courses.
            </p>
          </div>
        </Modal>
      )}

      <Confirm open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={del}
        title="Delete Course" message="This will remove the course. Students will be unenrolled." />
    </div>
  );
}
