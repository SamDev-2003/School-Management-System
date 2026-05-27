import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck, Award, BarChart3, LogOut, Menu, X, ChevronRight, FileText } from "lucide-react";

const NAV = {
  admin:   [
    {to:"/admin",          label:"Dashboard",   icon:LayoutDashboard, end:true},
    {to:"/admin/students", label:"Students",    icon:GraduationCap},
    {to:"/admin/teachers", label:"Teachers",    icon:Users},
    {to:"/admin/courses",  label:"Courses",     icon:BookOpen},
    {to:"/admin/reports",  label:"Reports",     icon:BarChart3},
  ],
  teacher: [
    {to:"/teacher",              label:"Dashboard",   icon:LayoutDashboard, end:true},
    {to:"/teacher/attendance",   label:"Attendance",  icon:ClipboardCheck},
    {to:"/teacher/marks",        label:"Enter Marks", icon:Award},
    {to:"/teacher/students",     label:"My Students", icon:GraduationCap},
  ],
  student: [
    {to:"/student",              label:"Dashboard",   icon:LayoutDashboard, end:true},
    {to:"/student/marks",        label:"My Marks",    icon:Award},
    {to:"/student/attendance",   label:"Attendance",  icon:ClipboardCheck},
    {to:"/student/report",       label:"My Report",   icon:FileText},
  ],
};
const ROLE_COLOR = { admin:"bg-purple-500", teacher:"bg-emerald-500", student:"bg-blue-500" };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = NAV[user?.role] || [];
  const ini = user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"?";

  const doLogout = () => { logout(); toast.success("Signed out"); navigate("/login"); };

  const SideContent = () => (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center"><GraduationCap size={18} className="text-white"/></div>
          <div><div className="font-bold text-white text-sm leading-tight">EduManage</div><div className="text-[10px] text-slate-400 uppercase tracking-widest">School System</div></div>
        </div>
      </div>
      {/* Role pill */}
      <div className="px-4 py-3 border-b border-slate-700/60">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${ROLE_COLOR[user?.role]||"bg-blue-500"} bg-opacity-20 text-white`}>
          {user?.role} Portal
        </span>
      </div>
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {items.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={()=>setOpen(false)}
            className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive?"bg-blue-600 text-white":"text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
            {({isActive})=><><item.icon size={16} className={isActive?"text-white":"text-slate-500 group-hover:text-white"}/>{item.label}{isActive&&<ChevronRight size={13} className="ml-auto opacity-60"/>}</>}
          </NavLink>
        ))}
      </nav>
      {/* User */}
      <div className="px-3 py-4 border-t border-slate-700/60 space-y-2">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{ini}</div>
          <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-white truncate">{user?.name}</div><div className="text-[11px] text-slate-400 truncate">{user?.email}</div></div>
        </div>
        <button onClick={doLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
          <LogOut size={15}/>Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-60 flex-shrink-0"><SideContent/></div>
      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setOpen(false)}/>
          <div className="absolute left-0 top-0 bottom-0 w-60 z-10"><SideContent/></div>
        </div>
      )}
      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0 shadow-sm">
          <button onClick={()=>setOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100"><Menu size={18} className="text-slate-600"/></button>
          <div className="flex-1"/>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">{ini}</div>
            <div className="hidden sm:block"><div className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</div><div className="text-[11px] text-slate-400 capitalize">{user?.role}</div></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 max-w-7xl w-full mx-auto"><Outlet/></main>
      </div>
    </div>
  );
}
