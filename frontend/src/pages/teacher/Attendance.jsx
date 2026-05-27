import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { StatusBadge, PageHeader } from "../../components/UI";
import { Save, ClipboardCheck, RefreshCw } from "lucide-react";

const STATUSES  = ["Present", "Absent", "Late", "Excused"];
const S_STYLE   = {
  Present: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Absent:  "bg-red-100    text-red-600    border-red-300",
  Late:    "bg-yellow-100 text-yellow-700 border-yellow-300",
  Excused: "bg-slate-100  text-slate-600  border-slate-300",
};

export default function TeacherAttendance() {
  const [courses,  setCourses]  = useState([]);
  const [courseId, setCourseId] = useState("");
  const [date,     setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [att,      setAtt]      = useState({});
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  // Load teacher courses
  useEffect(() => {
    api.get("/dashboard/teacher")
      .then(r => setCourses(r.data.data?.teacher?.courses || []))
      .catch(() => toast.error("Could not load your courses"));
  }, []);

  // Load students when course or date changes
  useEffect(() => {
    if (!courseId) { setStudents([]); setAtt({}); return; }
    loadStudents();
  }, [courseId, date]);

  async function loadStudents() {
    setLoading(true);
    try {
      // Step 1: get the course (includes students by grade)
      const { data: courseData } = await api.get("/courses/" + courseId);
      const studs = courseData.data.students || [];
      setStudents(studs);

      // Step 2: get existing attendance for that date
      const { data: attData } = await api.get("/attendance/course/" + courseId, {
        params: { date }
      });

      // Map existing records by student id
      const existing = {};
      attData.data.forEach(r => {
        existing[String(r.student?._id || r.student)] = r.status;
      });

      // Build attendance map (default Present)
      const init = {};
      studs.forEach(s => { init[String(s._id)] = existing[String(s._id)] || "Present"; });
      setAtt(init);

      // Also load recent history
      const { data: histData } = await api.get("/attendance/course/" + courseId);
      setHistory(histData.data.slice(0, 15));
    } catch (err) {
      toast.error("Failed to load students: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  function markAll(status) {
    const next = {};
    students.forEach(s => { next[String(s._id)] = status; });
    setAtt(next);
  }

  async function handleSave() {
    if (!courseId)             return toast.error("Please select a course");
    if (!students.length)      return toast.error("No students to save");
    setSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s._id,
        status:    att[String(s._id)] || "Present",
        remarks:   ""
      }));
      await api.post("/attendance", { courseId, date, records });
      toast.success(`Attendance saved for ${records.length} students!`);
      // Refresh history
      const { data } = await api.get("/attendance/course/" + courseId);
      setHistory(data.data.slice(0, 15));
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const summary = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
  students.forEach(s => { const st = att[String(s._id)] || "Present"; summary[st]++; });

  const courseName = courses.find(c => String(c._id) === courseId)?.name || "";

  return (
    <div>
      <PageHeader title="Record Attendance" sub="Mark attendance for your course students" />

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Course</label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
              <option value="">-- Select your course --</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.code}) — {c.grade}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Date</label>
            <input type="date" value={date} max={new Date().toISOString().slice(0, 10)}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>
      </div>

      {courseId && (
        <>
          {/* Summary + bulk actions */}
          <div className="flex flex-wrap gap-2 mb-3 items-center">
            {Object.entries(summary).map(([st, n]) => (
              <span key={st} className={`text-xs font-bold px-3 py-1 rounded-full border ${S_STYLE[st]}`}>
                {st}: {n}
              </span>
            ))}
            <div className="ml-auto flex gap-2 flex-wrap">
              <button onClick={() => markAll("Present")}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                All Present
              </button>
              <button onClick={() => markAll("Absent")}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
                All Absent
              </button>
              <button onClick={loadStudents}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1">
                <RefreshCw size={11} />Refresh
              </button>
            </div>
          </div>

          {/* Student list */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-700">{courseName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {loading ? "Loading students..." : `${students.length} student${students.length !== 1 ? "s" : ""} enrolled`}
                </p>
              </div>
              <button onClick={handleSave} disabled={saving || !students.length || loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                {saving
                  ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Save size={13} />}
                Save Attendance
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-14">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center px-6">
                <ClipboardCheck size={40} className="text-slate-300 mb-3" />
                <p className="font-semibold text-slate-600">No students found for this course</p>
                <p className="text-sm text-slate-400 mt-1">
                  Students are enrolled automatically by grade.<br />
                  Ask the admin to add students with grade <strong>{courses.find(c => String(c._id) === courseId)?.grade}</strong>.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {students.map((s, i) => (
                  <div key={String(s._id)} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                    <span className="w-6 text-xs text-slate-300 font-semibold text-right flex-shrink-0">{i + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {s.user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.user?.name}</p>
                      <p className="text-xs text-slate-400">{s.studentId} · {s.grade}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {STATUSES.map(status => (
                        <button key={status}
                          onClick={() => setAtt(p => ({ ...p, [String(s._id)]: status }))}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all
                            ${att[String(s._id)] === status
                              ? S_STYLE[status]
                              : "border-slate-200 text-slate-400 hover:border-slate-300 bg-white"}`}>
                          {status === "Excused" ? "Ex" : status.slice(0, 2)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700">Recent Attendance Records</h3>
          </div>
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {["Student", "Date", "Status"].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-2.5">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {history.map((r, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-700">{r.student?.user?.name}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">
                    {new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
