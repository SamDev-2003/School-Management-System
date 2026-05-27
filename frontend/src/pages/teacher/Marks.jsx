import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { GradeBadge, PageHeader } from "../../components/UI";
import { Save, Award, RefreshCw } from "lucide-react";

const EXAM_TYPES = ["Quiz", "Midterm", "Final", "Assignment", "Project"];
const TOTALS     = { Quiz: 20, Midterm: 50, Final: 100, Assignment: 30, Project: 50 };
const TERMS      = ["Term 1", "Term 2", "Term 3"];

function calcGrade(obtained, total) {
  if (!obtained || !total || total === 0) return null;
  const p = Math.round((obtained / total) * 100);
  let grade = "F", color = "#ef4444";
  if (p >= 90) { grade = "A+"; color = "#10b981"; }
  else if (p >= 80) { grade = "A";  color = "#10b981"; }
  else if (p >= 70) { grade = "B";  color = "#3b82f6"; }
  else if (p >= 60) { grade = "C";  color = "#f59e0b"; }
  else if (p >= 50) { grade = "D";  color = "#f97316"; }
  return { grade, color, pct: p };
}

export default function TeacherMarks() {
  const [courses,    setCourses]    = useState([]);
  const [courseId,   setCourseId]   = useState("");
  const [examType,   setExamType]   = useState("Quiz");
  const [totalMarks, setTotalMarks] = useState(20);
  const [term,       setTerm]       = useState("Term 1");
  const [year,       setYear]       = useState("2024-2025");
  const [students,   setStudents]   = useState([]);
  const [input,      setInput]      = useState({});   // { studentId: "score" }
  const [existing,   setExisting]   = useState([]);
  const [tab,        setTab]        = useState("enter");
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);

  // Load teacher courses on mount
  useEffect(() => {
    api.get("/dashboard/teacher")
      .then(r => setCourses(r.data.data?.teacher?.courses || []))
      .catch(() => toast.error("Could not load your courses"));
  }, []);

  // Auto-fill total marks when exam type changes
  useEffect(() => { setTotalMarks(TOTALS[examType] || 20); }, [examType]);

  // Load students + existing marks when filters change
  useEffect(() => {
    if (!courseId) { setStudents([]); setInput({}); setExisting([]); return; }
    loadData();
  }, [courseId, examType, term, year]);

  async function loadData() {
    setLoading(true);
    try {
      const [courseRes, marksRes] = await Promise.all([
        api.get("/courses/" + courseId),
        api.get("/marks/course/" + courseId, { params: { examType, term, academicYear: year } })
      ]);

      const studs = courseRes.data.data.students || [];
      setStudents(studs);
      setExisting(marksRes.data.data);

      // Pre-fill any already-saved marks
      const savedMap = {};
      marksRes.data.data.forEach(m => {
        savedMap[String(m.student?._id || m.student)] = m.obtainedMarks;
      });
      const initInput = {};
      studs.forEach(s => {
        const saved = savedMap[String(s._id)];
        initInput[String(s._id)] = saved !== undefined ? String(saved) : "";
      });
      setInput(initInput);
    } catch (err) {
      toast.error("Failed to load: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!courseId)        return toast.error("Select a course first");
    if (!students.length) return toast.error("No students found in this course");

    const toSave = students.filter(s => {
      const v = input[String(s._id)];
      return v !== "" && v !== undefined && !isNaN(parseFloat(v));
    });
    if (!toSave.length) return toast.error("Enter at least one mark before saving");

    setSaving(true);
    let saved = 0, errors = 0;
    for (const s of toSave) {
      const v = parseFloat(input[String(s._id)]);
      if (v < 0 || v > parseFloat(totalMarks)) { errors++; continue; }
      try {
        await api.post("/marks", {
          student: s._id, course: courseId, examType,
          totalMarks: parseFloat(totalMarks), obtainedMarks: v,
          academicYear: year, term
        });
        saved++;
      } catch { errors++; }
    }

    if (saved > 0) toast.success(`✅ Marks saved for ${saved} student${saved > 1 ? "s" : ""}!`);
    if (errors > 0) toast.error(`${errors} record(s) failed — check values are 0–${totalMarks}`);

    // Refresh existing marks
    try {
      const { data } = await api.get("/marks/course/" + courseId, { params: { examType, term, academicYear: year } });
      setExisting(data.data);
    } catch (_) {}
    setSaving(false);
  }

  const courseName = courses.find(c => String(c._id) === courseId)?.name || "";
  const courseGrade = courses.find(c => String(c._id) === courseId)?.grade || "";

  return (
    <div>
      <PageHeader title="Marks & Grades" sub="Enter and review student exam results" />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Course</label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
              <option value="">-- Select course --</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name} — {c.grade}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Exam Type</label>
            <select value={examType} onChange={e => setExamType(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
              {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Total Marks</label>
            <input type="number" min={1} value={totalMarks} onChange={e => setTotalMarks(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Term</label>
            <select value={term} onChange={e => setTerm(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
              {TERMS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 border-t border-slate-100 pt-4">
          {[["enter", "✏️  Enter Marks"], ["view", "📊  View Results"]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === t ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              {label}
            </button>
          ))}
          {courseId && (
            <button onClick={loadData} className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <RefreshCw size={12} />Refresh
            </button>
          )}
        </div>
      </div>

      {/* ── ENTER MARKS ── */}
      {tab === "enter" && courseId && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-700">{courseName} — {examType}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {loading ? "Loading..." : `${students.length} student${students.length !== 1 ? "s" : ""} · out of ${totalMarks} marks · ${term} ${year}`}
              </p>
            </div>
            <button onClick={handleSave} disabled={saving || !students.length || loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
              {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={13} />}
              Save All Marks
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-14">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center py-14 px-6 text-center">
              <Award size={40} className="text-slate-300 mb-3" />
              <p className="font-semibold text-slate-600">No students found</p>
              <p className="text-sm text-slate-400 mt-1">
                Students in <strong>{courseGrade}</strong> are automatically enrolled.<br />
                Ask admin to create students with this grade.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {students.map((s, i) => {
                const val = input[String(s._id)];
                const gi  = val !== "" && val !== undefined ? calcGrade(parseFloat(val), parseFloat(totalMarks)) : null;
                return (
                  <div key={String(s._id)} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                    <span className="w-6 text-xs text-slate-300 font-semibold text-right flex-shrink-0">{i + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {s.user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.user?.name}</p>
                      <p className="text-xs text-slate-400">{s.studentId}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="number" min={0} max={totalMarks} placeholder="—"
                        value={val}
                        onChange={e => setInput(p => ({ ...p, [String(s._id)]: e.target.value }))}
                        className="w-20 text-center px-2 py-1.5 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                      <span className="text-xs text-slate-400 w-8">/{totalMarks}</span>
                      {gi ? (
                        <div className="flex items-center gap-1.5 min-w-16">
                          <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: gi.pct + "%", background: gi.color }} />
                          </div>
                          <span className="text-xs font-bold w-5" style={{ color: gi.color }}>{gi.grade}</span>
                          <span className="text-xs text-slate-400">{gi.pct}%</span>
                        </div>
                      ) : (
                        <div className="min-w-16" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW RESULTS ── */}
      {tab === "view" && courseId && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700">Results — {examType} · {term} · {year}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{existing.length} record{existing.length !== 1 ? "s" : ""} saved</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : existing.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-400">
              <Award size={36} className="mb-3 opacity-30" />
              <p className="font-medium">No marks recorded yet for this filter</p>
              <p className="text-xs mt-1">Switch to "Enter Marks" tab to add them</p>
            </div>
          ) : (
            <table className="w-full">
              <thead><tr className="bg-slate-50 border-b border-slate-100">
                {["#", "Student", "Marks", "Percentage", "Grade"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-2.5">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {existing.map((m, i) => {
                  const gi = calcGrade(m.obtainedMarks, m.totalMarks);
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-xs text-slate-400 font-semibold">{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <p className="text-sm font-semibold text-slate-800">{m.student?.user?.name}</p>
                        <p className="text-xs text-slate-400">{m.student?.studentId}</p>
                      </td>
                      <td className="px-4 py-2.5 text-sm font-bold">
                        {m.obtainedMarks}<span className="text-slate-400 font-normal">/{m.totalMarks}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: m.percentage + "%", background: gi?.color }} />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{m.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5"><GradeBadge grade={m.grade} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
