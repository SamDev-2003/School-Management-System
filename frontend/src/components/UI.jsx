import { X, AlertTriangle } from "lucide-react";

export function Spinner({ size="md" }) {
  const s = size==="sm"?"w-4 h-4 border-2":size==="lg"?"w-10 h-10 border-4":"w-6 h-6 border-2";
  return <div className={`${s} border-blue-600 border-t-transparent rounded-full animate-spin`}/>;
}
export function LoadingPage() {
  return <div className="flex items-center justify-center min-h-64"><Spinner size="lg"/></div>;
}
export function Badge({ children, color="gray" }) {
  const c={gray:"bg-slate-100 text-slate-600",blue:"bg-blue-50 text-blue-700",green:"bg-emerald-50 text-emerald-700",red:"bg-red-50 text-red-700",yellow:"bg-yellow-50 text-yellow-700",purple:"bg-purple-50 text-purple-700",orange:"bg-orange-50 text-orange-700"};
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c[color]||c.gray}`}>{children}</span>;
}
export function GradeBadge({ grade }) {
  const m={"A+":"green",A:"green",B:"blue",C:"yellow",D:"orange",F:"red"};
  return <Badge color={m[grade]||"gray"}>{grade}</Badge>;
}
export function StatusBadge({ status }) {
  const m={Present:"green",Absent:"red",Late:"yellow",Excused:"gray"};
  return <Badge color={m[status]||"gray"}>{status}</Badge>;
}
export function StatCard({ label, value, icon:Icon, color="blue", sub }) {
  const c={blue:{bg:"bg-blue-50",ic:"text-blue-600",v:"text-blue-700"},green:{bg:"bg-emerald-50",ic:"text-emerald-600",v:"text-emerald-700"},purple:{bg:"bg-purple-50",ic:"text-purple-600",v:"text-purple-700"},orange:{bg:"bg-orange-50",ic:"text-orange-600",v:"text-orange-700"},red:{bg:"bg-red-50",ic:"text-red-600",v:"text-red-700"}};
  const cl=c[color]||c.blue;
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-3xl font-bold ${cl.v}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        {Icon && <div className={`${cl.bg} p-3 rounded-xl`}><Icon size={20} className={cl.ic}/></div>}
      </div>
    </div>
  );
}
export function Card({ children, className="", title, action }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}>
      {(title||action) && <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">{title&&<h3 className="text-sm font-bold text-slate-700">{title}</h3>}{action&&<div>{action}</div>}</div>}
      <div className="p-5">{children}</div>
    </div>
  );
}
export function Modal({ open, onClose, title, children, size="md" }) {
  if (!open) return null;
  const w={sm:"max-w-md",md:"max-w-lg",lg:"max-w-2xl",xl:"max-w-4xl"};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${w[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16}/></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
export function Confirm({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-3"><AlertTriangle size={20} className="text-red-500 flex-shrink-0"/><h3 className="font-bold text-slate-800">{title}</h3></div>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
          <button onClick={()=>{onConfirm();onClose();}} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">Delete</button>
        </div>
      </div>
    </div>
  );
}
export function Input({ label, error, className="", ...props }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>}
      <input className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" {...props}/>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
export function Select({ label, error, children, className="", ...props }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>}
      <select className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" {...props}>{children}</select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
export function Btn({ children, variant="primary", size="md", loading, icon:Icon, ...props }) {
  const v={primary:"bg-blue-600 hover:bg-blue-700 text-white shadow-sm",secondary:"bg-slate-100 hover:bg-slate-200 text-slate-700",danger:"bg-red-500 hover:bg-red-600 text-white",ghost:"hover:bg-slate-100 text-slate-600",outline:"border border-slate-200 hover:bg-slate-50 text-slate-700"};
  const s={sm:"px-3 py-1.5 text-xs",md:"px-4 py-2 text-sm",lg:"px-5 py-2.5 text-sm"};
  return (
    <button className={`inline-flex items-center gap-2 font-semibold rounded-lg transition-all ${v[variant]} ${s[size]} disabled:opacity-50 disabled:cursor-not-allowed`} disabled={loading} {...props}>
      {loading?<div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"/>:Icon&&<Icon size={14}/>}
      {children}
    </button>
  );
}
export function Progress({ value, color="blue" }) {
  const c={blue:"bg-blue-500",green:"bg-emerald-500",red:"bg-red-500",yellow:"bg-yellow-500",orange:"bg-orange-500"};
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${c[color]||c.blue}`} style={{width:`${Math.min(100,Math.max(0,value))}%`}}/>
      </div>
      <span className="text-xs font-semibold text-slate-500 w-9 text-right">{value}%</span>
    </div>
  );
}
export function Avatar({ name="", size="md" }) {
  const ini=name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const s={sm:"w-8 h-8 text-xs",md:"w-10 h-10 text-sm",lg:"w-12 h-12 text-base"};
  return <div className={`${s[size]} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-white flex-shrink-0`}>{ini}</div>;
}
export function PageHeader({ title, sub, action }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div><h1 className="text-2xl font-bold text-slate-800">{title}</h1>{sub&&<p className="text-sm text-slate-400 mt-0.5">{sub}</p>}</div>
      {action&&<div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
export function EmptyState({ icon:Icon, message }) {
  return <div className="flex flex-col items-center justify-center py-16 text-center">{Icon&&<Icon size={40} className="text-slate-300 mb-3"/>}<p className="text-slate-500 font-medium">{message}</p></div>;
}
