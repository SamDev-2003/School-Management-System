import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { LoadingPage, StatusBadge, PageHeader, Card, Progress } from "../../components/UI";
import { ClipboardCheck } from "lucide-react";

export default function StudentAttendance() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!profile?._id) return;
    api.get("/attendance/student/" + profile._id)
      .then(r => setSummary(r.data.data))
      .finally(() => setLoading(false));
  }, [profile]);

  const totalClasses = summary.reduce((s, c) => s + c.total, 0);
  const totalPresent = summary.reduce((s, c) => s + c.present, 0);
  const overall = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

  if (loading) return <LoadingPage />;

  return (
    <div>
      <PageHeader title="My Attendance" sub="Track your attendance across all courses" />

      {/* Overall summary */}
      {summary.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-blue-200 text-xs uppercase tracking-widest font-semibold mb-2">Overall Attendance</p>
              <div className="text-5xl font-extrabold mb-1">{overall}%</div>
              <p className="text-blue-200 text-sm">{totalPresent} present out of {totalClasses} classes</p>
              {overall < 75 && <p className="text-red-300 text-xs mt-2 font-semibold">⚠️ Below 75% minimum requirement</p>}
            </div>
            <div className="w-24 h-24 relative flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8"/>
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke={overall >= 75 ? "#34d399" : "#f87171"} strokeWidth="8"
                  strokeDasharray={`${(overall/100)*251} 251`} strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">{overall}%</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/20">
            {[["Present",totalPresent,"#34d399"],["Absent",summary.reduce((s,c)=>s+c.absent,0),"#f87171"],["Late",summary.reduce((s,c)=>s+c.late,0),"#fbbf24"],["Excused",summary.reduce((s,c)=>s+c.excused,0),"#94a3b8"]].map(([l,v,c])=>(
              <div key={l} className="text-center"><div className="text-xl font-bold" style={{color:c}}>{v}</div><div className="text-xs text-blue-200">{l}</div></div>
            ))}
          </div>
        </div>
      )}

      {summary.length === 0
        ? <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16 text-slate-400">
            <ClipboardCheck size={40} className="mb-3 opacity-40" /><p className="font-medium">No attendance records yet</p>
          </div>
        : <div className="space-y-4">
          {summary.map((c, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpanded(expanded === i ? null : i)}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{c.course?.name}</h3>
                    <p className="text-xs text-slate-400">{c.course?.code} · {c.total} total classes</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{color:c.percentage>=75?"#10b981":"#ef4444"}}>{c.percentage}%</div>
                    <p className="text-xs text-slate-400">attendance</p>
                  </div>
                </div>
                <Progress value={c.percentage} color={c.percentage>=75?"green":"red"} />
                <div className="flex gap-4 mt-2">
                  {[["Present",c.present,"text-emerald-600"],["Absent",c.absent,"text-red-500"],["Late",c.late,"text-yellow-600"],["Excused",c.excused,"text-slate-500"]].map(([l,v,cl])=>(
                    <span key={l} className={`text-xs font-semibold ${cl}`}>{l}: {v}</span>
                  ))}
                </div>
              </div>
              {expanded === i && c.records?.length > 0 && (
                <div className="border-t border-slate-100 p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Recent Records</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {c.records.slice(0, 20).map((r, j) => (
                      <div key={j} className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-slate-50">
                        <span className="text-sm text-slate-600">{new Date(r.date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
                        <StatusBadge status={r.status}/>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      }
    </div>
  );
}
