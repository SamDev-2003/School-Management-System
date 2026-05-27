import { useState, useEffect } from "react";
import api from "../../services/api";
import { StatCard, Card, LoadingPage, Badge } from "../../components/UI";
import { BookOpen, Users, ClipboardCheck, Award } from "lucide-react";

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/dashboard/teacher").then(r => setData(r.data.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingPage />;
  if (!data) return null;
  const { teacher, stats } = data;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-emerald-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
            {teacher.user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h1 className="text-xl font-bold">Welcome, {teacher.user?.name?.split(" ")[0]}!</h1>
            <p className="text-emerald-200 text-sm">{teacher.subject} · {teacher.department}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{teacher.teacherId}</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{teacher.qualification}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="My Courses" value={stats.totalCourses} icon={BookOpen} color="blue" />
        <StatCard label="My Students" value={stats.totalStudents} icon={Users} color="green" />
        <StatCard label="Today's Att." value={stats.todayAtt} icon={ClipboardCheck} color="purple" />
      </div>

      <Card title="My Courses">
        {teacher.courses?.length === 0
          ? <p className="text-sm text-slate-400 text-center py-8">No courses assigned yet</p>
          : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teacher.courses.map((c, i) => (
              <div key={i} className="p-4 border border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-800 text-sm">{c.name}</h3>
                  <Badge color="blue">{c.grade}</Badge>
                </div>
                <code className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{c.code}</code>
                <p className="text-xs text-slate-500 mt-2">{c.students?.length || 0} students enrolled</p>
              </div>
            ))}
          </div>
        }
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Record Attendance", href: "/teacher/attendance", color: "bg-blue-600", icon: ClipboardCheck },
          { label: "Enter Marks", href: "/teacher/marks", color: "bg-emerald-600", icon: Award },
          { label: "View Students", href: "/teacher/students", color: "bg-purple-600", icon: Users },
        ].map(a => (
          <a key={a.label} href={a.href}
            className={`${a.color} text-white rounded-xl p-4 flex items-center gap-3 font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm`}>
            <a.icon size={18} />{a.label}
          </a>
        ))}
      </div>
    </div>
  );
}
