import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { LoadingPage, GradeBadge, Progress, Card } from "../../components/UI";
import { Printer, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function StudentReport() {
  const { profile, user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [attSummary, setAttSummary] = useState([]);
  const [gpa, setGpa] = useState("0.00");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?._id) return;
    Promise.all([
      api.get("/marks/student/" + profile._id),
      api.get("/attendance/student/" + profile._id)
    ]).then(([mr, ar]) => {
      setMarks(mr.data.data); setGpa(mr.data.gpa);
      setAttSummary(ar.data.data);
    }).finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <LoadingPage />;

  const avgPct = marks.length ? Math.round(marks.reduce((s, m) => s + m.percentage, 0) / marks.length) : 0;
  const totalAtt = attSummary.reduce((s, c) => s + c.total, 0);
  const totalPresent = attSummary.reduce((s, c) => s + c.present, 0);
  const overallAtt = totalAtt > 0 ? Math.round((totalPresent / totalAtt) * 100) : 0;

  const gradeColor = { "A+":"#10b981",A:"#10b981",B:"#3b82f6",C:"#f59e0b",D:"#f97316",F:"#ef4444" };
  const subjectData = Object.entries(marks.reduce((acc, m) => {
    const k = m.course?.name || "Unknown";
    if (!acc[k]) acc[k] = { total: 0, count: 0 };
    acc[k].total += m.percentage; acc[k].count++;
    return acc;
  }, {})).map(([name, d]) => ({ name: name.split(" ").slice(0, 2).join(" "), avg: Math.round(d.total / d.count) }));

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-800">My Academic Report</h1><p className="text-sm text-slate-400 mt-0.5">Full academic summary</p></div>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all">
          <Printer size={15}/>Print Report
        </button>
      </div>

      {/* Student card */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-6 text-white mb-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-blue-200 text-sm">{user?.email}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{profile?.studentId}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{profile?.grade} {profile?.section}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[["GPA", gpa, "#60a5fa"],["Avg Score", avgPct+"%", "#34d399"],["Attendance", overallAtt+"%", overallAtt>=75?"#34d399":"#f87171"],["Courses", profile?.courses?.length||0, "#a78bfa"]].map(([l,v,c])=>(
              <div key={l} className="bg-white/10 rounded-xl px-4 py-3 text-center min-w-16">
                <div className="text-2xl font-bold" style={{color:c}}>{v}</div>
                <div className="text-xs text-blue-200 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {subjectData.length > 0 && (
          <Card title="Performance by Subject">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="name" tick={{fontSize:11}}/><YAxis domain={[0,100]} tick={{fontSize:11}}/>
                <Tooltip formatter={v=>[v+"%","Avg"]} contentStyle={{borderRadius:8,fontSize:12}}/>
                <Bar dataKey="avg" fill="#3b82f6" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card title="Attendance by Course">
          {attSummary.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">No attendance data</p>
            : <div className="space-y-4">
              {attSummary.map((c, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{c.course?.name}</span>
                    <span className="font-bold" style={{color:c.percentage>=75?"#10b981":"#ef4444"}}>{c.percentage}%</span>
                  </div>
                  <Progress value={c.percentage} color={c.percentage>=75?"green":"red"}/>
                </div>
              ))}
            </div>
          }
        </Card>
      </div>

      <Card title="Complete Marks Record">
        {marks.length === 0
          ? <div className="flex flex-col items-center py-12 text-slate-400"><FileText size={36} className="mb-3 opacity-40"/><p>No marks recorded</p></div>
          : <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                {["Course","Exam","Marks","%","Grade","Term"].map(h=><th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase px-3 py-2">{h}</th>)}
              </tr></thead>
              <tbody>
                {marks.map((m, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-3 py-2.5 text-sm font-medium text-slate-800">{m.course?.name}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{m.examType}</td>
                    <td className="px-3 py-2.5 text-sm font-bold">{m.obtainedMarks}<span className="text-slate-400 font-normal">/{m.totalMarks}</span></td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:m.percentage+"%",background:gradeColor[m.grade]||"#94a3b8"}}/></div>
                        <span className="text-xs font-bold text-slate-600">{m.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><GradeBadge grade={m.grade}/></td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{m.term}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </Card>
    </div>
  );
}
