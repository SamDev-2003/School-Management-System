import { useState, useEffect } from "react";
import api from "../../services/api";
import { StatCard, Card, LoadingPage, Badge } from "../../components/UI";
import { GraduationCap, Users, BookOpen, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6","#22c55e","#f59e0b","#ef4444","#8b5cf6","#14b8a6"];

export default function AdminDashboard() {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/dashboard/admin").then(r=>setD(r.data.data)).finally(()=>setLoading(false)); }, []);
  if (loading) return <LoadingPage/>;
  if (!d) return null;
  const barData = d.gradeDist.map(g=>({ name:g._id, count:g.count }));
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1><p className="text-sm text-slate-400 mt-0.5">Institution overview</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Students"  value={d.totalStudents} icon={GraduationCap} color="blue"/>
        <StatCard label="Teachers"  value={d.totalTeachers} icon={Users}         color="green"/>
        <StatCard label="Courses"   value={d.totalCourses}  icon={BookOpen}      color="purple"/>
        <StatCard label="All Users" value={d.totalUsers}    icon={TrendingUp}    color="orange"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Students by Grade">
          {barData.length===0?<p className="text-sm text-slate-400 text-center py-8">No data</p>:
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}><XAxis dataKey="name" tick={{fontSize:12}}/><YAxis tick={{fontSize:12}}/><Tooltip contentStyle={{borderRadius:8,fontSize:12}}/><Bar dataKey="count" fill="#3b82f6" radius={[6,6,0,0]}/></BarChart>
          </ResponsiveContainer>}
        </Card>
        <Card title="Grade Distribution">
          {barData.length===0?<p className="text-sm text-slate-400 text-center py-8">No data</p>:
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={barData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name,percent})=>`${name}: ${(percent*100).toFixed(0)}%`} fontSize={11}>
              {barData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={{borderRadius:8,fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>}
        </Card>
      </div>
      <Card title="Recently Added Students">
        <div className="space-y-3">
          {d.recentStudents.length===0?<p className="text-sm text-slate-400 text-center py-4">No students yet</p>:
          d.recentStudents.map((s,i)=>(
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {s.user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"?"}
              </div>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-700 truncate">{s.user?.name}</p><p className="text-xs text-slate-400 truncate">{s.user?.email}</p></div>
              <Badge color="blue">{s.grade}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
