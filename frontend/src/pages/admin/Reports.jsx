import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { LoadingPage, Badge, GradeBadge, StatusBadge, Progress, PageHeader, Card } from "../../components/UI";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Search, FileText, Printer } from "lucide-react";

export default function AdminReports() {
  const [students, setStudents] = useState([]);
  const [selId, setSelId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/students", { params: { limit: 200 } }).then(r => setStudents(r.data.data)).catch(() => {});
  }, []);

  const filtered = students.filter(s =>
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  const fetchReport = async () => {
    if (!selId) return toast.error("Select a student first");
    setLoading(true);
    try {
      const [marksR, attR] = await Promise.all([
        api.get("/marks/student/" + selId),
        api.get("/attendance/student/" + selId)
      ]);
      const student = students.find(s => s._id === selId);
      setReport({ student, marks: marksR.data.data, gpa: marksR.data.gpa, attendance: attR.data.data });
    } catch { toast.error("Failed to load report"); }
    finally { setLoading(false); }
  };

  const gradeColor = { "A+": "#10b981", A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#f97316", F: "#ef4444" };

  const marksChart = report
    ? Object.entries(report.marks.reduce((acc, m) => {
        const k = m.course?.name || "Unknown";
        if (!acc[k]) acc[k] = { name: k.split(" ").slice(0, 2).join(" "), total: 0, count: 0 };
        acc[k].total += m.percentage; acc[k].count++;
        return acc;
      }, {})).map(([, v]) => ({ name: v.name, avg: Math.round(v.total / v.count) }))
    : [];

  const totalAtt = report ? report.attendance.reduce((s, c) => s + c.total, 0) : 0;
  const totalPresent = report ? report.attendance.reduce((s, c) => s + c.present, 0) : 0;
  const overallAttPct = totalAtt > 0 ? Math.round((totalPresent / totalAtt) * 100) : 0;
  const avgMarks = report?.marks.length ? Math.round(report.marks.reduce((s, m) => s + m.percentage, 0) / report.marks.length) : 0;

  return (
    <div>
      <PageHeader title="Academic Reports" sub="Generate detailed student reports" />

      <Card className="mb-6">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Search Student</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
              <Search size={14} className="text-slate-400" />
              <input className="bg-transparent text-sm outline-none flex-1" placeholder="Name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Select Student</label>
            <select value={selId} onChange={e => setSelId(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-blue-400">
              <option value="">-- Choose student --</option>
              {filtered.map(s => <option key={s._id} value={s._id}>{s.user?.name} ({s.studentId}) — {s.grade}</option>)}
            </select>
          </div>
          <button onClick={fetchReport} disabled={loading || !selId}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FileText size={15} />}
            Generate
          </button>
        </div>
      </Card>

      {report && (
        <div className="space-y-6">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                  {report.student?.user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{report.student?.user?.name}</h2>
                  <p className="text-blue-200 text-sm">{report.student?.user?.email}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{report.student?.studentId}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{report.student?.grade} {report.student?.section}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                {[["Avg Score", avgMarks + "%"], ["Attendance", overallAttPct + "%"], ["GPA", report.gpa], ["Courses", report.student?.courses?.length || 0]].map(([l, v]) => (
                  <div key={l} className="text-center bg-white/10 rounded-xl px-4 py-3">
                    <div className="text-2xl font-bold">{v}</div>
                    <div className="text-xs text-blue-200 mt-0.5">{l}</div>
                  </div>
                ))}
                <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-all self-start">
                  <Printer size={14} />Print
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance chart */}
            {marksChart.length > 0 && (
              <Card title="Average Score by Subject">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={marksChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [v + "%", "Avg"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Attendance by course */}
            <Card title="Attendance by Course">
              {report.attendance.length === 0
                ? <p className="text-sm text-slate-400 text-center py-8">No attendance data</p>
                : <div className="space-y-4">
                  {report.attendance.map((c, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">{c.course?.name}</span>
                        <span className="font-bold" style={{ color: c.percentage >= 75 ? "#10b981" : "#ef4444" }}>{c.percentage}%</span>
                      </div>
                      <Progress value={c.percentage} color={c.percentage >= 75 ? "green" : "red"} />
                      <div className="flex gap-3 mt-1">
                        {[["P", c.present, "text-emerald-600"], ["A", c.absent, "text-red-600"], ["L", c.late, "text-yellow-600"]].map(([l, v, cl]) => (
                          <span key={l} className={`text-xs font-semibold ${cl}`}>{l}: {v}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              }
            </Card>
          </div>

          {/* Marks table */}
          <Card title="Detailed Marks">
            {report.marks.length === 0
              ? <p className="text-sm text-slate-400 text-center py-8">No marks recorded</p>
              : <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-100">
                    {["Course", "Exam Type", "Marks", "Percentage", "Grade", "Term", "Date"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 py-2">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {report.marks.map((m, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-3 py-2.5 text-sm font-medium text-slate-800">{m.course?.name}</td>
                        <td className="px-3 py-2.5"><Badge color="gray">{m.examType}</Badge></td>
                        <td className="px-3 py-2.5 text-sm font-bold">{m.obtainedMarks}<span className="text-slate-400 font-normal">/{m.totalMarks}</span></td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5"><div className="h-full rounded-full" style={{ width: m.percentage + "%", background: gradeColor[m.grade] || "#94a3b8" }} /></div>
                            <span className="text-xs font-bold">{m.percentage}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5"><GradeBadge grade={m.grade} /></td>
                        <td className="px-3 py-2.5 text-xs text-slate-500">{m.term}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-500">{m.examDate ? new Date(m.examDate).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          </Card>
        </div>
      )}
    </div>
  );
}
