import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { GraduationCap, Eye, EyeOff, LogIn } from "lucide-react";

const DEMOS = [
  { role:"Admin",   email:"admin@sms.com",  pass:"admin123",   color:"bg-purple-600" },
  { role:"Teacher", email:"sarah@sms.com",  pass:"teacher123", color:"bg-emerald-600" },
  { role:"Student", email:"alice@sms.com",  pass:"student123", color:"bg-blue-600" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [show,  setShow]  = useState(false);
  const [busy,  setBusy]  = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !pass) return toast.error("Fill in all fields");
    setBusy(true);
    try {
      const user = await login(email, pass);
      toast.success("Welcome back, " + user.name.split(" ")[0] + "!");
      if (user.role==="admin") nav("/admin");
      else if (user.role==="teacher") nav("/teacher");
      else nav("/student");
    } catch(err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><GraduationCap size={20}/></div>
            <span className="text-xl font-bold">EduManage</span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4">School Management<br/><span className="text-blue-400">Made Simple</span></h1>
          <p className="text-slate-300 leading-relaxed max-w-sm">Complete platform for admins, teachers, and students to manage academics, attendance and performance.</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-4">Quick Demo Access</p>
          <div className="space-y-2">
            {DEMOS.map(d => (
              <button key={d.role} onClick={()=>{setEmail(d.email);setPass(d.pass);}}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left">
                <div className={`w-8 h-8 ${d.color} rounded-lg flex items-center justify-center text-xs font-bold`}>{d.role[0]}</div>
                <div><div className="text-sm font-semibold">{d.role}</div><div className="text-xs text-slate-400">{d.email}</div></div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><GraduationCap size={16} className="text-white"/></div>
            <span className="text-lg font-bold">EduManage</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-1">Sign in</h2>
          <p className="text-slate-400 text-sm mb-8">Enter your credentials to continue</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input type={show?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white"/>
                <button type="button" onClick={()=>setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {show?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all disabled:opacity-60 shadow-sm mt-2">
              {busy?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<LogIn size={16}/>}
              {busy?"Signing in...":"Sign In"}
            </button>
          </form>
          <div className="mt-6 lg:hidden">
            <p className="text-xs text-slate-400 text-center mb-3">Quick demo</p>
            <div className="flex gap-2">
              {DEMOS.map(d=><button key={d.role} onClick={()=>{setEmail(d.email);setPass(d.pass);}} className="flex-1 py-2 rounded-lg bg-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-300 transition-colors">{d.role}</button>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
