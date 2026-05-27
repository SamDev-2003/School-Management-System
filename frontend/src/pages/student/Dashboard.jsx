import { useState, useEffect } from "react";
import api from "../../services/api";
import { StatCard, Card, LoadingPage, GradeBadge } from "../../components/UI";
import { BookOpen, ClipboardCheck, Award, TrendingUp } from "lucide-react";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/dashboard/student").then(r => setData(r.data.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingPage />;
  if (!data) return null;
  const { student, stats, recentMarks } = data;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
            {student.user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h1 className="text-xl font-bold">Welcome, {student.user?.name?.split(" ")[0]}!</h1>
            <p className="text-blue-200 text-sm">{student.grade} {student.section}</p>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1 inline-block">{student.studentId}</span>
          </div>
        </div>
      </div>

      {stats.attPct < 75 && stats.attPct > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <span className="text-xl">⚠️</span>
          <div><p className="font-bold text-red-700 text-sm">Low Attendance Warning</p><p className="text-red-600 text-xs mt-0.5">Your attendance is {stats.attPct}%. Minimum required is 75%.</p></div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Courses"    value={stats.courses}   icon={BookOpen}     color="blue" />
        <StatCard label="Attendance" value={stats.attPct+"%"}  icon={ClipboardCheck} color={stats.attPct >= 75 ? "green" : "red"} />
        <StatCard label="Avg Score"  value={stats.avgPct+"%"}  icon={Award}        color={stats.avgPct >= 60 ? "green" : "orange"} />
        <StatCard label="Exams"      value={stats.totalExams} icon={TrendingUp}   color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="My Courses">
          {student.courses?.length === 0
            ? <p className="text-sm text-slate-400 text-center py-6">Not enrolled in any courses</p>
            : <div className="space-y-2">
              {student.courses.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `hsl(${i*60},60%,92%)` }}>
                    <BookOpen size={16} style={{ color: `hsl(${i*60},60%,40%)` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.teacher?.user?.name ? "Teacher: " + c.teacher.user.name + " · " : ""}{c.code}</p>
                  </div>
                  <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{c.grade}</span>
                </div>
              ))}
            </div>
          }
        </Card>

        <Card title="Recent Results">
          {recentMarks?.length === 0
            ? <p className="text-sm text-slate-400 text-center py-6">No results yet</p>
            : <div className="space-y-2">
              {recentMarks.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{m.course?.name}</p>
                    <p className="text-xs text-slate-400">{m.examType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{m.obtainedMarks}/{m.totalMarks}</p>
                    <GradeBadge grade={m.grade} />
                  </div>
                </div>
              ))}
            </div>
          }
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label:"View My Marks",      href:"/student/marks",      color:"bg-blue-600",   icon:Award },
          { label:"Check Attendance",   href:"/student/attendance", color:"bg-emerald-600",icon:ClipboardCheck },
          { label:"Academic Report",    href:"/student/report",     color:"bg-purple-600", icon:TrendingUp },
        ].map(a => (
          <a key={a.label} href={a.href} className={`${a.color} text-white rounded-xl p-4 flex items-center gap-3 font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm`}>
            <a.icon size={18} />{a.label}
          </a>
        ))}
      </div>
    </div>
  );
}
