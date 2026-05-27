import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { LoadingPage, GradeBadge, Badge, PageHeader, Card, Progress } from "../../components/UI";
import { Award } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

export default function StudentMarks() {
  const { profile } = useAuth();
  const [marks, setMarks] = useState([]);
  const [gpa, setGpa] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState("2024-2025");
  const [term, setTerm] = useState("");

  useEffect(() => {
    if (!profile?._id) return;
    setLoading(true);
    api.get("/marks/student/" + profile._id, { params: { academicYear: year, term: term || undefined } })
      .then(r => { setMarks(r.data.data); setGpa(r.data.gpa); })
      .finally(() => setLoading(false));
  }, [profile, year, term]);

  const gradeColor = { "A+":"#10b981",A:"#10b981",B:"#3b82f6",C:"#f59e0b",D:"#f97316",F:"#ef4444" };

  const byCourse = marks.reduce((acc, m) => {
    const k = m.course?._id;
    if (!k) return acc;
    if (!acc[k]) acc[k] = { course: m.course, exams: [] };
    acc[k].exams.push(m);
    return acc;
  }, {});

  const radarData = Object.values(byCourse).map(c => ({
    subject: c.course.name.split(" ").slice(0, 2).join(" "),
    score: Math.round(c.exams.reduce((s, e) => s + e.percentage, 0) / c.exams.length)
  }));

  const avgPct = marks.length ? Math.round(marks.reduce((s, m) => s + m.percentage, 0) / marks.length) : 0;
  const gradeDist = {};
  marks.forEach(m => { gradeDist[m.grade] = (gradeDist[m.grade] || 0) + 1; });

  if (loading) return <LoadingPage />;

  return (
    <div>
      <PageHeader title="My Marks & Results" sub="Academic performance overview" />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <select value={year} onChange={e => setYear(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 outline-none">
          {["2024-2025","2025-2026"].map(y => <option key={y}>{y}</option>)}
        </select>
        <select value={term} onChange={e => setTerm(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 outline-none">
          <option value="">All Terms</option>
          {["Term 1","Term 2","Term 3"].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Summary */}
      {marks.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[["Average",avgPct+"%",avgPct>=60?"#10b981":"#f59e0b"],["GPA",gpa,"#3b82f6"],["Passed",marks.filter(m=>m.percentage>=50).length+"/"+marks.length,"#10b981"],["Exams",marks.length,"#8b5cf6"]].map(([l,v,c])=>(
            <div key={l} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
              <div className="text-2xl font-bold mb-1" style={{color:c}}>{v}</div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {radarData.length >= 3 && (
          <Card title="Subject Performance">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid /><PolarAngleAxis dataKey="subject" tick={{fontSize:11}}/>
                <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2}/>
                <Tooltip formatter={v=>[v+"%","Score"]} contentStyle={{borderRadius:8,fontSize:12}}/>
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card title="Grade Distribution">
          {Object.keys(gradeDist).length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">No data</p>
            : <div className="space-y-3">
              {["A+","A","B","C","D","F"].filter(g => gradeDist[g]).map(g => {
                const pct = Math.round((gradeDist[g] / marks.length) * 100);
                return (
                  <div key={g}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold" style={{color:gradeColor[g]}}>{g}</span>
                      <span className="text-slate-500">{gradeDist[g]} exam{gradeDist[g]>1?"s":""} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{width:pct+"%",background:gradeColor[g]}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </Card>
      </div>

      {Object.values(byCourse).map(({ course, exams }) => {
        const avg = Math.round(exams.reduce((s, e) => s + e.percentage, 0) / exams.length);
        return (
          <Card key={course._id} className="mb-4" title={course.name}
            action={<div className="flex items-center gap-2"><Badge color="gray">{course.code}</Badge><span className="text-sm font-bold" style={{color:avg>=60?"#10b981":"#ef4444"}}>{avg}% avg</span></div>}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">
                  {["Exam","Marks","Score","Grade","Term","Date"].map(h=><th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase px-3 py-2">{h}</th>)}
                </tr></thead>
                <tbody>
                  {exams.map((e, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-3 py-2.5"><Badge color="gray">{e.examType}</Badge></td>
                      <td className="px-3 py-2.5 text-sm font-bold">{e.obtainedMarks}<span className="text-slate-400 font-normal">/{e.totalMarks}</span></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{width:e.percentage+"%",background:gradeColor[e.grade]||"#94a3b8"}}/>
                          </div>
                          <span className="text-xs font-bold text-slate-600">{e.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><GradeBadge grade={e.grade}/></td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{e.term}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{e.examDate?new Date(e.examDate).toLocaleDateString():"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}

      {marks.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16 text-slate-400">
          <Award size={40} className="mb-3 opacity-40" /><p className="font-medium">No marks recorded yet</p>
        </div>
      )}
    </div>
  );
}
