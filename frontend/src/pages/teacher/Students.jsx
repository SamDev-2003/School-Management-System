import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Badge, PageHeader } from "../../components/UI";
import { Search, Users, RefreshCw } from "lucide-react";

export default function TeacherStudents() {
  const [courses,    setCourses]    = useState([]);
  const [courseId,   setCourseId]   = useState("");
  const [students,   setStudents]   = useState([]);
  const [courseInfo, setCourseInfo] = useState(null);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    api.get("/dashboard/teacher")
      .then(r => setCourses(r.data.data?.teacher?.courses || []))
      .catch(() => toast.error("Could not load courses"));
  }, []);

  useEffect(() => {
    if (!courseId) { setStudents([]); setCourseInfo(null); return; }
    loadStudents();
  }, [courseId]);

  async function loadStudents() {
    setLoading(true);
    try {
      const { data } = await api.get("/courses/" + courseId);
      setStudents(data.data.students || []);
      setCourseInfo(data.data);
    } catch (err) {
      toast.error("Failed to load students: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  const filtered = students.filter(s =>
    !search ||
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    s.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="My Students" sub="Students enrolled in your courses" />

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Course</label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400">
              <option value="">-- Select a course --</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code}) — {c.grade}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Search</label>
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50">
              <Search size={14} className="text-slate-400 flex-shrink-0" />
              <input className="bg-transparent text-sm outline-none flex-1" placeholder="Name, ID or email..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          {courseId && (
            <div className="flex items-end">
              <button onClick={loadStudents} className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <RefreshCw size={14} />Refresh
              </button>
            </div>
          )}
        </div>

        {/* Course info chips */}
        {courseInfo && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100 flex-wrap">
            {[
              ["Course",   courseInfo.name,              "blue"],
              ["Grade",    courseInfo.grade,              "purple"],
              ["Code",     courseInfo.code,               "gray"],
              ["Students", students.length + " enrolled", "green"],
            ].map(([l, v, c]) => (
              <div key={l} className={`bg-${c}-50 rounded-xl px-4 py-2`}>
                <p className={`text-xs text-${c}-400`}>{l}</p>
                <p className={`text-sm font-bold text-${c}-700`}>{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student table */}
      {!courseId ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16 text-slate-400">
          <Users size={40} className="mb-3 opacity-30" />
          <p className="font-medium">Select a course to view its students</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">Student List</h3>
            <div className="flex items-center gap-2">
              <Badge color="blue">{filtered.length} student{filtered.length !== 1 ? "s" : ""}</Badge>
              {search && filtered.length !== students.length && (
                <span className="text-xs text-slate-400">of {students.length} total</span>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center px-6">
              <Users size={36} className="text-slate-300 mb-3" />
              <p className="font-semibold text-slate-600">
                {students.length === 0
                  ? "No students enrolled in this course"
                  : "No students match your search"}
              </p>
              {students.length === 0 && (
                <p className="text-sm text-slate-400 mt-1">
                  Students are enrolled automatically by grade ({courseInfo?.grade}).<br/>
                  Ask the admin to add students for this grade.
                </p>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead><tr className="bg-slate-50 border-b border-slate-100">
                {["#", "Student", "ID", "Grade", "Gender", "Parent"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-2.5">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={String(s._id)} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-300 font-semibold">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {s.user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{s.user?.name}</p>
                          <p className="text-xs text-slate-400">{s.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge color="gray">{s.studentId}</Badge></td>
                    <td className="px-4 py-3"><Badge color="blue">{s.grade} {s.section}</Badge></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{s.gender}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{s.parentName || "—"}</p>
                      <p className="text-xs text-slate-400">{s.parentPhone}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
